package com.scrumhelper.meeting;

import com.scrumhelper.auth.AuthService;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.meeting.dto.MeetingResponse;
import com.scrumhelper.meeting.dto.MeetingSummaryResponse;
import com.scrumhelper.meeting.dto.MeetingTranscriptionResponse;
import com.scrumhelper.meeting.dto.SaveMeetingRequest;
import com.scrumhelper.team.TeamService;
import com.scrumhelper.team.dto.CreateTeamRequest;
import com.scrumhelper.team.dto.TeamDetailResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class MeetingServiceTests {
	@Autowired
	private AuthService authService;

	@Autowired
	private TeamService teamService;

	@Autowired
	private MeetingService meetingService;

	@Test
	void generateSummaryUpdatesMeetingWithLocalFallbackWhenGeminiKeyIsMissing() {
		TestContext context = createContext();

		MeetingSummaryResponse summary = meetingService.generateSummary(context.ownerId(), context.meeting().id());

		assertThat(summary.generatedBy()).isEqualTo("LOCAL_FALLBACK");
		assertThat(summary.meetingId()).isEqualTo(context.meeting().id());
		assertThat(summary.summary()).contains("로그인 API");
		assertThat(summary.meeting().summary()).isEqualTo(summary.summary());

		MeetingResponse reloaded = meetingService.getMeeting(context.ownerId(), context.meeting().id());
		assertThat(reloaded.summary()).isEqualTo(summary.summary());
	}

	@Test
	void teamMemberWhoIsNotAuthorOrLeaderCannotGenerateSummary() {
		TestContext context = createContext();

		assertThatThrownBy(() -> meetingService.generateSummary(context.memberId(), context.meeting().id()))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.MEETING_AUTHOR_OR_LEADER_ONLY);
	}

	@Test
	void transcribeMeetingAudioReturnsLocalFallbackWhenGeminiKeyIsMissing() {
		TestContext context = createContext();
		MockMultipartFile file = new MockMultipartFile(
				"file",
				"meeting.mp3",
				"audio/mpeg",
				new byte[] {1, 2, 3}
		);

		MeetingTranscriptionResponse response = meetingService.transcribeMeetingAudio(context.ownerId(), context.team().id(), file);

		assertThat(response.generatedBy()).isEqualTo("LOCAL_FALLBACK");
		assertThat(response.transcript()).contains("meeting.mp3");
	}

	@Test
	void outsiderCannotTranscribeMeetingAudio() {
		TestContext context = createContext();
		Long outsiderId = signup("meeting-outsider-" + UUID.randomUUID().toString().substring(0, 8) + "@test.com");
		MockMultipartFile file = new MockMultipartFile(
				"file",
				"meeting.mp3",
				"audio/mpeg",
				new byte[] {1, 2, 3}
		);

		assertThatThrownBy(() -> meetingService.transcribeMeetingAudio(outsiderId, context.team().id(), file))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.NOT_TEAM_MEMBER);
	}

	private TestContext createContext() {
		String stamp = UUID.randomUUID().toString().substring(0, 8);
		Long ownerId = signup("meeting-owner-" + stamp + "@test.com");
		Long memberId = signup("meeting-member-" + stamp + "@test.com");
		TeamDetailResponse team = teamService.createTeam(
				ownerId,
				new CreateTeamRequest("Meeting AI Team " + stamp, "meeting ai test team", null)
		);
		teamService.joinTeam(memberId, team.id(), null);

		MeetingResponse meeting = meetingService.createMeeting(
				ownerId,
				team.id(),
				new SaveMeetingRequest(
						"Gemini 요약 회의 " + stamp,
						LocalDateTime.of(2026, 7, 4, 15, 0),
						"""
								로그인 API는 JWT 기반으로 유지한다.
								회의록 요약은 Gemini API를 우선 사용하고 실패하면 로컬 fallback을 사용한다.
								스펙 문서 초안 생성과 task 추천 생성은 사용자가 검토 후 저장한다.
								""",
						null
				)
		);
		return new TestContext(ownerId, memberId, team, meeting);
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
			TeamDetailResponse team,
			MeetingResponse meeting
	) {
	}
}
