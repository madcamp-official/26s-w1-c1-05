package com.scrumhelper.specdocument;

import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.meeting.Meeting;
import com.scrumhelper.domain.meeting.MeetingRepository;
import com.scrumhelper.domain.specdocument.SpecDocument;
import com.scrumhelper.domain.specdocument.SpecDocumentRepository;
import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.team.TeamMember;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.team.TeamRepository;
import com.scrumhelper.domain.team.TeamRole;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.specdocument.dto.GenerateSpecDraftRequest;
import com.scrumhelper.specdocument.dto.SaveSpecDocumentRequest;
import com.scrumhelper.specdocument.dto.SpecDocumentResponse;
import com.scrumhelper.specdocument.dto.SpecDraftResponse;
import com.scrumhelper.specdocument.dto.UpdateSpecDocumentRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SpecDocumentService {
	private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

	private final SpecDocumentRepository specDocumentRepository;
	private final MeetingRepository meetingRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;
	private final GeminiSpecDraftClient geminiSpecDraftClient;

	public SpecDocumentService(
			SpecDocumentRepository specDocumentRepository,
			MeetingRepository meetingRepository,
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository,
			GeminiSpecDraftClient geminiSpecDraftClient
	) {
		this.specDocumentRepository = specDocumentRepository;
		this.meetingRepository = meetingRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
		this.geminiSpecDraftClient = geminiSpecDraftClient;
	}

	@Transactional(readOnly = true)
	public List<SpecDocumentResponse> getSpecDocuments(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return specDocumentRepository.findByTeamIdOrderByUpdatedAtDescCreatedAtDesc(teamId).stream()
				.map(SpecDocumentResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public SpecDraftResponse generateDraft(Long currentUserId, Long teamId, GenerateSpecDraftRequest request) {
		Team team = findTeam(teamId);
		requireMembership(teamId, currentUserId);
		List<Long> meetingIds = normalizeIds(request.meetingIds());
		List<Meeting> meetings = findMeetings(teamId, meetingIds);
		String prompt = buildPrompt(team, meetings);
		return geminiSpecDraftClient.generate(prompt)
				.map(content -> new SpecDraftResponse(
						buildTitle(team),
						content,
						meetingIds,
						"GEMINI"
				))
				.orElseGet(() -> new SpecDraftResponse(
						buildTitle(team),
						buildLocalDraft(team, meetings),
						meetingIds,
						"LOCAL_FALLBACK"
				));
	}

	@Transactional
	public SpecDocumentResponse createSpecDocument(Long currentUserId, Long teamId, SaveSpecDocumentRequest request) {
		Team team = findTeam(teamId);
		requireMembership(teamId, currentUserId);
		User createdBy = findUser(currentUserId);
		List<Long> sourceMeetingIds = normalizeIds(request.sourceMeetingIds());
		if (!sourceMeetingIds.isEmpty()) {
			findMeetings(teamId, sourceMeetingIds);
		}
		SpecDocument document = specDocumentRepository.save(SpecDocument.create(
				team,
				createdBy,
				request.title().trim(),
				request.content().trim(),
				serializeIds(sourceMeetingIds)
		));
		return SpecDocumentResponse.from(document);
	}

	@Transactional(readOnly = true)
	public SpecDocumentResponse getSpecDocument(Long currentUserId, Long documentId) {
		SpecDocument document = findSpecDocument(documentId);
		requireMembership(document.getTeam().getId(), currentUserId);
		return SpecDocumentResponse.from(document);
	}

	@Transactional
	public SpecDocumentResponse updateSpecDocument(Long currentUserId, Long documentId, UpdateSpecDocumentRequest request) {
		SpecDocument document = findSpecDocument(documentId);
		requireAuthorOrLeader(document, currentUserId);
		List<Long> sourceMeetingIds = normalizeIds(request.sourceMeetingIds());
		if (!sourceMeetingIds.isEmpty()) {
			findMeetings(document.getTeam().getId(), sourceMeetingIds);
		}
		document.update(request.title().trim(), request.content().trim(), serializeIds(sourceMeetingIds));
		return SpecDocumentResponse.from(document);
	}

	@Transactional
	public void deleteSpecDocument(Long currentUserId, Long documentId) {
		SpecDocument document = findSpecDocument(documentId);
		requireAuthorOrLeader(document, currentUserId);
		specDocumentRepository.delete(document);
	}

	@Transactional
	public SpecDocumentResponse setMainSpecDocument(Long currentUserId, Long documentId) {
		SpecDocument document = findSpecDocument(documentId);
		Long teamId = document.getTeam().getId();
		requireMembership(teamId, currentUserId);

		Optional<SpecDocument> currentMain = specDocumentRepository.findByTeamIdAndIsMainTrue(teamId);
		if (currentMain.isPresent() && !currentMain.get().getId().equals(document.getId())) {
			currentMain.get().unmarkMain();
		}
		document.markAsMain();
		return SpecDocumentResponse.from(document);
	}

	private SpecDocument findSpecDocument(Long documentId) {
		return specDocumentRepository.findById(documentId)
				.orElseThrow(() -> new BusinessException(ErrorCode.SPEC_DOCUMENT_NOT_FOUND));
	}

	private void requireAuthorOrLeader(SpecDocument document, Long userId) {
		TeamMember membership = requireMembership(document.getTeam().getId(), userId);
		if (!document.getCreatedBy().getId().equals(userId) && membership.getRole() != TeamRole.LEADER) {
			throw new BusinessException(ErrorCode.SPEC_DOCUMENT_AUTHOR_OR_LEADER_ONLY);
		}
	}

	private Team findTeam(Long teamId) {
		return teamRepository.findById(teamId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TEAM_NOT_FOUND));
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
	}

	private TeamMember requireMembership(Long teamId, Long userId) {
		return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.NOT_TEAM_MEMBER));
	}

	private List<Meeting> findMeetings(Long teamId, List<Long> meetingIds) {
		if (meetingIds.isEmpty()) {
			throw new BusinessException(ErrorCode.MEETING_NOT_FOUND);
		}
		List<Meeting> meetings = meetingRepository.findByTeamIdAndIdInOrderByMeetingAtAscCreatedAtAsc(teamId, meetingIds);
		if (meetings.size() != meetingIds.size()) {
			throw new BusinessException(ErrorCode.MEETING_NOT_FOUND);
		}
		return meetings;
	}

	private List<Long> normalizeIds(List<Long> ids) {
		if (ids == null) {
			return List.of();
		}
		Set<Long> uniqueIds = ids.stream()
				.filter(id -> id != null && id > 0)
				.collect(Collectors.toCollection(LinkedHashSet::new));
		return List.copyOf(uniqueIds);
	}

	private String serializeIds(List<Long> ids) {
		if (ids.isEmpty()) {
			return null;
		}
		return ids.stream()
				.map(String::valueOf)
				.collect(Collectors.joining(","));
	}

	private String buildPrompt(Team team, List<Meeting> meetings) {
		return """
				다음 회의록들을 바탕으로 웹 기반 Scrum Helper 프로젝트의 스펙 문서 초안을 한국어 Markdown으로 작성해줘.
				반드시 다음 섹션을 포함해줘: 프로젝트 목적, 예상 사용자, 핵심 기능, 화면 구성, 데이터 모델, API 후보, Task 후보, 남은 의사결정.
				과장하지 말고 회의록에서 확인할 수 있는 내용과 추론한 내용을 구분해줘.

				팀 이름: %s

				회의록:
				%s
				""".formatted(team.getName(), buildMeetingContext(meetings));
	}

	private String buildMeetingContext(List<Meeting> meetings) {
		return meetings.stream()
				.map(meeting -> """
						- 제목: %s
						  일시: %s
						  요약: %s
						  원문: %s
						""".formatted(
						meeting.getTitle(),
						meeting.getMeetingAt().format(DATE_TIME_FORMATTER),
						nullToFallback(meeting.getSummary(), "요약 없음"),
						nullToFallback(meeting.getRawContent(), "원문 없음")
				))
				.collect(Collectors.joining("\n"));
	}

	private String buildLocalDraft(Team team, List<Meeting> meetings) {
		String meetingEvidence = meetings.stream()
				.map(meeting -> "- %s (%s): %s".formatted(
						meeting.getTitle(),
						meeting.getMeetingAt().format(DATE_TIME_FORMATTER),
						nullToFallback(meeting.getSummary(), nullToFallback(meeting.getRawContent(), "기록 내용 없음"))
				))
				.collect(Collectors.joining("\n"));

		return """
				# %s 스펙 문서 초안

				## 프로젝트 목적
				회의록을 바탕으로 팀의 Scrum 진행, Task 관리, 회고 기록, 회의 기록을 한 곳에서 관리하는 웹 서비스를 구현합니다.

				## 예상 사용자
				- 소규모 프로젝트를 진행하는 2인 이상 팀
				- 팀장: 팀 생성, 팀원 관리, 팀장 변경, 주요 설정 관리
				- 팀원: Task 수행, 회의록 확인, 회고 작성, 의견 댓글 작성

				## 핵심 기능
				- 회원가입 및 JWT 기반 로그인
				- 팀 생성, 공개 팀 즉시 가입, 비밀번호 또는 초대코드 기반 가입
				- Task 생성, 중요도 설정, 복수 담당자 배정, 완료/미완료 상태 관리
				- Task 댓글을 통한 의견 기록
				- 회의록 작성 및 여러 회의록 기반 스펙 문서 초안 생성
				- 회고록 일지 작성과 공동 작업자 관리

				## 화면 구성
				- 팀 목록: 가입 가능한 팀 확인, 팀 생성, 팀 가입
				- 팀 대시보드: KPI, 성장 나무, 빠른 이동
				- Task: 칸반 형태 목록, 상세/댓글
				- 회의: 회의록 목록과 상세
				- 스펙 문서: 회의록 선택, 초안 생성, 저장 문서 목록
				- 회고록: KPT 성격의 일지형 기록
				- 팀원/설정: 팀원 목록, 팀장 변경, 가입 방식 관리

				## 데이터 모델
				- User, Team, TeamMember
				- Task, TaskAssignee, TaskComment
				- Meeting
				- SpecDocument
				- Retrospective, RetrospectiveCollaborator

				## API 후보
				- GET /api/teams/{teamId}/meetings
				- POST /api/teams/{teamId}/spec-documents/draft
				- POST /api/teams/{teamId}/spec-documents
				- GET /api/teams/{teamId}/spec-documents

				## Task 후보
				- 회의록 선택 UI 구현
				- 스펙 초안 생성 API 구현
				- Gemini API 키가 없을 때 로컬 초안 생성
				- 생성된 초안 저장 및 목록 조회
				- 저장된 스펙 문서 기반 Task 추천 기능 확장

				## 회의록 근거
				%s

				## 남은 의사결정
				- 스펙 문서 수정/삭제 권한 범위
				- Gemini 응답 실패 시 사용자에게 보여줄 메시지 수준
				- 스펙 문서에서 Task 자동 추천으로 넘길 항목 형식
				""".formatted(team.getName(), meetingEvidence);
	}

	private String buildTitle(Team team) {
		return team.getName() + " 스펙 문서 초안";
	}

	private String nullToFallback(String value, String fallback) {
		return value == null || value.isBlank() ? fallback : value.trim();
	}
}
