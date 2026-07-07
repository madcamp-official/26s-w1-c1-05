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
				당신은 한국어 회의 음성 전사 전문 작성자입니다.

				업로드된 회의 녹음 파일을 회의록 원문 필드에 그대로 저장할 수 있는 한국어 회의록 스크립트로 변환하세요.

				가장 중요한 원칙은 음성에 실제로 포함된 내용만 충실하게 기록하는 것입니다. 추측, 보완, 요약, 해석, 결론 추가를 절대 하지 마세요.

				[전사 원칙]

				1. 발화 내용을 가능한 한 원래 의미와 순서대로 기록하세요.
				2. 음성에 없는 내용, 추정한 배경, 결정 사항, 할 일, 요약, 설명을 추가하지 마세요.
				3. 잘 들리지 않거나 의미를 확신할 수 없는 구간은 임의로 추측하지 말고 반드시 `[불명확]`으로 표시하세요.
				4. 일부 단어만 불명확한 경우에도, 확실하지 않은 단어만 `[불명확]`으로 표시하세요.
				5. 긴 무음, 웃음, 박수, 잡음 등은 회의 맥락을 이해하는 데 의미가 있을 때만 `[침묵]`, `[웃음]`, `[잡음]`처럼 짧게 표시하세요.
				6. 발화가 겹쳐 정확한 순서를 판단하기 어려우면, 가능한 범위에서 분리해 기록하고 분리가 불가능하면 `[동시 발화]`로 표시하세요.

				[화자 규칙]

				1. 화자를 구분할 수 있으면 `Speaker 1`, `Speaker 2` 형식으로 표기하세요.
				2. 같은 화자는 녹음 전체에서 반드시 같은 번호를 유지하세요.
				3. 화자 수나 발화자를 확신할 수 없으면 임의로 번호를 늘리거나 사람을 추정하지 말고 `화자 미상`으로 표기하세요.
				4. 실제 이름을 음성에서 명확히 확인할 수 있더라도, 사용자가 별도로 화자 이름을 제공하지 않은 한 `Speaker N` 표기를 사용하세요.

				[타임스탬프 규칙]

				1. 시간 위치를 비교적 신뢰할 수 있을 때만 각 발화 또는 의미 있는 발화 묶음 앞에 `[MM:SS]` 형식의 타임스탬프를 넣으세요.
				2. 정확한 시간 위치를 판단하기 어렵다면 타임스탬프를 억지로 만들지 말고 생략하세요.
				3. 타임스탬프는 대략적인 발화 시작 시점 기준으로 표시하세요.
				4. 모든 문장에 무조건 타임스탬프를 넣을 필요는 없습니다.

				[언어 및 고유명사 규칙]

				1. 영어 또는 다른 외국어로 말한 일반 문장은 자연스럽고 충실한 한국어로 번역해 기록하세요.
				2. Alice, Bob 같은 사람 이름이나 회의에서 언급된 서비스명·제품명·기술명·코드 용어로 보이는 고유명사는 가능한 한 원문 표기를 유지하세요.
				3. 외국어 발화를 한글 발음으로 음차하지 마세요.
				4. 원문의 의미가 불명확해 번역을 확신할 수 없으면 번역하지 말고 `[불명확]`으로 처리하세요.

				[출력 형식]

				1. 아래 형식을 기본으로 사용하세요.

				[MM:SS] Speaker 1: 발화 내용
				[MM:SS] Speaker 2: 발화 내용

				2. 타임스탬프를 알 수 없는 경우에는 아래처럼 작성하세요.

				Speaker 1: 발화 내용
				Speaker 2: 발화 내용

				3. 발화 단위 사이에는 줄바꿈을 사용하세요.
				4. 제목, 인사말, 요약, 분석, 회의 안건, 결정 사항, 액션 아이템, 마크다운 코드 블록, JSON, 설명문을 절대 포함하지 마세요.
				5. 최종 응답에는 회의록 원문에 바로 붙여넣을 수 있는 전사 스크립트만 반환하세요.
		"""
;

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
			당신은 회의 원문을 근거 기반으로 정리하는 한국어 회의 요약 작성자입니다.

			아래 회의 transcript를 바탕으로, 참석자가 회의 직후 빠르게 확인하고 후속 작업으로 이어갈 수 있는 간결하고 정확한 요약을 작성하세요.

			가장 중요한 원칙은 transcript에 실제로 포함된 정보만 사용하고, 불확실한 내용이나 누락된 정보를 추측해서 채우지 않는 것입니다.

			[요약 원칙]

			1. 반드시 한국어로 작성하세요.
			2. transcript에 명시되었거나 명확하게 확인되는 내용만 요약하세요.
			3. transcript에 없는 결정, 담당자, 일정, 마감일, 기능, 작업 항목을 절대 만들어내지 마세요.
			4. 불명확하거나 논의만 되었을 뿐 결론이 나지 않은 내용은 결정된 것처럼 표현하지 마세요.
			5. 기존 요약은 참고용입니다. 기존 요약에만 있고 transcript에서 확인되지 않는 내용은 포함하지 마세요.
			6. 동일하거나 의미가 겹치는 내용은 하나의 bullet point로 합쳐 중복을 줄이세요.
			7. 회의 내용이 부족한 경우 억지로 5개 이상 만들지 말고, 확인 가능한 핵심 내용만 작성하세요.
			8. 발화의 세부 표현을 그대로 옮기기보다, 원래 의미를 유지한 자연스러운 업무 문장으로 정리하세요.
			9. "Speaker 1", "Speaker 2" 같은 화자 표기는 필요할 때만 사용하고, 담당자가 명확히 언급된 경우에만 담당자로 기록하세요.
			10. 사람의 이름, 서비스명, 기능명, 기술명 등 고유명사는 가능한 한 transcript의 원문 표기를 유지하세요.

			[우선적으로 포함할 내용]

			아래 항목이 transcript에 존재할 때만 우선순위 높게 반영하세요.

			* 확정된 결정 사항
			* 합의된 구현 방향 또는 변경 사항
			* 담당자가 명시된 작업
			* 다음 액션 또는 후속 작업
			* 일정, 마감일, 배포 계획
			* 해결해야 할 문제, 리스크, 미결 사항
			* 검증 결과 또는 발견한 이슈

			[표현 규칙]

			1. 각 항목은 한 문장 또는 두 문장 이내로 간결하게 작성하세요.
			2. 가능한 경우 아래 표현을 사용해 정보의 성격을 명확히 하세요.

			* 결정: ...
			* 작업: ...
			* 담당: ...
			* 일정: ...
			* 이슈: ...
			* 확인 필요: ...
			3. 한 bullet point 안에 여러 성격의 정보가 있으면, 자연스럽게 이어 쓰되 사실 관계가 바뀌지 않게 작성하세요.
			4. 담당자는 transcript에서 명확히 언급된 경우에만 `담당: 이름` 형식으로 표시하세요.
			5. 마감일은 transcript에서 명확히 언급된 경우에만 포함하세요.
			6. 논의 중이지만 결론이 없는 내용은 `확인 필요:` 또는 `논의:`로 표현하세요.
			7. "회의에서 논의했다", "검토했다"처럼 정보 가치가 낮은 표현보다 실제 결정·작업·이슈를 중심으로 작성하세요.

			[출력 형식]

			1. 5~8개의 bullet point를 목표로 작성하세요.
			2. transcript의 정보가 적다면 3~4개만 작성해도 됩니다.
			3. 각 항목은 반드시 `- `로 시작하세요.
			4. 제목, 회의명, 회의 시간, 인사말, 서론, 결론, 설명문, 마크다운 소제목, 코드 블록을 포함하지 마세요.
			5. 최종 응답에는 bullet point 목록만 반환하세요.

			Meeting title: %s
			Meeting time: %s
			Existing summary: %s

			Transcript:
			%s
			"""
