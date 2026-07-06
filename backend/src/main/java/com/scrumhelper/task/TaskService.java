package com.scrumhelper.task;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.Task;
import com.scrumhelper.domain.task.TaskAssignee;
import com.scrumhelper.domain.task.TaskAssigneeRepository;
import com.scrumhelper.domain.task.TaskCommentRepository;
import com.scrumhelper.domain.task.TaskDependency;
import com.scrumhelper.domain.task.TaskDependencyRepository;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.domain.task.TaskRepository;
import com.scrumhelper.domain.task.TaskStatus;
import com.scrumhelper.domain.task.UserTodoTask;
import com.scrumhelper.domain.task.UserTodoTaskRepository;
import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.team.TeamRepository;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.notification.NotificationEventService;
import com.scrumhelper.specdocument.GeminiSpecDraftClient;
import com.scrumhelper.task.dto.AcceptAiTaskRecommendationRequest;
import com.scrumhelper.task.dto.AiTaskRecommendationResponse;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.task.dto.TaskStatusRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {
	private final TaskRepository taskRepository;
	private final TaskAssigneeRepository taskAssigneeRepository;
	private final TaskCommentRepository taskCommentRepository;
	private final TaskDependencyRepository taskDependencyRepository;
	private final UserTodoTaskRepository userTodoTaskRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;
	private final NotificationEventService notificationEventService;
	private final GeminiSpecDraftClient geminiSpecDraftClient;
	private final ObjectMapper objectMapper;

	public TaskService(
			TaskRepository taskRepository,
			TaskAssigneeRepository taskAssigneeRepository,
			TaskCommentRepository taskCommentRepository,
			TaskDependencyRepository taskDependencyRepository,
			UserTodoTaskRepository userTodoTaskRepository,
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository,
			NotificationEventService notificationEventService,
			GeminiSpecDraftClient geminiSpecDraftClient,
			ObjectMapper objectMapper
	) {
		this.taskRepository = taskRepository;
		this.taskAssigneeRepository = taskAssigneeRepository;
		this.taskCommentRepository = taskCommentRepository;
		this.taskDependencyRepository = taskDependencyRepository;
		this.userTodoTaskRepository = userTodoTaskRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
		this.notificationEventService = notificationEventService;
		this.geminiSpecDraftClient = geminiSpecDraftClient;
		this.objectMapper = objectMapper;
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> getTasks(
			Long currentUserId,
			Long teamId,
			Boolean completed,
			TaskPriority priority,
			Long assigneeId,
			LocalDate dueFrom,
			LocalDate dueTo
	) {
		requireMembership(teamId, currentUserId);
		return taskRepository.findAll(buildSpecification(teamId, completed, priority, dueFrom, dueTo)).stream()
				.filter(task -> assigneeId == null || taskAssigneeRepository.findByTaskId(task.getId()).stream()
						.anyMatch(assignee -> assignee.getUser().getId().equals(assigneeId)))
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> getMyTasks(Long currentUserId, Long teamId, Boolean completed) {
		requireMembership(teamId, currentUserId);
		return taskAssigneeRepository.findByTeamIdAndUserId(teamId, currentUserId).stream()
				.map(TaskAssignee::getTask)
				.filter(task -> completed == null || task.isCompleted() == completed)
				.sorted(Comparator
						.comparing(Task::isCompleted)
						.thenComparing(Task::getDueDate)
						.thenComparing(Task::getCreatedAt))
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public TaskResponse createTask(Long currentUserId, Long teamId, SaveTaskRequest request) {
		Team team = findTeam(teamId);
		requireMembership(teamId, currentUserId);
		User createdBy = findUser(currentUserId);
		validateAssignees(teamId, request.assigneeUserIds());

		Task task = taskRepository.save(Task.create(
				team,
				createdBy,
				request.title().trim(),
				normalizeOptionalText(request.description()),
				request.priority(),
				request.dueDate()
		));
		replaceAssignees(task, team, request.assigneeUserIds());
		return toResponse(task);
	}

	@Transactional(readOnly = true)
	public AiTaskRecommendationResponse generateAiTaskRecommendation(Long currentUserId, Long teamId) {
		Team team = findTeam(teamId);
		requireMembership(teamId, currentUserId);

		AiTaskRecommendationResponse localRecommendation = buildLocalAiTaskRecommendation(team);
		return geminiSpecDraftClient.generateJson(buildAiTaskRecommendationPrompt(team))
				.flatMap(this::parseAiTaskRecommendation)
				.orElse(localRecommendation);
	}

	@Transactional
	public TaskResponse acceptAiTaskRecommendation(
			Long currentUserId,
			Long teamId,
			AcceptAiTaskRecommendationRequest request
	) {
		TaskResponse task = createTask(
				currentUserId,
				teamId,
				new SaveTaskRequest(
						request.title(),
						request.description(),
						request.priority(),
						request.dueDate(),
						List.of(currentUserId)
				)
		);
		addTaskToTodo(teamId, currentUserId, task.id());
		return task;
	}

	@Transactional(readOnly = true)
	public TaskResponse getTask(Long currentUserId, Long taskId) {
		Task task = findTask(taskId);
		requireMembership(task.getTeam().getId(), currentUserId);
		return toResponse(task);
	}

	@Transactional
	public TaskResponse updateTask(Long currentUserId, Long taskId, SaveTaskRequest request) {
		Task task = findTask(taskId);
		Team team = task.getTeam();
		requireMembership(team.getId(), currentUserId);
		validateAssignees(team.getId(), request.assigneeUserIds());

		task.update(
				request.title().trim(),
				normalizeOptionalText(request.description()),
				request.priority(),
				request.dueDate()
		);
		replaceAssignees(task, team, request.assigneeUserIds());
		return toResponse(task);
	}

	@Transactional
	public TaskResponse updateStatus(Long currentUserId, Long taskId, TaskStatusRequest request) {
		Task task = findTask(taskId);
		requireMembership(task.getTeam().getId(), currentUserId);
		task.updateStatus(request.status());
		if (request.status() == TaskStatus.DONE) {
			notificationEventService.createDependencyReadyEvents(task);
		}
		return toResponse(task);
	}

	@Transactional
	public void deleteTask(Long currentUserId, Long taskId) {
		Task task = findTask(taskId);
		requireMembership(task.getTeam().getId(), currentUserId);
		taskDependencyRepository.deleteByPredecessorIdOrSuccessorId(taskId, taskId);
		taskCommentRepository.deleteByTaskId(taskId);
		taskAssigneeRepository.deleteByTaskId(taskId);
		userTodoTaskRepository.deleteByTaskId(taskId);
		taskRepository.delete(task);
	}

	private Specification<Task> buildSpecification(
			Long teamId,
			Boolean completed,
			TaskPriority priority,
			LocalDate dueFrom,
			LocalDate dueTo
	) {
		return (root, query, criteriaBuilder) -> {
			query.distinct(true);
			var predicate = criteriaBuilder.equal(root.get("team").get("id"), teamId);
			if (priority != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("priority"), priority));
			}
			if (completed != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("completed"), completed));
			}
			if (dueFrom != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("dueDate"), dueFrom));
			}
			if (dueTo != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("dueDate"), dueTo));
			}
			return predicate;
		};
	}

	private void replaceAssignees(Task task, Team team, List<Long> assigneeUserIds) {
		List<Long> nextAssigneeIds = assigneeUserIds.stream().distinct().toList();
		taskAssigneeRepository.findByTaskId(task.getId()).stream()
				.map(assignee -> assignee.getUser().getId())
				.filter(userId -> !nextAssigneeIds.contains(userId))
				.forEach(userId -> userTodoTaskRepository.deleteByTeamIdAndUserIdAndTaskId(team.getId(), userId, task.getId()));
		taskAssigneeRepository.deleteByTaskId(task.getId());
		taskAssigneeRepository.flush();
		nextAssigneeIds.stream()
				.map(this::findUser)
				.map(user -> TaskAssignee.create(task, team, user))
				.forEach(taskAssigneeRepository::save);
	}

	private void addTaskToTodo(Long teamId, Long userId, Long taskId) {
		if (userTodoTaskRepository.existsByTeamIdAndUserIdAndTaskId(teamId, userId, taskId)) {
			return;
		}
		Team team = findTeam(teamId);
		User user = findUser(userId);
		Task task = findTask(taskId);
		int sortOrder = userTodoTaskRepository.findByTeamIdAndUserIdOrderBySortOrderAscCreatedAtAsc(teamId, userId).size();
		userTodoTaskRepository.save(UserTodoTask.create(team, user, task, sortOrder));
	}

	private void validateAssignees(Long teamId, List<Long> assigneeUserIds) {
		if (assigneeUserIds == null || assigneeUserIds.isEmpty()) {
			throw new BusinessException(ErrorCode.ASSIGNEE_REQUIRED);
		}
		boolean hasInvalidAssignee = assigneeUserIds.stream()
				.distinct()
				.anyMatch(userId -> !teamMemberRepository.existsByTeamIdAndUserId(teamId, userId));
		if (hasInvalidAssignee) {
			throw new BusinessException(ErrorCode.ASSIGNEE_NOT_TEAM_MEMBER);
		}
	}

	private TaskResponse toResponse(Task task) {
		List<UserSummaryResponse> assignees = taskAssigneeRepository.findByTaskId(task.getId()).stream()
				.map(assignee -> UserSummaryResponse.from(assignee.getUser()))
				.toList();
		return TaskResponse.from(task, assignees, taskCommentRepository.countByTaskId(task.getId()));
	}

	private String buildAiTaskRecommendationPrompt(Team team) {
		return """
				다음 Scrum Helper 팀의 기존 task와 task 관계를 고려해서 지금 추가하면 좋은 task를 정확히 1개만 추천해줘.
				응답은 JSON 객체 하나만 반환해. 설명이나 마크다운은 넣지 마.
				JSON 필드:
				- title: 200자 이하
				- description: 추천 이유와 완료 기준을 포함한 짧은 설명
				- priority: LOW, MEDIUM, HIGH 중 하나
				- dueDate: 오늘 이후 YYYY-MM-DD
				- reason: 기존 task와의 연관성 또는 추천 근거

				팀명: %s
				기존 task:
				%s

				task 관계:
				%s
				""".formatted(
				team.getName(),
				formatTaskContext(team.getId()),
				formatDependencyContext(team.getId())
		);
	}

	private String formatTaskContext(Long teamId) {
		List<Task> tasks = taskRepository.findByTeamIdOrderByCreatedAtAsc(teamId);
		if (tasks.isEmpty()) {
			return "- 아직 등록된 task가 없음";
		}
		return tasks.stream()
				.map(task -> "- #%d [%s/%s] %s, due=%s, assignees=%s%s".formatted(
						task.getId(),
						task.getStatus(),
						task.getPriority(),
						task.getTitle(),
						task.getDueDate(),
						formatAssigneeNames(task.getId()),
						task.getDescription() == null || task.getDescription().isBlank()
								? ""
								: ", description=" + compact(task.getDescription(), 300)
				))
				.collect(java.util.stream.Collectors.joining("\n"));
	}

	private String formatAssigneeNames(Long taskId) {
		List<String> names = taskAssigneeRepository.findByTaskId(taskId).stream()
				.map(assignee -> assignee.getUser().getName())
				.toList();
		return names.isEmpty() ? "none" : String.join(", ", names);
	}

	private String formatDependencyContext(Long teamId) {
		List<TaskDependency> dependencies = taskDependencyRepository.findByPredecessorTeamIdOrderByCreatedAtAsc(teamId);
		if (dependencies.isEmpty()) {
			return "- 등록된 task 관계 없음";
		}
		return dependencies.stream()
				.map(dependency -> "- #%d %s -> #%d %s".formatted(
						dependency.getPredecessor().getId(),
						dependency.getPredecessor().getTitle(),
						dependency.getSuccessor().getId(),
						dependency.getSuccessor().getTitle()
				))
				.collect(java.util.stream.Collectors.joining("\n"));
	}

	private Optional<AiTaskRecommendationResponse> parseAiTaskRecommendation(String content) {
		try {
			JsonNode root = objectMapper.readTree(extractJsonObject(content));
			String title = root.path("title").asText("").trim();
			if (title.isBlank()) {
				return Optional.empty();
			}
			String description = root.path("description").asText("").trim();
			String reason = root.path("reason").asText("").trim();
			return Optional.of(new AiTaskRecommendationResponse(
					truncate(title, 200),
					description.isBlank() ? null : description,
					parsePriority(root.path("priority").asText("")),
					parseDueDate(root.path("dueDate").asText("")),
					reason.isBlank() ? null : reason,
					"GEMINI"
			));
		} catch (Exception ignored) {
			return Optional.empty();
		}
	}

	private AiTaskRecommendationResponse buildLocalAiTaskRecommendation(Team team) {
		List<Task> openTasks = taskRepository.findByTeamIdOrderByCreatedAtAsc(team.getId()).stream()
				.filter(task -> !task.isCompleted())
				.toList();
		if (openTasks.isEmpty()) {
			return new AiTaskRecommendationResponse(
					"MVP 다음 작업 정의",
					"현재 열린 task가 없으므로 다음 구현 범위와 완료 기준을 정리한다.",
					TaskPriority.MEDIUM,
					LocalDate.now().plusDays(1),
					"등록된 미완료 task가 없어 프로젝트 진행을 위한 시작 task를 추천했습니다.",
					"LOCAL_FALLBACK"
			);
		}
		Task source = openTasks.get(0);
		return new AiTaskRecommendationResponse(
				truncate(source.getTitle() + " 완료 기준 점검", 200),
				"기존 task와 연결되는 검증/마무리 작업입니다. 구현 상태를 확인하고 누락된 테스트와 문서를 보강합니다.",
				source.getPriority(),
				source.getDueDate().isBefore(LocalDate.now()) ? LocalDate.now().plusDays(1) : source.getDueDate(),
				"미완료 task #" + source.getId() + "와 직접 연결되는 후속 작업입니다.",
				"LOCAL_FALLBACK"
		);
	}

	private String extractJsonObject(String content) {
		int start = content.indexOf('{');
		int end = content.lastIndexOf('}');
		if (start < 0 || end < start) {
			return content;
		}
		return content.substring(start, end + 1);
	}

	private TaskPriority parsePriority(String value) {
		try {
			return TaskPriority.valueOf(value.trim().toUpperCase());
		} catch (Exception ignored) {
			return TaskPriority.MEDIUM;
		}
	}

	private LocalDate parseDueDate(String value) {
		try {
			LocalDate parsed = LocalDate.parse(value.trim());
			return parsed.isBefore(LocalDate.now()) ? LocalDate.now().plusDays(1) : parsed;
		} catch (Exception ignored) {
			return LocalDate.now().plusDays(1);
		}
	}

	private String compact(String value, int maxLength) {
		String compact = value.replaceAll("\\s+", " ").trim();
		if (compact.length() <= maxLength) {
			return compact;
		}
		return compact.substring(0, maxLength) + "...";
	}

	private String truncate(String value, int maxLength) {
		if (value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}

	private Team findTeam(Long teamId) {
		return teamRepository.findById(teamId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TEAM_NOT_FOUND));
	}

	private Task findTask(Long taskId) {
		return taskRepository.findById(taskId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TASK_NOT_FOUND));
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
	}

	private void requireMembership(Long teamId, Long userId) {
		if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
			throw new BusinessException(ErrorCode.NOT_TEAM_MEMBER);
		}
	}

	private String normalizeOptionalText(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
