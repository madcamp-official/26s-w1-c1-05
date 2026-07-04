package com.scrumhelper.notification;

import com.scrumhelper.auth.AuthService;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.notification.dto.NotificationEventResponse;
import com.scrumhelper.task.TaskDependencyService;
import com.scrumhelper.task.TaskService;
import com.scrumhelper.task.dto.AddTaskDependencyRequest;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskCompletionRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.team.TeamService;
import com.scrumhelper.team.dto.CreateTeamRequest;
import com.scrumhelper.team.dto.TeamDetailResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class NotificationEventServiceTests {
	@Autowired
	private AuthService authService;

	@Autowired
	private TeamService teamService;

	@Autowired
	private TaskService taskService;

	@Autowired
	private TaskDependencyService taskDependencyService;

	@Autowired
	private NotificationEventService notificationEventService;

	@Test
	void completingPredecessorCreatesNotificationForSuccessorAssignees() {
		TestContext context = createContext();
		TaskResponse predecessor = createTask(context.ownerId(), context.team().id(), "선행 task", List.of(context.ownerId()));
		TaskResponse successor = createTask(context.ownerId(), context.team().id(), "후행 task", List.of(context.memberId()));
		taskDependencyService.addDependency(
				context.ownerId(),
				successor.id(),
				new AddTaskDependencyRequest(predecessor.id())
		);

		assertThat(notificationEventService.getMyNotifications(context.memberId(), context.team().id())).isEmpty();

		taskService.updateCompletion(context.ownerId(), predecessor.id(), new TaskCompletionRequest(true));

		List<NotificationEventResponse> notifications = notificationEventService.getMyNotifications(
				context.memberId(),
				context.team().id()
		);
		assertThat(notifications).hasSize(1);
		NotificationEventResponse notification = notifications.get(0);
		assertThat(notification.type()).isEqualTo(NotificationEventService.TASK_DEPENDENCY_READY);
		assertThat(notification.sourceTaskId()).isEqualTo(predecessor.id());
		assertThat(notification.targetTaskId()).isEqualTo(successor.id());
		assertThat(notification.payload()).contains("선행 task", "후행 task");
	}

	@Test
	void completingSamePredecessorAgainDoesNotCreateDuplicateNotification() {
		TestContext context = createContext();
		TaskResponse predecessor = createTask(context.ownerId(), context.team().id(), "중복 선행 task", List.of(context.ownerId()));
		TaskResponse successor = createTask(context.ownerId(), context.team().id(), "중복 후행 task", List.of(context.memberId()));
		taskDependencyService.addDependency(
				context.ownerId(),
				successor.id(),
				new AddTaskDependencyRequest(predecessor.id())
		);

		taskService.updateCompletion(context.ownerId(), predecessor.id(), new TaskCompletionRequest(true));
		taskService.updateCompletion(context.ownerId(), predecessor.id(), new TaskCompletionRequest(false));
		taskService.updateCompletion(context.ownerId(), predecessor.id(), new TaskCompletionRequest(true));

		assertThat(notificationEventService.getMyNotifications(context.memberId(), context.team().id())).hasSize(1);
	}

	@Test
	void outsiderCannotReadNotifications() {
		TestContext context = createContext();

		assertThatThrownBy(() -> notificationEventService.getMyNotifications(context.outsiderId(), context.team().id()))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.NOT_TEAM_MEMBER);
	}

	private TestContext createContext() {
		String stamp = UUID.randomUUID().toString().substring(0, 8);
		Long ownerId = signup("notification-owner-" + stamp + "@test.com");
		Long memberId = signup("notification-member-" + stamp + "@test.com");
		Long outsiderId = signup("notification-outsider-" + stamp + "@test.com");
		TeamDetailResponse team = teamService.createTeam(
				ownerId,
				new CreateTeamRequest("Notification Team " + stamp, "notification test team", null)
		);
		teamService.joinTeam(memberId, team.id(), null);
		return new TestContext(ownerId, memberId, outsiderId, team);
	}

	private TaskResponse createTask(Long currentUserId, Long teamId, String title, List<Long> assigneeUserIds) {
		return taskService.createTask(
				currentUserId,
				teamId,
				new SaveTaskRequest(
						title,
						"notification test",
						TaskPriority.MEDIUM,
						LocalDate.of(2026, 7, 6),
						assigneeUserIds
				)
		);
	}

	private Long signup(String email) {
		return authService.signup(new SignupRequest(
				email.substring(0, email.indexOf('@')),
				email,
				"password"
		)).user().id();
	}

	private record TestContext(Long ownerId, Long memberId, Long outsiderId, TeamDetailResponse team) {
	}
}
