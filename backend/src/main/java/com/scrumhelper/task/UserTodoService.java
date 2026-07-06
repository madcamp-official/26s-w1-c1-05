package com.scrumhelper.task;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.Task;
import com.scrumhelper.domain.task.TaskAssignee;
import com.scrumhelper.domain.task.TaskAssigneeRepository;
import com.scrumhelper.domain.task.TaskCommentRepository;
import com.scrumhelper.domain.task.TaskDependency;
import com.scrumhelper.domain.task.TaskDependencyRepository;
import com.scrumhelper.domain.task.TaskRepository;
import com.scrumhelper.domain.task.UserTodoTask;
import com.scrumhelper.domain.task.UserTodoTaskRepository;
import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.team.TeamRepository;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.task.dto.SaveTodoListRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.task.dto.TodoListResponse;
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
	private final TaskDependencyRepository taskDependencyRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;

	public UserTodoService(
			UserTodoTaskRepository userTodoTaskRepository,
			TaskRepository taskRepository,
			TaskAssigneeRepository taskAssigneeRepository,
			TaskCommentRepository taskCommentRepository,
			TaskDependencyRepository taskDependencyRepository,
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository
	) {
		this.userTodoTaskRepository = userTodoTaskRepository;
		this.taskRepository = taskRepository;
		this.taskAssigneeRepository = taskAssigneeRepository;
		this.taskCommentRepository = taskCommentRepository;
		this.taskDependencyRepository = taskDependencyRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
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
			if (!task.getTeam().getId().equals(teamId) || !taskAssigneeRepository.existsByTaskIdAndUserId(taskId, currentUserId)) {
				throw new BusinessException(ErrorCode.TODO_TASK_NOT_ASSIGNED);
			}
		}

		userTodoTaskRepository.deleteByTeamIdAndUserId(teamId, currentUserId);
		for (int index = 0; index < taskIds.size(); index++) {
			userTodoTaskRepository.save(UserTodoTask.create(team, user, findTask(taskIds.get(index)), index));
		}
		return getTodoList(currentUserId, teamId);
	}

	private List<TaskResponse> getSelectedTasks(Long teamId, Long userId) {
		return userTodoTaskRepository.findByTeamIdAndUserIdOrderBySortOrderAscCreatedAtAsc(teamId, userId).stream()
				.map(UserTodoTask::getTask)
				.filter(task -> taskAssigneeRepository.existsByTaskIdAndUserId(task.getId(), userId))
				.map(this::toResponse)
				.toList();
	}

	private List<TaskResponse> getCandidateTasks(Long teamId, Long userId) {
		Set<Long> selectedIds = userTodoTaskRepository.findByTeamIdAndUserIdOrderBySortOrderAscCreatedAtAsc(teamId, userId).stream()
				.map(todo -> todo.getTask().getId())
				.collect(java.util.stream.Collectors.toSet());
		return taskAssigneeRepository.findByTeamIdAndUserId(teamId, userId).stream()
				.map(TaskAssignee::getTask)
				.filter(task -> !task.isCompleted())
				.sorted(Comparator
						.comparing(Task::getDueDate)
						.thenComparing(Task::getCreatedAt))
				.map(this::toResponse)
				.sorted(Comparator.comparing((TaskResponse task) -> !selectedIds.contains(task.id()))
						.thenComparing(TaskResponse::dueDate)
						.thenComparing(TaskResponse::createdAt))
				.toList();
	}

	private List<TaskResponse> getRecommendedTasks(Long teamId, Long userId) {
		Set<Long> selectedIds = userTodoTaskRepository.findByTeamIdAndUserIdOrderBySortOrderAscCreatedAtAsc(teamId, userId).stream()
				.map(todo -> todo.getTask().getId())
				.collect(java.util.stream.Collectors.toSet());

		return taskAssigneeRepository.findByTeamIdAndUserId(teamId, userId).stream()
				.map(TaskAssignee::getTask)
				.filter(task -> !task.isCompleted())
				.filter(task -> !selectedIds.contains(task.getId()))
				.filter(this::isUnblockedByCompletedDependencies)
				.sorted(Comparator
						.comparing(Task::getDueDate)
						.thenComparing(Task::getCreatedAt))
				.map(this::toResponse)
				.toList();
	}

	private boolean isUnblockedByCompletedDependencies(Task task) {
		List<TaskDependency> blockers = taskDependencyRepository.findBySuccessorId(task.getId());
		return !blockers.isEmpty() && blockers.stream()
				.allMatch(dependency -> dependency.getPredecessor().isCompleted());
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
