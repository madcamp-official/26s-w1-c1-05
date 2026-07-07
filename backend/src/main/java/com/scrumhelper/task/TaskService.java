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
import com.scrumhelper.specdocument.GeminiSpecDraftClient;
import com.scrumhelper.task.dto.AcceptAiTaskRecommendationRequest;
import com.scrumhelper.task.dto.AiTaskRecommendationResponse;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.task.dto.TaskStatusRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {
	private final TaskRepository taskRepository;
	private final TaskAssigneeRepository taskAssigneeRepository;
	private final TaskCommentRepository taskCommentRepository;
	private final UserTodoTaskRepository userTodoTaskRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;
	private final GeminiSpecDraftClient geminiSpecDraftClient;
	private final ObjectMapper objectMapper;
	private final boolean remoteTaskRecommendationEnabled;

	public TaskService(
			TaskRepository taskRepository,
			TaskAssigneeRepository taskAssigneeRepository,
			TaskCommentRepository taskCommentRepository,
			UserTodoTaskRepository userTodoTaskRepository,
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository,
			GeminiSpecDraftClient geminiSpecDraftClient,
			ObjectMapper objectMapper,
			@Value("${app.ai.task-recommendation.remote-enabled:false}") boolean remoteTaskRecommendationEnabled
	) {
		this.taskRepository = taskRepository;
		this.taskAssigneeRepository = taskAssigneeRepository;
		this.taskCommentRepository = taskCommentRepository;
		this.userTodoTaskRepository = userTodoTaskRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
		this.geminiSpecDraftClient = geminiSpecDraftClient;
		this.objectMapper = objectMapper;
		this.remoteTaskRecommendationEnabled = remoteTaskRecommendationEnabled;
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> getTasks(
			Long currentUserId,
			Long teamId,
			Boolean completed,
			TaskPriority priority,
			Long assigneeId
	) {
		requireMembership(teamId, currentUserId);
		Sort sort = Sort.by(Sort.Direction.ASC, "sortOrder").and(Sort.by(Sort.Direction.ASC, "createdAt"));
		return taskRepository.findAll(buildSpecification(teamId, completed, priority), sort).stream()
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
		if (taskRepository.existsByTeamIdAndTitleIgnoreCase(teamId, request.title().trim())) {
			throw new BusinessException(ErrorCode.TASK_TITLE_DUPLICATE);
		}

		Task task = Task.create(
				team,
				createdBy,
				request.title().trim(),
				normalizeOptionalText(request.description()),
				request.priority()
		);
		task.assignSortOrder((int) taskRepository.countByTeamIdAndStatus(teamId, TaskStatus.BACKLOG));
		taskRepository.save(task);
		replaceAssignees(task, team, request.assigneeUserIds());
		return toResponse(task);
	}

	@Transactional(readOnly = true)
	public AiTaskRecommendationResponse generateAiTaskRecommendation(Long currentUserId, Long teamId, List<Long> excludeTaskIds) {
		Team team = findTeam(teamId);
		requireMembership(teamId, currentUserId);
		List<Task> candidates = getTodoRecommendationCandidates(teamId, currentUserId).stream()
				.filter(task -> excludeTaskIds == null || !excludeTaskIds.contains(task.getId()))
				.toList();
		if (candidates.isEmpty()) {
			throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Todo에 추가할 수 있는 기존 task가 없습니다.");
		}

		AiTaskRecommendationResponse localRecommendation = buildLocalAiTaskRecommendation(candidates);
		if (!remoteTaskRecommendationEnabled) {
			return localRecommendation;
		}
		return geminiSpecDraftClient.generateJson(buildAiTaskRecommendationPrompt(team, candidates))
				.flatMap(content -> parseAiTaskRecommendation(content, candidates))
				.orElse(localRecommendation);
	}

	@Transactional
	public TaskResponse acceptAiTaskRecommendation(
			Long currentUserId,
			Long teamId,
			AcceptAiTaskRecommendationRequest request
	) {
		requireMembership(teamId, currentUserId);
		Task task = findTask(request.taskId());
		if (!task.getTeam().getId().equals(teamId) || !taskAssigneeRepository.existsByTaskIdAndUserId(task.getId(), currentUserId)) {
			throw new BusinessException(ErrorCode.TODO_TASK_NOT_ASSIGNED);
		}
		if (task.isCompleted()) {
			throw new BusinessException(ErrorCode.VALIDATION_ERROR, "완료된 task는 Todo에 추가할 수 없습니다.");
		}
		addTaskToTodo(teamId, currentUserId, task.getId());
		return toResponse(task);
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
		if (taskRepository.existsByTeamIdAndTitleIgnoreCaseAndIdNot(team.getId(), request.title().trim(), taskId)) {
			throw new BusinessException(ErrorCode.TASK_TITLE_DUPLICATE);
		}

		task.update(
				request.title().trim(),
				normalizeOptionalText(request.description()),
				request.priority()
		);
		replaceAssignees(task, team, request.assigneeUserIds());
		return toResponse(task);
	}

	@Transactional
	public TaskResponse updateStatus(Long currentUserId, Long taskId, TaskStatusRequest request) {
		Task task = findTask(taskId);
		requireMembership(task.getTeam().getId(), currentUserId);
		TaskStatus previousStatus = task.getStatus();
		TaskStatus nextStatus = request.status();

		List<Task> columnTasks = new ArrayList<>(taskRepository
				.findByTeamIdAndStatusOrderBySortOrderAscCreatedAtAsc(task.getTeam().getId(), nextStatus));
		columnTasks.removeIf(candidate -> candidate.getId().equals(taskId));
		int position = request.position() == null
				? columnTasks.size()
				: Math.max(0, Math.min(request.position(), columnTasks.size()));
		columnTasks.add(position, task);
		for (int i = 0; i < columnTasks.size(); i++) {
			columnTasks.get(i).assignSortOrder(i);
		}

		task.updateStatus(nextStatus);
		if (nextStatus == TaskStatus.DONE && previousStatus != TaskStatus.DONE) {
			userTodoTaskRepository.deleteByTaskId(taskId);
		}
		return toResponse(task);
	}

	@Transactional
	public void deleteTask(Long currentUserId, Long taskId) {
		Task task = findTask(taskId);
		requireMembership(task.getTeam().getId(), currentUserId);
		taskCommentRepository.deleteByTaskId(taskId);
		taskAssigneeRepository.deleteByTaskId(taskId);
		userTodoTaskRepository.deleteByTaskId(taskId);
		taskRepository.delete(task);
	}

	private Specification<Task> buildSpecification(
			Long teamId,
			Boolean completed,
			TaskPriority priority
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
		Task task = findTask(taskId);
		if (!task.getTeam().getId().equals(teamId) || !taskAssigneeRepository.existsByTaskIdAndUserId(taskId, userId)) {
			throw new BusinessException(ErrorCode.TODO_TASK_NOT_ASSIGNED);
		}
		if (task.getStatus() == TaskStatus.DONE) {
			throw new BusinessException(ErrorCode.VALIDATION_ERROR, "완료된 task는 Todo에 추가할 수 없습니다.");
		}
		moveToInProgressIfNeeded(task);
		if (userTodoTaskRepository.existsByTeamIdAndUserIdAndTaskId(teamId, userId, taskId)) {
			return;
		}
		Team team = findTeam(teamId);
		User user = findUser(userId);
		int sortOrder = userTodoTaskRepository.findByTeamIdAndUserIdOrderBySortOrderAscCreatedAtAsc(teamId, userId).size();
		userTodoTaskRepository.save(UserTodoTask.create(team, user, task, sortOrder));
	}

	private void moveToInProgressIfNeeded(Task task) {
		if (task.getStatus() != TaskStatus.BACKLOG) {
			return;
		}
		task.assignSortOrder((int) taskRepository.countByTeamIdAndStatus(task.getTeam().getId(), TaskStatus.IN_PROGRESS));
		task.updateStatus(TaskStatus.IN_PROGRESS);
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

	private String buildAiTaskRecommendationPrompt(Team team, List<Task> candidates) {
		return """
			당신은 사용자가 개인 Todo에 추가할 기존 Task를 고르는 추천 도우미입니다.

			아래의 `Todo 추가 가능 후보` 중에서, 지금 개인 Todo에 추가했을 때 가장 우선순위가 높은 기존 Task를 정확히 1개 선택하세요.

			가장 중요한 원칙은 후보 목록에 실제로 존재하는 정보만 근거로 사용하고, 후보에 없는 Task·일정·담당자·상황을 절대 만들어내지 않는 것입니다.
			이 시스템의 이름이나 현재 서비스의 기능을 추천 근거에 섞지 마세요. 입력된 Task 데이터만 근거로 판단하세요.

			[선택 범위]

			1. 추천 대상은 반드시 `Todo 추가 가능 후보`에 포함된 Task 중 하나여야 합니다.
			2. 후보 목록에 없는 Task를 새로 만들거나, 팀 전체 Task 맥락에만 있는 Task를 선택하면 안 됩니다.
			3. `taskId`는 후보 목록에 표시된 id를 값과 자료형까지 그대로 복사하세요.

			* 후보의 id가 숫자면 숫자로 반환하세요.
			* 후보의 id가 문자열이면 문자열로 반환하세요.
			4. 후보 목록은 Todo에 추가 가능한 Task만 포함한다고 가정합니다. 반드시 그중 하나를 선택하세요.
			5. 입력에 없는 정보는 추측하지 마세요.

			[추천 판단 기준]

			아래 기준을 위에서 아래 순서대로 적용하세요. 모든 기준은 입력에 실제로 제공된 정보가 있을 때만 사용하세요.

			1. 현재 사용자에게 할당되어 있거나, 현재 사용자의 역할과 직접 연결된 Task를 우선합니다.
			2. 중요도가 높은 Task를 우선합니다.

			* High > Medium > Low
			3. 마감일이 명시되어 있다면, 기한이 지났거나 임박한 Task를 우선합니다.
			4. 현재 진행 중이거나, 팀 전체 Task 맥락에서 다음 작업으로 명확히 언급된 Task를 우선합니다.
			5. 팀 전체 Task 맥락에서 다른 작업의 진행에 중요한 선행 작업 또는 핵심 구현 범위로 확인되는 Task를 우선합니다.
			6. 위 기준으로 우선순위를 구분하기 어렵다면, 생성 시점이 더 최근인 Task를 우선합니다.
			7. 제목만 비슷하거나 일반적이라는 이유만으로 Task를 추천하지 마세요.
			8. 완료되었거나 취소된 것으로 표시된 Task는 추천하지 마세요. 단, 후보 목록에 이미 포함된 경우에도 다른 유효 후보를 우선 선택하세요.

			[reason 작성 규칙]

			1. `reason`은 한국어로 한 문장 또는 두 문장 이내로 작성하세요.
			2. 추천 근거는 입력에서 확인 가능한 사실만 사용하세요.
			3. 가능한 경우 중요도, 담당자, 마감일, 진행 상태, 팀 맥락 중 실제로 제공된 근거를 구체적으로 언급하세요.
			4. “가장 좋아 보입니다”, “중요해 보입니다”처럼 근거 없는 표현은 사용하지 마세요.
			5. Task 제목, 담당자, 일정, 상태를 입력에 없는 형태로 만들어내지 마세요.

			[출력 규칙]

			1. 반드시 유효한 JSON 객체 하나만 반환하세요.
			2. 마크다운 코드 블록, 제목, 설명, 인사말, 추가 필드, 배열을 포함하지 마세요.
			3. JSON 필드는 정확히 아래 두 개만 포함하세요.

			{
			"taskId": 후보 목록의 기존 task id,
			"reason": "입력에 근거한 간결한 추천 이유"
			}

			팀명: %s

			Todo 추가 가능 후보:
			%s

			팀 전체 Task 맥락:
			%s
			"""
	.formatted(
				team.getName(),
				formatCandidateTaskContext(candidates),
				formatTaskContext(team.getId())
		);
	}

	private List<Task> getTodoRecommendationCandidates(Long teamId, Long userId) {
		return taskAssigneeRepository.findByTeamIdAndUserId(teamId, userId).stream()
				.map(TaskAssignee::getTask)
				.filter(task -> !task.isCompleted())
				.filter(task -> !userTodoTaskRepository.existsByTeamIdAndUserIdAndTaskId(teamId, userId, task.getId()))
				.sorted(Comparator.comparing(Task::getCreatedAt))
				.toList();
	}

	private String formatCandidateTaskContext(List<Task> tasks) {
		return tasks.stream()
				.map(task -> "- taskId=%d [%s/%s] %s%s".formatted(
						task.getId(),
						task.getStatus(),
						task.getPriority(),
						task.getTitle(),
						task.getDescription() == null || task.getDescription().isBlank()
								? ""
								: ", description=" + compact(task.getDescription(), 160)
				))
				.collect(java.util.stream.Collectors.joining("\n"));
	}

	private String formatTaskContext(Long teamId) {
		List<Task> tasks = taskRepository.findByTeamIdOrderByCreatedAtAsc(teamId);
		if (tasks.isEmpty()) {
			return "- 아직 등록된 task가 없음";
		}
		return tasks.stream()
				.limit(20)
				.map(task -> "- #%d [%s/%s] %s, assignees=%s%s".formatted(
						task.getId(),
						task.getStatus(),
						task.getPriority(),
						task.getTitle(),
						formatAssigneeNames(task.getId()),
						task.getDescription() == null || task.getDescription().isBlank()
								? ""
								: ", description=" + compact(task.getDescription(), 160)
				))
				.collect(java.util.stream.Collectors.joining("\n"));
	}

	private String formatAssigneeNames(Long taskId) {
		List<String> names = taskAssigneeRepository.findByTaskId(taskId).stream()
				.map(assignee -> assignee.getUser().getName())
				.toList();
		return names.isEmpty() ? "none" : String.join(", ", names);
	}

	private Optional<AiTaskRecommendationResponse> parseAiTaskRecommendation(String content, List<Task> candidates) {
		try {
			JsonNode root = objectMapper.readTree(extractJsonObject(content));
			Long taskId = parseTaskId(root.path("taskId"));
			if (taskId == null) {
				return Optional.empty();
			}
			String reason = root.path("reason").asText("").trim();
			return candidates.stream()
					.filter(task -> task.getId().equals(taskId))
					.findFirst()
					.map(task -> new AiTaskRecommendationResponse(
							toResponse(task),
							reason.isBlank() ? "기존 task 목록을 고려해 추천했습니다." : reason,
							"GEMINI"
					));
		} catch (Exception ignored) {
			return Optional.empty();
		}
	}

	private Long parseTaskId(JsonNode node) {
		if (node.canConvertToLong()) {
			return node.asLong();
		}
		try {
			String value = node.asText("").trim();
			return value.isBlank() ? null : Long.valueOf(value);
		} catch (Exception ignored) {
			return null;
		}
	}

	private AiTaskRecommendationResponse buildLocalAiTaskRecommendation(List<Task> candidates) {
		Task source = candidates.stream()
				.min(Comparator
						.comparingInt(this::statusRecommendationRank)
						.thenComparingInt(this::priorityRecommendationRank)
						.thenComparing(Task::getCreatedAt))
				.orElse(candidates.get(0));
		return new AiTaskRecommendationResponse(
				toResponse(source),
				buildLocalRecommendationReason(source),
				"LOCAL_FALLBACK"
		);
	}

	private int statusRecommendationRank(Task task) {
		return task.getStatus() == TaskStatus.IN_PROGRESS ? 0 : 1;
	}

	private int priorityRecommendationRank(Task task) {
		return switch (task.getPriority()) {
			case HIGH -> 0;
			case MEDIUM -> 1;
			case LOW -> 2;
		};
	}

	private String buildLocalRecommendationReason(Task task) {
		String statusReason = task.getStatus() == TaskStatus.IN_PROGRESS
				? "이미 진행 중인 task라 이어서 처리하기 좋습니다."
				: "아직 Todo에 없는 미완료 task입니다.";
		return "%s 중요도 %s 기준으로 우선 확인할 만합니다.".formatted(statusReason, task.getPriority());
	}

	private String extractJsonObject(String content) {
		int start = content.indexOf('{');
		int end = content.lastIndexOf('}');
		if (start < 0 || end < start) {
			return content;
		}
		return content.substring(start, end + 1);
	}

	private String compact(String value, int maxLength) {
		String compact = value.replaceAll("\\s+", " ").trim();
		if (compact.length() <= maxLength) {
			return compact;
		}
		return compact.substring(0, maxLength) + "...";
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
