package com.scrumhelper.meeting;

import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.meeting.Meeting;
import com.scrumhelper.domain.meeting.MeetingRepository;
import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.team.TeamMember;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.team.TeamRepository;
import com.scrumhelper.domain.team.TeamRole;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.meeting.dto.MeetingResponse;
import com.scrumhelper.meeting.dto.MeetingSummaryResponse;
import com.scrumhelper.meeting.dto.SaveMeetingRequest;
import com.scrumhelper.specdocument.GeminiSpecDraftClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MeetingService {
	private final MeetingRepository meetingRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;
	private final GeminiSpecDraftClient geminiSpecDraftClient;

	public MeetingService(
			MeetingRepository meetingRepository,
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository,
			GeminiSpecDraftClient geminiSpecDraftClient
	) {
		this.meetingRepository = meetingRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
		this.geminiSpecDraftClient = geminiSpecDraftClient;
	}

	@Transactional(readOnly = true)
	public List<MeetingResponse> getMeetings(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return meetingRepository.findByTeamIdOrderByMeetingAtDescCreatedAtDesc(teamId).stream()
				.map(MeetingResponse::from)
				.toList();
	}

	@Transactional
	public MeetingResponse createMeeting(Long currentUserId, Long teamId, SaveMeetingRequest request) {
		Team team = findTeam(teamId);
		requireMembership(teamId, currentUserId);
		User author = findUser(currentUserId);
		Meeting meeting = meetingRepository.save(Meeting.create(
				team,
				author,
				request.title().trim(),
				request.meetingAt(),
				normalizeOptionalText(request.rawContent()),
				normalizeOptionalText(request.summary())
		));
		return MeetingResponse.from(meeting);
	}

	@Transactional(readOnly = true)
	public MeetingResponse getMeeting(Long currentUserId, Long meetingId) {
		Meeting meeting = findMeeting(meetingId);
		requireMembership(meeting.getTeam().getId(), currentUserId);
		return MeetingResponse.from(meeting);
	}

	@Transactional
	public MeetingResponse updateMeeting(Long currentUserId, Long meetingId, SaveMeetingRequest request) {
		Meeting meeting = findMeeting(meetingId);
		requireAuthorOrLeader(meeting, currentUserId);
		meeting.update(
				request.title().trim(),
				request.meetingAt(),
				normalizeOptionalText(request.rawContent()),
				normalizeOptionalText(request.summary())
		);
		return MeetingResponse.from(meeting);
	}

	@Transactional
	public MeetingSummaryResponse generateSummary(Long currentUserId, Long meetingId) {
		Meeting meeting = findMeeting(meetingId);
		requireAuthorOrLeader(meeting, currentUserId);

		Optional<String> generatedSummary = geminiSpecDraftClient.generate(buildSummaryPrompt(meeting));
		String generatedBy = generatedSummary.isPresent() ? "GEMINI" : "LOCAL_FALLBACK";
		String summary = generatedSummary
				.map(this::normalizeGeneratedSummary)
				.orElseGet(() -> buildLocalSummary(meeting));

		meeting.updateSummary(summary);
		return MeetingSummaryResponse.of(MeetingResponse.from(meeting), summary, generatedBy);
	}

	@Transactional
	public void deleteMeeting(Long currentUserId, Long meetingId) {
		Meeting meeting = findMeeting(meetingId);
		requireAuthorOrLeader(meeting, currentUserId);
		meetingRepository.delete(meeting);
	}

	private Team findTeam(Long teamId) {
		return teamRepository.findById(teamId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TEAM_NOT_FOUND));
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
	}

	private Meeting findMeeting(Long meetingId) {
		return meetingRepository.findById(meetingId)
				.orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
	}

	private TeamMember requireMembership(Long teamId, Long userId) {
		return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.NOT_TEAM_MEMBER));
	}

	private void requireAuthorOrLeader(Meeting meeting, Long userId) {
		TeamMember membership = requireMembership(meeting.getTeam().getId(), userId);
		if (!meeting.getAuthor().getId().equals(userId) && membership.getRole() != TeamRole.LEADER) {
			throw new BusinessException(ErrorCode.MEETING_AUTHOR_OR_LEADER_ONLY);
		}
	}

	private String normalizeOptionalText(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private String buildSummaryPrompt(Meeting meeting) {
		return """
				다음 회의록을 Scrum Helper의 회의 요약 필드에 저장할 수 있게 한국어로 요약해줘.
				요약은 5~8개의 짧은 bullet로 작성하고, 결정사항/담당자/다음 액션이 있으면 명확히 드러내줘.
				확인되지 않은 내용은 만들지 말고, 원문에 근거한 내용만 작성해줘.

				회의 제목: %s
				회의 일시: %s
				기존 요약: %s
				회의 원문:
				%s
				""".formatted(
				meeting.getTitle(),
				meeting.getMeetingAt(),
				nullToFallback(meeting.getSummary(), "없음"),
				nullToFallback(meeting.getRawContent(), "원문 없음")
		);
	}

	private String normalizeGeneratedSummary(String value) {
		String normalized = value == null ? "" : value.trim();
		return normalized.isBlank() ? "회의 원문에서 요약할 수 있는 내용이 충분하지 않습니다." : normalized;
	}

	private String buildLocalSummary(Meeting meeting) {
		String source = nullToFallback(meeting.getRawContent(), meeting.getSummary());
		if (source == null || source.isBlank()) {
			return "- 회의 제목: %s\n- 회의 원문이 없어 자동 요약 대신 기본 요약을 생성했습니다.".formatted(meeting.getTitle());
		}

		List<String> points = Arrays.stream(source.split("[\\r\\n]+|(?<=[.!?。！？])\\s+"))
				.map(String::trim)
				.filter(line -> !line.isBlank())
				.limit(6)
				.map(line -> "- " + truncate(line, 180))
				.collect(Collectors.toList());
		if (points.isEmpty()) {
			return "- " + truncate(source.replaceAll("\\s+", " ").trim(), 180);
		}
		return String.join("\n", points);
	}

	private String truncate(String value, int maxLength) {
		if (value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}

	private String nullToFallback(String value, String fallback) {
		return value == null || value.isBlank() ? fallback : value.trim();
	}
}