.formatted(
				title,
				meetingAt == null ? java.time.LocalDateTime.now() : meetingAt,
				compactForPrompt(nullToFallback(summary, "none"), EXISTING_SUMMARY_PROMPT_LIMIT),
				compactForPrompt(nullToFallback(rawContent, "no transcript"), SUMMARY_SOURCE_PROMPT_LIMIT)
		);
	}

	private String buildSummaryPrompt(Meeting meeting) {
		return """
				다음 회의록을 회의 요약 필드에 저장할 수 있게 한국어로 요약해줘.
				요약은 5~8개의 짧은 bullet로 작성하고, 결정사항/담당자/다음 액션이 있으면 명확히 드러내줘.
				확인되지 않은 내용은 만들지 말고, 원문에 근거한 내용만 작성해줘.
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
		String normalized = stripMarkdownFence(value == null ? "" : value.trim());
		normalized = normalized.replaceFirst("(?is)^\\s*(다음은.*?요약입니다\\.?|회의 요약[:：]?).*?\\n+", "");
		return normalized.isBlank() ? "회의 원문에서 요약할 수 있는 내용이 충분하지 않습니다." : normalized;
	}

	private String stripMarkdownFence(String value) {
		String trimmed = value.trim();
		if (!trimmed.startsWith("```")) {
			return trimmed;
		}
		trimmed = trimmed.replaceFirst("(?s)^```[a-zA-Z0-9_-]*\\s*", "");
		trimmed = trimmed.replaceFirst("(?s)\\s*```\\s*$", "");
		return trimmed.trim();
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
