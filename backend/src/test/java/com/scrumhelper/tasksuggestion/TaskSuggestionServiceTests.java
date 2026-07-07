package com.scrumhelper.tasksuggestion;

import com.scrumhelper.auth.AuthService;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.meeting.MeetingService;
import com.scrumhelper.meeting.dto.MeetingResponse;
import com.scrumhelper.meeting.dto.SaveMeetingRequest;
import com.scrumhelper.specdocument.SpecDocumentService;
import com.scrumhelper.specdocument.dto.GenerateSpecDraftRequest;
import com.scrumhelper.specdocument.dto.SaveSpecDocumentRequest;
import com.scrumhelper.specdocument.dto.SpecDocumentResponse;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.tasksuggestion.dto.AcceptTaskSuggestionRequest;
import com.scrumhelper.tasksuggestion.dto.TaskSuggestionResponse;
import com.scrumhelper.team.TeamService;
import com.scrumhelper.team.dto.CreateTeamRequest;
import com.scrumhelper.team.dto.TeamDetailResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class TaskSuggestionServiceTests {
	@Autowired
	private AuthService authService;

	@Autowired
	private TeamService teamService;

	@Autowired
	private MeetingService meetingService;

	@Autowired
	private SpecDocumentService specDocumentService;

	@Autowired
	private TaskSuggestionService taskSuggestionService;

	@Test
	void settingMainSpecQueuesSuggestionsAndAcceptCreatesTask() {
		TestContext context = createContext();

		specDocumentService.setMainSpecDocument(context.ownerId(), context.specDocument().id());

		List<TaskSuggestionResponse> queued = taskSuggestionService.getQueuedSuggestions(
				context.ownerId(),
				context.team().id()
		);

		assertThat(queued).isNotEmpty();
		assertThat(queued)
				.allSatisfy(suggestion -> {
					assertThat(suggestion.teamId()).isEqualTo(context.team().id());
					assertThat(suggestion.specDocumentId()).isEqualTo(context.specDocument().id());
				});

		TaskSuggestionResponse target = queued.get(0);
		assertThatThrownBy(() -> taskSuggestionService.acceptSuggestion(
				context.ownerId(),
				target.id(),
				new AcceptTaskSuggestionRequest(List.of())
		))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.ASSIGNEE_REQUIRED);

		TaskResponse createdTask = taskSuggestionService.acceptSuggestion(
				context.ownerId(),
				target.id(),
				new AcceptTaskSuggestionRequest(List.of(context.ownerId()))
		);

		assertThat(createdTask.title()).isEqualTo(target.title());
		assertThat(createdTask.assignees().stream().map(assignee -> assignee.id()).toList())
				.containsExactly(context.ownerId());

		assertThatThrownBy(() -> taskSuggestionService.acceptSuggestion(
				context.ownerId(),
				target.id(),
				new AcceptTaskSuggestionRequest(List.of(context.ownerId()))
		))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.TASK_SUGGESTION_ALREADY_ACCEPTED);

		List<TaskSuggestionResponse> remaining = taskSuggestionService.getQueuedSuggestions(
				context.ownerId(),
				context.team().id()
		);
		assertThat(remaining).hasSize(queued.size() - 1);
		assertThat(remaining).noneMatch(suggestion -> suggestion.id().equals(target.id()));
	}

	@Test
	void dismissingSuggestionRemovesItFromQueueAndBlocksAccept() {
		TestContext context = createContext();
		specDocumentService.setMainSpecDocument(context.ownerId(), context.specDocument().id());

		List<TaskSuggestionResponse> queued = taskSuggestionService.getQueuedSuggestions(
				context.ownerId(),
				context.team().id()
		);
		TaskSuggestionResponse target = queued.get(0);

		taskSuggestionService.dismissSuggestion(context.ownerId(), target.id());

		List<TaskSuggestionResponse> remaining = taskSuggestionService.getQueuedSuggestions(
				context.ownerId(),
				context.team().id()
		);
		assertThat(remaining).hasSize(queued.size() - 1);
		assertThat(remaining).noneMatch(suggestion -> suggestion.id().equals(target.id()));

		assertThatThrownBy(() -> taskSuggestionService.acceptSuggestion(
				context.ownerId(),
				target.id(),
				new AcceptTaskSuggestionRequest(List.of(context.ownerId()))
		))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.TASK_SUGGESTION_ALREADY_ACCEPTED);
	}

	@Test
	void settingMainSpecAgainDoesNotDuplicateAlreadyQueuedSuggestions() {
		TestContext context = createContext();

		specDocumentService.setMainSpecDocument(context.ownerId(), context.specDocument().id());
		assertThat(taskSuggestionService.getQueuedSuggestions(context.ownerId(), context.team().id())).isNotEmpty();

		SpecDocumentResponse secondSpec = specDocumentService.createSpecDocument(
				context.ownerId(),
				context.team().id(),
				new SaveSpecDocumentRequest("두 번째 스펙", context.specDocument().content() + "\n추가 요구사항", List.of())
		);
		specDocumentService.setMainSpecDocument(context.ownerId(), secondSpec.id());

		List<TaskSuggestionResponse> queued = taskSuggestionService.getQueuedSuggestions(context.ownerId(), context.team().id());
		assertThat(queued).isNotEmpty();
		assertThat(queued).allMatch(suggestion -> suggestion.specDocumentId().equals(secondSpec.id()));
		assertThat(queued).extracting(TaskSuggestionResponse::title).doesNotHaveDuplicates();
	}

	@Test
	void outsiderCannotReadQueuedSuggestions() {
		TestContext context = createContext();

		assertThatThrownBy(() -> taskSuggestionService.getQueuedSuggestions(
				context.outsiderId(),
				context.team().id()
		))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.NOT_TEAM_MEMBER);
	}

	private TestContext createContext() {
		String stamp = UUID.randomUUID().toString().substring(0, 8);
		Long ownerId = signup("suggest-owner-" + stamp + "@test.com");
		Long outsiderId = signup("suggest-outsider-" + stamp + "@test.com");
		TeamDetailResponse team = teamService.createTeam(
				ownerId,
				new CreateTeamRequest("Suggestion Team " + stamp, "task suggestion test team", null)
		);
		MeetingResponse meeting = meetingService.createMeeting(
				ownerId,
				team.id(),
				new SaveMeetingRequest(
						"Task 추천 회의 " + stamp,
						LocalDateTime.of(2026, 7, 4, 14, 30),
						"스펙 문서에서 task 후보를 만들고 선택한 항목을 실제 task로 생성한다.",
						"task 추천 생성과 수락 흐름을 검증한다."
				)
		);
		String draftContent = specDocumentService.generateDraft(
				ownerId,
				team.id(),
				new GenerateSpecDraftRequest(List.of(meeting.id()))
		).content();
		SpecDocumentResponse specDocument = specDocumentService.createSpecDocument(
				ownerId,
				team.id(),
				new SaveSpecDocumentRequest("Task 추천 스펙 " + stamp, draftContent, List.of(meeting.id()))
		);
		return new TestContext(ownerId, outsiderId, team, specDocument);
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
			Long outsiderId,
			TeamDetailResponse team,
			SpecDocumentResponse specDocument
	) {
	}
}
