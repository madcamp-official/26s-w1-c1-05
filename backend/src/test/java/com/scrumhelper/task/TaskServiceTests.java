package com.scrumhelper.task;

import com.scrumhelper.auth.AuthService;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.domain.task.TaskStatus;
import com.scrumhelper.task.dto.AcceptAiTaskRecommendationRequest;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.SaveTodoListRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.task.dto.TaskStatusRequest;
import com.scrumhelper.task.dto.TodoListResponse;
import com.scrumhelper.task.dto.TodoPromptResponse;
import com.scrumhelper.team.TeamService;
import com.scrumhelper.team.dto.CreateTeamRequest;
import com.scrumhelper.team.dto.TeamDetailResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class TaskServiceTests {
	@Autowired
	private AuthService authService;

	@Autowired
	private TeamService teamService;

	@Autowired
	private TaskService taskService;

	@Autowired
	private UserTodoService userTodoService;

	@Test
	void getMyTasksReturnsOnlyTasksAssignedToCurrentUser() {
		TestContext context = createContext();
		TaskResponse mineIncomplete = createTask(context.ownerId(), context.team().id(), "내 미완료 task", List.of(context.memberId()));
		TaskResponse mineDone = createTask(context.ownerId(), context.team().id(), "내 완료 task", List.of(context.memberId()));
		taskService.updateStatus(context.ownerId(), mineDone.id(), new TaskStatusRequest(TaskStatus.DONE, null));
		createTask(context.ownerId(), context.team().id(), "다른 사람 task", List.of(context.ownerId()));

		List<TaskResponse> myTasks = taskService.getMyTasks(context.memberId(), context.team().id(), null);
		List<TaskResponse> incompleteTasks = taskService.getMyTasks(context.memberId(), context.team().id(), false);
		List<TaskResponse> completedTasks = taskService.getMyTasks(context.memberId(), context.team().id(), true);

		assertThat(myTasks).extracting(TaskResponse::id).containsExactly(mineIncomplete.id(), mineDone.id());
		assertThat(incompleteTasks).extracting(TaskResponse::id).containsExactly(mineIncomplete.id());
		assertThat(completedTasks).extracting(TaskResponse::id).containsExactly(mineDone.id());
	}

	@Test
	void acceptAiTaskRecommendationAddsExistingAssignedTaskToTodo() {
		TestContext context = createContext();
		TaskResponse existing = createTask(context.ownerId(), context.team().id(), "기존 추천 대상 task", List.of(context.memberId()));

		TaskResponse added = taskService.acceptAiTaskRecommendation(
				context.memberId(),
				context.team().id(),
				new AcceptAiTaskRecommendationRequest(existing.id())
		);
		TodoListResponse todoList = userTodoService.getTodoList(context.memberId(), context.team().id());

		assertThat(added.id()).isEqualTo(existing.id());
		assertThat(todoList.selectedTasks()).extracting(TaskResponse::id).containsExactly(existing.id());
	}

	@Test
	void generateAiTaskRecommendationReturnsExistingAssignedTask() {
		TestContext context = createContext();
		TaskResponse existing = createTask(context.ownerId(), context.team().id(), "AI가 고를 기존 task", List.of(context.memberId()));

		var recommendation = taskService.generateAiTaskRecommendation(context.memberId(), context.team().id());

		assertThat(recommendation.generatedBy()).isEqualTo("LOCAL_FALLBACK");
		assertThat(recommendation.task().id()).isEqualTo(existing.id());
	}

	@Test
	void generateCompletionPromptReturnsFallbackPromptWhenGeminiKeyIsMissing() {
		TestContext context = createContext();
		TaskResponse task = createTask(context.ownerId(), context.team().id(), "프롬프트 대상 task", List.of(context.memberId()));
		userTodoService.updateTodoList(context.memberId(), context.team().id(), new SaveTodoListRequest(List.of(task.id())));

		TodoPromptResponse response = userTodoService.generateCompletionPrompt(context.memberId(), context.team().id());

		assertThat(response.generatedBy()).isEqualTo("LOCAL_FALLBACK");
		assertThat(response.prompt()).contains("프롬프트 대상 task");
	}

	@Test
	void outsiderCannotGetMyTasksForTeam() {
		TestContext context = createContext();

		assertThatThrownBy(() -> taskService.getMyTasks(context.outsiderId(), context.team().id(), null))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.NOT_TEAM_MEMBER);
	}

	private TaskResponse createTask(Long currentUserId, Long teamId, String title, List<Long> assigneeUserIds) {
		return taskService.createTask(
				currentUserId,
				teamId,
				new SaveTaskRequest(
						title,
						"내 담당 task API 검증",
						TaskPriority.MEDIUM,
						assigneeUserIds
				)
		);
	}

	private TestContext createContext() {
		String stamp = UUID.randomUUID().toString().substring(0, 8);
		Long ownerId = signup("task-owner-" + stamp + "@test.com");
		Long memberId = signup("task-member-" + stamp + "@test.com");
		Long outsiderId = signup("task-outsider-" + stamp + "@test.com");
		TeamDetailResponse team = teamService.createTeam(
				ownerId,
				new CreateTeamRequest("My Task Team " + stamp, "my task test team", null)
		);
		teamService.joinTeam(memberId, team.id(), null);
		return new TestContext(ownerId, memberId, outsiderId, team);
	}

	private Long signup(String email) {
		return authService.signup(new SignupRequest(
				email.substring(0, email.indexOf('@')),
				email,
				"password"
		)).user().id();
	}

	private record TestContext(
			Long ownerId,
			Long memberId,
			Long outsiderId,
			TeamDetailResponse team
	) {
	}
}
