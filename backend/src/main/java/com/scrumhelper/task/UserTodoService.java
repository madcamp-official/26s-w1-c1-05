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
	public TodoPromptResponse generateCompletionPrompt(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		List<TaskResponse> selectedTasks = getSelectedTasks(teamId, currentUserId);
		if (selectedTasks.isEmpty()) {
			throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Todo list에 task를 1개 이상 추가하세요.");
		}

		String localPrompt = buildLocalCompletionPrompt(selectedTasks);
		if (!remoteCompletionPromptEnabled) {
			return new TodoPromptResponse(localPrompt, "LOCAL_FALLBACK");
		}
		return geminiSpecDraftClient.generate(buildCompletionPromptRequest(selectedTasks))
				.map(prompt -> new TodoPromptResponse(prompt.trim(), "GEMINI"))
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
				다음 Scrum Helper Todo list의 모든 task를 완료하기 위해 사용할 수 있는 실행 프롬프트를 한국어로 작성해줘.
				요구사항:
				1. 사용자가 AI에게 그대로 붙여넣어도 되는 프롬프트 형태로 작성해.
				2. task별 완료 기준, 작업 순서, 산출물, 주의할 점을 포함해.
				3. 마크다운은 사용해도 되지만 불필요한 설명은 넣지 마.
				4. task 목록에 없는 새 기능을 임의로 추가하지 마.

				Todo task 목록:
				%s
				""".formatted(formatTasksForPrompt(selectedTasks));
	}

	private String buildLocalCompletionPrompt(List<TaskResponse> selectedTasks) {
		return """
				아래 Todo task들을 모두 완료하기 위한 실행 계획을 세워줘.
				각 task마다 완료 기준, 필요한 구현/검증 단계, 예상 리스크를 정리하고, 의존성이 있어 보이는 순서대로 진행 순서를 제안해줘.

				%s
				""".formatted(formatTasksForPrompt(selectedTasks));
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

	private String compact(String value, int maxLength) {
		String compact = value.replaceAll("\\s+", " ").trim();
		if (compact.length() <= maxLength) {
			return compact;
		}
		return compact.substring(0, maxLength) + "...";
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
