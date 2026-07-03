package com.scrumhelper.specdocument;

import com.scrumhelper.auth.AuthService;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.meeting.MeetingService;
import com.scrumhelper.meeting.dto.MeetingResponse;
import com.scrumhelper.meeting.dto.SaveMeetingRequest;
import com.scrumhelper.specdocument.dto.GenerateSpecDraftRequest;
import com.scrumhelper.specdocument.dto.SaveSpecDocumentRequest;
import com.scrumhelper.specdocument.dto.SpecDocumentResponse;
import com.scrumhelper.specdocument.dto.SpecDraftResponse;
import com.scrumhelper.team.TeamService;
import com.scrumhelper.team.dto.CreateTeamRequest;
import com.scrumhelper.team.dto.TeamDetailResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class SpecDocumentServiceTests {
	@Autowired
	private AuthService authService;

	@Autowired
	private TeamService teamService;

	@Autowired
	private MeetingService meetingService;

	@Autowired
	private SpecDocumentService specDocumentService;

	@Test
	void generateAndSaveSpecDocumentFromMeetings() {
		String stamp = UUID.randomUUID().toString().substring(0, 8);
		Long ownerId = signup("owner-" + stamp + "@test.com");
		Long outsiderId = signup("outsider-" + stamp + "@test.com");
		TeamDetailResponse team = teamService.createTeam(
				ownerId,
				new CreateTeamRequest("Spec Team " + stamp, "Spec document test team", null)
		);
		MeetingResponse meeting = meetingService.createMeeting(
				ownerId,
				team.id(),
				new SaveMeetingRequest(
						"Kickoff " + stamp,
						LocalDateTime.of(2026, 7, 3, 16, 30),
						"로그인, 팀, task, 회고록, 스펙 문서 기능을 확인한다.",
						"스펙 문서 초안 생성을 검증한다."
				)
		);

		SpecDraftResponse draft = specDocumentService.generateDraft(
				ownerId,
				team.id(),
				new GenerateSpecDraftRequest(List.of(meeting.id()))
		);

		assertThat(draft.generatedBy()).isEqualTo("LOCAL_FALLBACK");
		assertThat(draft.sourceMeetingIds()).containsExactly(meeting.id());
		assertThat(draft.content()).contains("프로젝트 목적");

		SpecDocumentResponse savedDocument = specDocumentService.createSpecDocument(
				ownerId,
				team.id(),
				new SaveSpecDocumentRequest(draft.title(), draft.content(), draft.sourceMeetingIds())
		);

		assertThat(savedDocument.teamId()).isEqualTo(team.id());
		assertThat(savedDocument.sourceMeetingIds()).containsExactly(meeting.id());

		List<SpecDocumentResponse> documents = specDocumentService.getSpecDocuments(ownerId, team.id());
		assertThat(documents).hasSize(1);
		assertThat(documents.get(0).id()).isEqualTo(savedDocument.id());

		assertThatThrownBy(() -> specDocumentService.generateDraft(
				outsiderId,
				team.id(),
				new GenerateSpecDraftRequest(List.of(meeting.id()))
		))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.NOT_TEAM_MEMBER);
	}

	private Long signup(String email) {
		return authService.signup(new SignupRequest(
				email.substring(0, email.indexOf('@')),
				email,
				"password"
		)).user().id();
	}
}
