package com.scrumhelper.task;

import com.scrumhelper.auth.AuthService;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.task.dto.AddTaskDependencyRequest;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskDependencyResponse;
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
class TaskDependencyServiceTests {
	@Autowired
	private AuthService authService;

	@Autowired
	private TeamService teamService;

	@Autowired
	private TaskService taskService;

	@Autowired
	private TaskDependencyService taskDependencyService;

	@Test
	void addListAndRemoveTaskDependency() {
		TestContext context = createContext();
		TaskResponse predecessor = createTask(context.ownerId(), context.team().id(), "선행 task");
		TaskResponse successor = createTask(context.ownerId(), context.team().id(), "후행 task");

		TaskDependencyResponse dependency = taskDependencyService.addDependency(
				context.ownerId(),
				successor.id(),
				new AddTaskDependencyRequest(predecessor.id())
		);

		assertThat(dependency.predecessorTaskId()).isEqualTo(predecessor.id());
		assertThat(dependency.successorTaskId()).isEqualTo(successor.id());

		List<TaskDependencyResponse> dependencies = taskDependencyService.getDependencies(context.ownerId(), context.team().id());
		assertThat(dependencies).extracting(TaskDependencyResponse::id).containsExactly(dependency.id());

		taskDependencyService.removeDependency(context.ownerId(), successor.id(), predecessor.id());
		assertThat(taskDependencyService.getDependencies(context.ownerId(), context.team().id())).isEmpty();
	}

	@Test
	void dependencyValidationRejectsInvalidRelations() {
		TestContext context = createContext();
		TaskResponse first = createTask(context.ownerId(), context.team().id(), "첫 번째 task");
		TaskResponse second = createTask(context.ownerId(), context.team().id(), "두 번째 task");
		TaskResponse third = createTask(context.ownerId(), context.team().id(), "세 번째 task");
		TeamDetailResponse otherTeam = teamService.createTeam(
				context.ownerId(),
				new CreateTeamRequest("Other Dependency Team " + UUID.randomUUID().toString().substring(0, 8), null, null)
		);
		TaskResponse otherTeamTask = createTask(context.ownerId(), otherTeam.id(), "다른 팀 task");

		assertBusinessError(
				() -> taskDependencyService.addDependency(
						context.ownerId(),
						first.id(),
						new AddTaskDependencyRequest(first.id())
				),
				ErrorCode.TASK_DEPENDENCY_SELF_REFERENCE
		);
		assertBusinessError(
				() -> taskDependencyService.addDependency(
						context.ownerId(),
						first.id(),
						new AddTaskDependencyRequest(otherTeamTask.id())
				),
				ErrorCode.TASK_NOT_SAME_TEAM
		);

		taskDependencyService.addDependency(context.ownerId(), second.id(), new AddTaskDependencyRequest(first.id()));
		assertBusinessError(
				() -> taskDependencyService.addDependency(
						context.ownerId(),
						second.id(),
						new AddTaskDependencyRequest(first.id())
				),
				ErrorCode.TASK_DEPENDENCY_ALREADY_EXISTS
		);

		taskDependencyService.addDependency(context.ownerId(), third.id(), new AddTaskDependencyRequest(second.id()));
		assertBusinessError(
				() -> taskDependencyService.addDependency(
						context.ownerId(),
						first.id(),
						new AddTaskDependencyRequest(third.id())
				),
				ErrorCode.TASK_DEPENDENCY_CYCLE
		);
	}

	@Test
	void outsiderCannotReadOrWriteDependencies() {
		TestContext context = createContext();
		TaskResponse predecessor = createTask(context.ownerId(), context.team().id(), "선행 task");
		TaskResponse successor = createTask(context.ownerId(), context.team().id(), "후행 task");

		assertBusinessError(
				() -> taskDependencyService.getDependencies(context.outsiderId(), context.team().id()),
				ErrorCode.NOT_TEAM_MEMBER
		);
		assertBusinessError(
				() -> taskDependencyService.addDependency(
						context.outsiderId(),
						successor.id(),
						new AddTaskDependencyRequest(predecessor.id())
				),
				ErrorCode.NOT_TEAM_MEMBER
		);
	}

	@Test
	void deletingTaskRemovesRelatedDependencies() {
		TestContext context = createContext();
		TaskResponse predecessor = createTask(context.ownerId(), context.team().id(), "삭제될 선행 task");
		TaskResponse successor = createTask(context.ownerId(), context.team().id(), "후행 task");
		taskDependencyService.addDependency(context.ownerId(), successor.id(), new AddTaskDependencyRequest(predecessor.id()));

		taskService.deleteTask(context.ownerId(), predecessor.id());

		assertThat(taskDependencyService.getDependencies(context.ownerId(), context.team().id())).isEmpty();
	}

	private TestContext createContext() {
		String stamp = UUID.randomUUID().toString().substring(0, 8);
		Long ownerId = signup("dependency-owner-" + stamp + "@test.com");
		Long outsiderId = signup("dependency-outsider-" + stamp + "@test.com");
		TeamDetailResponse team = teamService.createTeam(
				ownerId,
				new CreateTeamRequest("Dependency Team " + stamp, "dependency test team", null)
		);
		return new TestContext(ownerId, outsiderId, team);
	}

	private TaskResponse createTask(Long currentUserId, Long teamId, String title) {
		return taskService.createTask(
				currentUserId,
				teamId,
				new SaveTaskRequest(
						title,
						"dependency test",
						TaskPriority.MEDIUM,
						LocalDate.of(2026, 7, 6),
						List.of(currentUserId)
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

	private void assertBusinessError(ThrowingAction action, ErrorCode expectedErrorCode) {
		assertThatThrownBy(action::run)
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(expectedErrorCode);
	}

	@FunctionalInterface
	private interface ThrowingAction {
		void run();
	}

	private record TestContext(Long ownerId, Long outsiderId, TeamDetailResponse team) {
	}
}
