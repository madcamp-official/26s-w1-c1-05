package com.scrumhelper.notification;

import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.notification.NotificationEvent;
import com.scrumhelper.domain.notification.NotificationEventRepository;
import com.scrumhelper.domain.task.Task;
import com.scrumhelper.domain.task.TaskAssigneeRepository;
import com.scrumhelper.domain.task.TaskDependency;
import com.scrumhelper.domain.task.TaskDependencyRepository;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.notification.dto.NotificationEventResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationEventService {
	public static final String TASK_DEPENDENCY_READY = "TASK_DEPENDENCY_READY";

	private final NotificationEventRepository notificationEventRepository;
	private final TaskDependencyRepository taskDependencyRepository;
	private final TaskAssigneeRepository taskAssigneeRepository;
	private final TeamMemberRepository teamMemberRepository;

	public NotificationEventService(
			NotificationEventRepository notificationEventRepository,
			TaskDependencyRepository taskDependencyRepository,
			TaskAssigneeRepository taskAssigneeRepository,
			TeamMemberRepository teamMemberRepository
	) {
		this.notificationEventRepository = notificationEventRepository;
		this.taskDependencyRepository = taskDependencyRepository;
		this.taskAssigneeRepository = taskAssigneeRepository;
		this.teamMemberRepository = teamMemberRepository;
	}

	@Transactional(readOnly = true)
	public List<NotificationEventResponse> getMyNotifications(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return notificationEventRepository.findByTeamIdAndRecipientIdOrderByCreatedAtDesc(teamId, currentUserId).stream()
				.map(NotificationEventResponse::from)
				.toList();
	}

	@Transactional
	public void createDependencyReadyEvents(Task completedPredecessor) {
		if (!completedPredecessor.isCompleted()) {
			return;
		}
		List<TaskDependency> dependencies = taskDependencyRepository.findByPredecessorId(completedPredecessor.getId());
		for (TaskDependency dependency : dependencies) {
			Task successor = dependency.getSuccessor();
			taskAssigneeRepository.findByTaskId(successor.getId()).stream()
					.map(assignee -> assignee.getUser())
					.forEach(recipient -> createDependencyReadyEvent(completedPredecessor, successor, recipient));
		}
	}

	private void createDependencyReadyEvent(Task predecessor, Task successor, User recipient) {
		boolean alreadyExists = notificationEventRepository.existsByRecipientIdAndTypeAndSourceTaskIdAndTargetTaskId(
				recipient.getId(),
				TASK_DEPENDENCY_READY,
				predecessor.getId(),
				successor.getId()
		);
		if (alreadyExists) {
			return;
		}
		notificationEventRepository.save(NotificationEvent.create(
				successor.getTeam(),
				recipient,
				TASK_DEPENDENCY_READY,
				predecessor.getId(),
				successor.getId(),
				buildPayload(predecessor, successor)
		));
	}

	private String buildPayload(Task predecessor, Task successor) {
		return """
				{"message":"선행 task가 완료되어 후행 task를 진행할 수 있습니다.","predecessorTitle":"%s","successorTitle":"%s"}
				""".formatted(escape(predecessor.getTitle()), escape(successor.getTitle())).trim();
	}

	private String escape(String value) {
		return value
				.replace("\\", "\\\\")
				.replace("\"", "\\\"");
	}

	private void requireMembership(Long teamId, Long userId) {
		if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
			throw new BusinessException(ErrorCode.NOT_TEAM_MEMBER);
		}
	}
}
