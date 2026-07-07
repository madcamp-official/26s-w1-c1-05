package com.scrumhelper.task;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.Task;
import com.scrumhelper.domain.task.TaskAssignee;
import com.scrumhelper.domain.task.TaskAssigneeRepository;
import com.scrumhelper.domain.task.TaskCommentRepository;
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
import com.scrumhelper.task.dto.SaveTodoListRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.task.dto.TodoListResponse;
import com.scrumhelper.task.dto.TodoPromptResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class UserTodoService {
	private final UserTodoTaskRepository userTodoTaskRepository;
	private final TaskRepository taskRepository;
	private final TaskAssigneeRepository taskAssigneeRepository;
	private final TaskCommentRepository taskCommentRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;
	private final GeminiSpecDraftClient geminiSpecDraftClient;
	private final boolean remoteCompletionPromptEnabled;

	public UserTodoService(
			UserTodoTaskRepository userTodoTaskRepository,
			TaskRepository taskRepository,
			TaskAssigneeRepository taskAssigneeRepository,
			TaskCommentRepository taskCommentRepository,
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository,
			GeminiSpecDraftClient geminiSpecDraftClient,
			@Value("${app.ai.todo-prompt.remote-enabled:false}") boolean remoteCompletionPromptEnabled
	) {
		this.userTodoTaskRepository = userTodoTaskRepository;
		this.taskRepository = taskRepository;
		this.taskAssigneeRepository = taskAssigneeRepository;
		this.taskCommentRepository = taskCommentRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
		this.geminiSpecDraftClient = geminiSpecDraftClient;
		this.remoteCompletionPromptEnabled = remoteCompletionPromptEnabled;
	}

	@Transactional(readOnly = true)
	public TodoListResponse getTodoList(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return new TodoListResponse(
				getSelectedTasks(teamId, currentUserId),
				getCandidateTasks(teamId, currentUserId),
				getRecommendedTasks(teamId, currentUserId)
		);
	}

	@Transactional
	public TodoListResponse updateTodoList(Long currentUserId, Long teamId, SaveTodoListRequest request) {
		Team team = findTeam(teamId);
		User user = findUser(currentUserId);
		requireMembership(teamId, currentUserId);

		List<Long> taskIds = request.taskIds().stream()
				.filter(taskId -> taskId != null)
				.collect(java.util.stream.Collectors.collectingAndThen(
						java.util.stream.Collectors.toCollection(LinkedHashSet::new),
						java.util.ArrayList::new
				));

		for (Long taskId : taskIds) {
			Task task = findTask(taskId);
			if (!task.getTeam().getId().equals(teamId)
					|| !taskAssigneeRepository.existsByTaskIdAndUserId(taskId, currentUserId)
					|| !isTodoEligible(task)) {
				throw new BusinessException(ErrorCode.TODO_TASK_NOT_ASSIGNED);
			}
		}

		userTodoTaskRepository.deleteByTeamIdAndUserId(teamId, currentUserId);
		userTodoTaskRepository.flush();
		for (int index = 0; index < taskIds.size(); index++) {
			userTodoTaskRepository.save(UserTodoTask.create(team, user, findTask(taskIds.get(index)), index));
		}
		return getTodoList(currentUserId, teamId);
	}

	@Transactional(readOnly = true)
	public TodoPromptResponse generateCompletionPrompt(Long currentUserId, Long teamId, List<Long> taskIds) {
		requireMembership(teamId, currentUserId);
		List<TaskResponse> selectedTasks = getSelectedTasks(teamId, currentUserId);
		if (!taskIds.isEmpty()) {
			Set<Long> wanted = Set.copyOf(taskIds);
			selectedTasks = selectedTasks.stream()
					.filter(task -> wanted.contains(task.id()))
					.toList();
		}
		if (selectedTasks.isEmpty()) {
			throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Todo list에 task를 1개 이상 추가하세요.");
		}

		String localPrompt = buildLocalCompletionPrompt(selectedTasks);
		if (!remoteCompletionPromptEnabled) {
			return new TodoPromptResponse(localPrompt, "LOCAL_FALLBACK");
		}
		return geminiSpecDraftClient.generate(buildCompletionPromptRequest(selectedTasks))
				.map(prompt -> new TodoPromptResponse(normalizeGeneratedPrompt(prompt), "GEMINI"))
				.orElseGet(() -> new TodoPromptResponse(localPrompt, "LOCAL_FALLBACK"));
	}

	private List<TaskResponse> getSelectedTasks(Long teamId, Long userId) {
		return userTodoTaskRepository.findByTeamIdAndUserIdOrderBySortOrderAscCreatedAtAsc(teamId, userId).stream()
				.map(UserTodoTask::getTask)
				.filter(task -> taskAssigneeRepository.existsByTaskIdAndUserId(task.getId(), userId))
				.filter(this::isTodoEligible)
				.map(this::toResponse)
				.toList();
	}

	private List<TaskResponse> getCandidateTasks(Long teamId, Long userId) {
		Set<Long> selectedIds = userTodoTaskRepository.findByTeamIdAndUserIdOrderBySortOrderAscCreatedAtAsc(teamId, userId).stream()
				.map(todo -> todo.getTask().getId())
				.collect(java.util.stream.Collectors.toSet());
		return taskAssigneeRepository.findByTeamIdAndUserId(teamId, userId).stream()
				.map(TaskAssignee::getTask)
				.filter(this::isTodoEligible)
				.sorted(Comparator.comparing(Task::getCreatedAt))
				.map(this::toResponse)
				.sorted(Comparator.comparing((TaskResponse task) -> !selectedIds.contains(task.id()))
						.thenComparing(TaskResponse::createdAt))
				.toList();
	}

	private List<TaskResponse> getRecommendedTasks(Long teamId, Long userId) {
		Set<Long> selectedIds = userTodoTaskRepository.findByTeamIdAndUserIdOrderBySortOrderAscCreatedAtAsc(teamId, userId).stream()
				.map(todo -> todo.getTask().getId())
				.collect(java.util.stream.Collectors.toSet());

		return taskAssigneeRepository.findByTeamIdAndUserId(teamId, userId).stream()
				.map(TaskAssignee::getTask)
				.filter(this::isTodoEligible)
				.filter(task -> !selectedIds.contains(task.getId()))
				.sorted(Comparator.comparing(Task::getCreatedAt))
				.map(this::toResponse)
				.toList();
	}

	private String buildCompletionPromptRequest(List<TaskResponse> selectedTasks) {
		return """
				너는 Scrum Helper 프로젝트를 함께 진행하는 시니어 페어 개발자다.
				아래 Todo task만 근거로 오늘 바로 실행할 수 있는 작업 브리프를 작성해줘.

				작성 원칙:
				- "AI로서", "물론입니다", "아래와 같이" 같은 도입 문구는 쓰지 마.
				- 새 기능을 임의로 추가하지 말고, 모르는 내용은 확인 질문으로 분리해.
				- 과하게 장황한 설명보다 작업자가 바로 움직일 수 있는 구체적인 문장으로 써.
				- 한국어로 작성하되 Task, API, PR, QA 같은 기술 용어는 자연스럽게 유지해.

				출력 형식:
				## 오늘의 목표
				- Todo 전체를 하나의 목표 문장으로 요약

				## 진행 순서
				1. 선행 관계를 고려한 작업 순서

				## Task별 실행 브리프
				- 각 task마다 완료 기준, 구현 단계, 검증 방법, 주의할 점

				## 확인 질문
				- 진행 전에 팀에 확인해야 할 항목만 정리

				Todo:
				%s
				""".formatted(formatTasksForPrompt(selectedTasks));
	}

	private String buildLocalCompletionPrompt(List<TaskResponse> selectedTasks) {
		return """
				## 오늘의 목표
				선택한 Todo를 완료 가능한 순서로 정리하고, 각 task의 완료 기준과 검증 방법을 명확히 한다.

				## 진행 순서
				1. 영향 범위가 큰 task부터 완료 기준을 확인한다.
				2. 구현 또는 문서 수정이 필요한 항목을 처리한다.
				3. 마지막에 전체 흐름을 다시 실행해 회귀 여부를 확인한다.

				## Task별 실행 브리프
				%s

				## 확인 질문
				- 각 task의 담당자와 완료 기준이 현재 팀 합의와 일치하는가?
				- 완료 후 어떤 화면 또는 API로 검증할지 정해져 있는가?
				""".formatted(formatTasksAsBrief(selectedTasks));
	}

	private String formatTasksForPrompt(List<TaskResponse> tasks) {
		return tasks.stream()
				.map(task -> "- #%d [%s] %s%s".formatted(
						task.id(),
						task.priority(),
						task.title(),
						task.description() == null || task.description().isBlank()
								? ""
								: "\n  description: " + compact(task.description(), 300)
				))
				.collect(java.util.stream.Collectors.joining("\n"));
	}

	private String formatTasksAsBrief(List<TaskResponse> tasks) {
		return tasks.stream()
				.map(task -> """
						### #%d %s
						- 우선순위: %s
						- 완료 기준: task 설명에 적힌 동작이 실제 화면 또는 API에서 재현 가능해야 한다.
						- 실행 단계: 관련 코드/문서를 확인하고, 필요한 수정 후 해당 기능 흐름을 직접 검증한다.
						- 검증 방법: 성공 케이스와 실패 케이스를 최소 1개씩 확인한다.%s
						""".formatted(
						task.id(),
						task.title(),
						task.priority(),
						task.description() == null || task.description().isBlank()
								? ""
								: "\n- 참고 설명: " + compact(task.description(), 300)
				))
				.collect(java.util.stream.Collectors.joining("\n"));
	}

	private String compact(String value, int maxLength) {
		String compact = value.replaceAll("\\s+", " ").trim();
		if (compact.length() <= maxLength) {
			return compact;
		}
		return compact.substring(0, maxLength) + "...";
	}

	private String normalizeGeneratedPrompt(String value) {
		String normalized = stripMarkdownFence(value == null ? "" : value.trim());
		normalized = normalized.replaceFirst("(?is)^\\s*(물론입니다|좋습니다|네[,!\\s]*|아래와 같이|다음은).*?\\n+", "");
		return normalized.isBlank()
				? "선택한 Todo를 완료하기 위한 작업 브리프를 생성하지 못했습니다. Todo 항목을 다시 확인하세요."
				: normalized.trim();
	}

	private String stripMarkdownFence(String value) {
		String trimmed = value.trim();
		if (!trimmed.startsWith("```")) {
			return trimmed;
		}
		trimmed = trimmed.replaceFirst("(?s)^```[a-zA-Z0-9_-]*\\s*", "");
		trimmed = trimmed.replaceFirst("(?s)\\s*```\\s*$", "");
		return trimmed.trim();
	}

	private boolean isTodoEligible(Task task) {
		TaskStatus status = task.getStatus();
		return status == TaskStatus.BACKLOG || status == TaskStatus.IN_PROGRESS;
	}

	private TaskResponse toResponse(Task task) {
		List<UserSummaryResponse> assignees = taskAssigneeRepository.findByTaskId(task.getId()).stream()
				.map(assignee -> UserSummaryResponse.from(assignee.getUser()))
				.toList();
		return TaskResponse.from(task, assignees, taskCommentRepository.countByTaskId(task.getId()));
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
}
