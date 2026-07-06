package com.scrumhelper.task;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.Task;
import com.scrumhelper.domain.task.TaskAssignee;
import com.scrumhelper.domain.task.TaskAssigneeRepository;
import com.scrumhelper.domain.task.TaskCommentRepository;
import com.scrumhelper.domain.task.TaskDependencyRepository;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.domain.task.TaskRepository;
import com.scrumhelper.domain.task.TaskStatus;
import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.team.TeamRepository;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.notification.NotificationEventService;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.task.dto.TaskStatusRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class TaskService {
	private final TaskRepository taskRepository;
	private final TaskAssigneeRepository taskAssigneeRepository;
	private final TaskCommentRepository taskCommentRepository;
	private final TaskDependencyRepository taskDependencyRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;
	private final NotificationEventService notificationEventService;

	public TaskService(
			TaskRepository taskRepository,
			TaskAssigneeRepository taskAssigneeRepository,
			TaskCommentRepository taskCommentRepository,
			TaskDependencyRepository taskDependencyRepository,
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository,
			NotificationEventService notificationEventService
	) {
		this.taskRepository = taskRepository;
		this.taskAssigneeRepository = taskAssigneeRepository;
		this.taskCommentRepository = taskCommentRepository;
		this.taskDependencyRepository = taskDependencyRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
		this.notificationEventService = notificationEventService;
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
		taskAssigneeRepository.deleteByTaskId(task.getId());
		taskAssigneeRepository.flush();
		assigneeUserIds.stream()
				.distinct()
				.map(this::findUser)
				.map(user -> TaskAssignee.create(task, team, user))
				.forEach(taskAssigneeRepository::save);
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
