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
import com.scrumhelper.meeting.dto.GenerateMeetingSummaryRequest;
import com.scrumhelper.meeting.dto.MeetingResponse;
import com.scrumhelper.meeting.dto.MeetingSummaryDraftResponse;
import com.scrumhelper.meeting.dto.MeetingSummaryResponse;
import com.scrumhelper.meeting.dto.MeetingTranscriptionResponse;
import com.scrumhelper.meeting.dto.SaveMeetingRequest;
import com.scrumhelper.specdocument.GeminiSpecDraftClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MeetingService {
	private static final int SUMMARY_SOURCE_PROMPT_LIMIT = 6000;
	private static final int EXISTING_SUMMARY_PROMPT_LIMIT = 1200;

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
	public MeetingTranscriptionResponse transcribeMeetingAudio(Long currentUserId, Long teamId, MultipartFile file) {
		requireMembership(teamId, currentUserId);
		if (file == null || file.isEmpty()) {
			throw new BusinessException(ErrorCode.VALIDATION_ERROR, "녹음 파일을 업로드하세요.");
		}

		String originalFilename = file.getOriginalFilename();
		String mimeType = normalizeMimeType(file.getContentType(), originalFilename);
		byte[] audioBytes = readFileBytes(file);
		String prompt = """
				업로드된 회의 녹음 파일을 Scrum Helper에 저장할 한국어 회의록 script로 변환해줘.
				요구사항:
				1. 가능한 경우 화자를 Speaker 1, Speaker 2처럼 구분해줘.
				2. 가능한 경우 타임스탬프를 MM:SS 형식으로 포함해줘.
				3. 들리지 않거나 확실하지 않은 부분은 [불명확]으로 표시해줘.
				4. 영어 등 외국어 발화는 발음을 한글로 음차하지 말고, 의미를 자연스러운 한국어로 번역해 기록해줘.
				5. 사람 이름, 서비스명, 기술명처럼 고유명사로 보이는 영어는 가능한 원문 표기(Alice, Bob, Scrum Helper, Todo, Task 등)를 유지해줘.
				6. 요약이나 해석은 넣지 말고, 회의록 rawContent에 붙여넣기 좋은 script만 반환해줘.
				""";

		return geminiSpecDraftClient.transcribeAudio(prompt, audioBytes, mimeType, originalFilename)
				.map(transcript -> new MeetingTranscriptionResponse(transcript, "GEMINI"))
				.orElseGet(() -> new MeetingTranscriptionResponse(buildLocalTranscriptionFallback(originalFilename, file.getSize()), "LOCAL_FALLBACK"));
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

		Optional<String> generatedSummary = geminiSpecDraftClient.generate(buildSummaryPrompt(
				meeting.getTitle(),
				meeting.getMeetingAt(),
				meeting.getSummary(),
				meeting.getRawContent()
		));
		String generatedBy = generatedSummary.isPresent() ? "GEMINI" : "LOCAL_FALLBACK";
		String summary = generatedSummary
				.map(this::normalizeGeneratedSummary)
				.orElseGet(() -> buildLocalSummary(meeting.getTitle(), meeting.getSummary(), meeting.getRawContent()));

		meeting.updateSummary(summary);
		return MeetingSummaryResponse.of(MeetingResponse.from(meeting), summary, generatedBy);
	}

	@Transactional(readOnly = true)
	public MeetingSummaryDraftResponse generateSummaryDraft(
			Long currentUserId,
			Long teamId,
			GenerateMeetingSummaryRequest request
	) {
		requireMembership(teamId, currentUserId);
		String title = request.title() == null || request.title().isBlank() ? "Untitled meeting" : request.title().trim();
		Optional<String> generatedSummary = geminiSpecDraftClient.generate(buildSummaryPrompt(
				title,
				request.meetingAt(),
				request.summary(),
				request.rawContent()
		));
		String generatedBy = generatedSummary.isPresent() ? "GEMINI" : "LOCAL_FALLBACK";
		String summary = generatedSummary
				.map(this::normalizeGeneratedSummary)
				.orElseGet(() -> buildLocalSummary(title, request.summary(), request.rawContent()));
		return new MeetingSummaryDraftResponse(summary, generatedBy);
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

	private String buildSummaryPrompt(String title, java.time.LocalDateTime meetingAt, String summary, String rawContent) {
		return """
				Summarize the following scrum meeting transcript in Korean for Scrum Helper.
				Write 5 to 8 concise bullet points. Highlight decisions, owners, blockers, and next actions when present.
				Do not invent facts that are not present in the transcript.
				Only label something as a blocker when the transcript explicitly says it is blocked, blocking, 막힘, or 블로커.
				If someone asks for help, write it as 지원 필요 or 확인 필요, not as a blocker.
				Return bullet points only. Do not include headings, meeting title, meeting time, or preface text.

				Meeting title: %s
				Meeting time: %s
				Existing summary: %s
				Transcript:
				%s
				""".formatted(
				title,
				meetingAt == null ? java.time.LocalDateTime.now() : meetingAt,
				compactForPrompt(nullToFallback(summary, "none"), EXISTING_SUMMARY_PROMPT_LIMIT),
				compactForPrompt(nullToFallback(rawContent, "no transcript"), SUMMARY_SOURCE_PROMPT_LIMIT)
		);
	}

	private String buildSummaryPrompt(Meeting meeting) {
		return """
				다음 회의록을 Scrum Helper의 회의 요약 필드에 저장할 수 있게 한국어로 요약해줘.
				요약은 5~8개의 짧은 bullet로 작성하고, 결정사항/담당자/다음 액션이 있으면 명확히 드러내줘.
				확인되지 않은 내용은 만들지 말고, 원문에 근거한 내용만 작성해줘.
				원문에서 blocked, blocking, 막힘, 블로커라고 명시한 경우에만 블로커로 표기해줘.
				도움이 필요하다는 표현은 블로커가 아니라 지원 필요 또는 확인 필요로 표기해줘.
				제목, 회의 시간, 도입 문장 없이 bullet 목록만 반환해줘.

				회의 제목: %s
				회의 일시: %s
				기존 요약: %s
				회의 원문:
				%s
				""".formatted(
				meeting.getTitle(),
				meeting.getMeetingAt(),
				compactForPrompt(nullToFallback(meeting.getSummary(), "없음"), EXISTING_SUMMARY_PROMPT_LIMIT),
				compactForPrompt(nullToFallback(meeting.getRawContent(), "원문 없음"), SUMMARY_SOURCE_PROMPT_LIMIT)
		);
	}

	private String normalizeGeneratedSummary(String value) {
		String normalized = value == null ? "" : value.trim();
		return normalized.isBlank() ? "회의 원문에서 요약할 수 있는 내용이 충분하지 않습니다." : normalized;
	}

	private String buildLocalSummary(String title, String existingSummary, String rawContent) {
		String source = nullToFallback(rawContent, existingSummary);
		if (source == null || source.isBlank()) {
			return "- 회의 제목: %s\n- 회의 원문이 없어 기본 요약을 생성했습니다.".formatted(title);
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

	private String compactForPrompt(String value, int maxLength) {
		if (value == null || value.isBlank()) {
			return "";
		}
		String compact = value.replaceAll("\\s+", " ").trim();
		if (compact.length() <= maxLength) {
			return compact;
		}
		return compact.substring(0, maxLength) + "\n...(중략: 프롬프트 크기 절감)";
	}

	private byte[] readFileBytes(MultipartFile file) {
		try {
			return file.getBytes();
		} catch (IOException exception) {
			throw new BusinessException(ErrorCode.VALIDATION_ERROR, "녹음 파일을 읽을 수 없습니다.");
		}
	}

	private String normalizeMimeType(String contentType, String originalFilename) {
		if (contentType != null && contentType.startsWith("audio/")) {
			return contentType;
		}
		if (originalFilename != null) {
			String lowerFilename = originalFilename.toLowerCase();
			if (lowerFilename.endsWith(".mp3")) {
				return "audio/mpeg";
			}
			if (lowerFilename.endsWith(".m4a")) {
				return "audio/mp4";
			}
			if (lowerFilename.endsWith(".wav")) {
				return "audio/wav";
			}
			if (lowerFilename.endsWith(".webm")) {
				return "audio/webm";
			}
			if (lowerFilename.endsWith(".ogg")) {
				return "audio/ogg";
			}
		}
		return "audio/mpeg";
	}

	private String buildLocalTranscriptionFallback(String originalFilename, long fileSize) {
		return """
				[LOCAL_FALLBACK]
				녹음 파일을 업로드했지만 Gemini API 키가 없거나 외부 transcription 호출에 실패해 자동 script 변환을 완료하지 못했습니다.
				파일명: %s
				파일 크기: %d bytes

				회의 원문을 직접 입력하거나, Gemini API 키 설정 후 다시 업로드하세요.
				""".formatted(
				originalFilename == null || originalFilename.isBlank() ? "unknown" : originalFilename,
				fileSize
		);
	}
}
