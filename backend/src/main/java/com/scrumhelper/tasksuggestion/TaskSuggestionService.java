package com.scrumhelper.tasksuggestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.specdocument.SpecDocument;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.domain.tasksuggestion.TaskSuggestion;
import com.scrumhelper.domain.tasksuggestion.TaskSuggestionRepository;
import com.scrumhelper.domain.tasksuggestion.TaskSuggestionStatus;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.specdocument.GeminiSpecDraftClient;
import com.scrumhelper.task.TaskService;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.tasksuggestion.dto.AcceptTaskSuggestionRequest;
import com.scrumhelper.tasksuggestion.dto.TaskSuggestionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class TaskSuggestionService {
	private final TaskSuggestionRepository taskSuggestionRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final TaskService taskService;
	private final GeminiSpecDraftClient geminiSpecDraftClient;
	private final ObjectMapper objectMapper;
	private final boolean remoteTaskSuggestionEnabled;

	public TaskSuggestionService(
			TaskSuggestionRepository taskSuggestionRepository,
			TeamMemberRepository teamMemberRepository,
			TaskService taskService,
			GeminiSpecDraftClient geminiSpecDraftClient,
			ObjectMapper objectMapper,
			@Value("${app.ai.task-suggestion.remote-enabled:false}") boolean remoteTaskSuggestionEnabled
	) {
		this.taskSuggestionRepository = taskSuggestionRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.taskService = taskService;
		this.geminiSpecDraftClient = geminiSpecDraftClient;
		this.objectMapper = objectMapper;
		this.remoteTaskSuggestionEnabled = remoteTaskSuggestionEnabled;
	}

	@Transactional
	public void generateForSpecFinalization(SpecDocument previousMain, SpecDocument newMain) {
		// A new main spec replaces the old context entirely: wipe the pending
		// queue and rebuild it from the new document, uncapped.
		taskSuggestionRepository.deleteByTeamIdAndStatus(newMain.getTeam().getId(), TaskSuggestionStatus.PENDING);

		List<SuggestionDraft> drafts = remoteTaskSuggestionEnabled
				? geminiSpecDraftClient.generateJson(buildGenerationPrompt(previousMain, newMain))
						.flatMap(this::parseDrafts)
						.filter(parsedDrafts -> !parsedDrafts.isEmpty())
						.orElseGet(() -> buildLocalDrafts(newMain))
				: buildLocalDrafts(newMain);

		Set<String> seenTitles = new HashSet<>();
		drafts.stream()
				.filter(draft -> seenTitles.add(draft.title().trim().toLowerCase()))
				.forEach(draft -> taskSuggestionRepository.save(TaskSuggestion.create(
						newMain.getTeam(),
						newMain,
						draft.title(),
						draft.description(),
						draft.priority()
				)));
	}

	@Transactional(readOnly = true)
	public List<TaskSuggestionResponse> getQueuedSuggestions(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return taskSuggestionRepository.findByTeamIdAndStatusOrderByCreatedAtAsc(teamId, TaskSuggestionStatus.PENDING).stream()
				.sorted(Comparator.comparingInt((TaskSuggestion suggestion) -> priorityRank(suggestion.getPriority()))
						.thenComparing(TaskSuggestion::getCreatedAt))
				.map(TaskSuggestionResponse::from)
				.toList();
	}

	private int priorityRank(TaskPriority priority) {
		if (priority == TaskPriority.HIGH) {
			return 0;
		}
		if (priority == TaskPriority.MEDIUM) {
			return 1;
		}
		return 2;
	}

	@Transactional
	public TaskResponse acceptSuggestion(Long currentUserId, Long suggestionId, AcceptTaskSuggestionRequest request) {
		TaskSuggestion suggestion = taskSuggestionRepository.findById(suggestionId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TASK_SUGGESTION_NOT_FOUND));
		requireMembership(suggestion.getTeam().getId(), currentUserId);
		if (!suggestion.isPending()) {
			throw new BusinessException(ErrorCode.TASK_SUGGESTION_ALREADY_ACCEPTED);
		}

		TaskResponse task = taskService.createTask(
				currentUserId,
				suggestion.getTeam().getId(),
				new SaveTaskRequest(
						suggestion.getTitle(),
						suggestion.getDescription(),
						suggestion.getPriority(),
						request.assigneeUserIds()
				)
		);
		suggestion.accept();
		return task;
	}

	@Transactional
	public void dismissSuggestion(Long currentUserId, Long suggestionId) {
		TaskSuggestion suggestion = taskSuggestionRepository.findById(suggestionId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TASK_SUGGESTION_NOT_FOUND));
		requireMembership(suggestion.getTeam().getId(), currentUserId);
		if (suggestion.isPending()) {
			suggestion.dismiss();
		}
	}

	private void requireMembership(Long teamId, Long userId) {
		if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
			throw new BusinessException(ErrorCode.NOT_TEAM_MEMBER);
		}
	}

	private String buildGenerationPrompt(SpecDocument previousMain, SpecDocument newMain) {
		String previousContent = previousMain == null ? "(이전 메인 스펙 없음)" : compactForPrompt(previousMain.getContent(), 3000);

		return """
				아래는 팀의 새 메인 스펙 문서이다. 이 스펙을 구현하는 데 필요한 task 후보를 JSON 배열로 작성해줘.
				개수 제한 없이, 도출할 수 있는 task 후보를 모두 작성해줘.
				서로 중복되거나 의미가 같은 task는 하나로 합쳐줘.
				각 항목은 title, description, priority 필드를 가져야 해.
				priority는 LOW, MEDIUM, HIGH 중 하나만 사용해.
				설명이나 마크다운 없이 JSON 배열만 반환해. 도출할 task가 없다면 빈 배열 []을 반환해.

				참고용 이전 메인 스펙 문서:
				%s

				새 메인 스펙 문서 제목: %s
				새 메인 스펙 문서 내용:
				%s
				""".formatted(previousContent, newMain.getTitle(), compactForPrompt(newMain.getContent(), 5000));
	}

	private Optional<List<SuggestionDraft>> parseDrafts(String content) {
		try {
			JsonNode root = objectMapper.readTree(extractJsonArray(content));
			if (!root.isArray()) {
				return Optional.empty();
			}
			List<SuggestionDraft> drafts = new ArrayList<>();
			for (JsonNode node : root) {
				String title = node.path("title").asText("").trim();
				String description = node.path("description").asText("").trim();
				TaskPriority priority = parsePriority(node.path("priority").asText(""));
				if (!title.isBlank()) {
					drafts.add(new SuggestionDraft(
							truncate(title, 200),
							description.isBlank() ? null : description,
							priority
					));
				}
			}
			return Optional.of(drafts);
		} catch (Exception ignored) {
			return Optional.empty();
		}
	}

	private String extractJsonArray(String content) {
		int start = content.indexOf('[');
		int end = content.lastIndexOf(']');
		if (start < 0 || end < start) {
			return content;
		}
		return content.substring(start, end + 1);
	}

	private List<SuggestionDraft> buildLocalDrafts(SpecDocument specDocument) {
		String source = compact(specDocument.getContent());
		return List.of(
				new SuggestionDraft(
						"스펙 문서 기반 기능 범위 확정",
						"저장된 스펙 문서를 검토하고 MVP 포함 범위와 제외 범위를 확정한다. 근거: " + source,
						TaskPriority.HIGH
				),
				new SuggestionDraft(
						"핵심 API 예외 케이스 보강",
						"스펙 문서의 핵심 기능별 권한, 검증 실패, 존재하지 않는 리소스 접근 케이스를 점검한다.",
						TaskPriority.HIGH
				),
				new SuggestionDraft(
						"프론트엔드 연동용 응답 DTO 확인",
						"새 기능 구현 전 화면에서 필요한 필드가 API 응답에 모두 포함되는지 확인한다.",
						TaskPriority.MEDIUM
				),
				new SuggestionDraft(
						"수동 테스트 시나리오 업데이트",
						"스펙 문서에서 도출된 사용자 흐름을 테스트 시나리오에 반영한다.",
						TaskPriority.MEDIUM
				),
				new SuggestionDraft(
						"제출 문서와 구현 상태 동기화",
						"구현된 API, DB 스키마, 실행 방법을 제출 문서에 맞춰 갱신한다.",
						TaskPriority.LOW
				)
		);
	}

	private TaskPriority parsePriority(String value) {
		try {
			return TaskPriority.valueOf(value.trim().toUpperCase());
		} catch (Exception ignored) {
			return TaskPriority.MEDIUM;
		}
	}

	private String compact(String value) {
		String compact = value.replaceAll("\\s+", " ").trim();
		if (compact.length() <= 140) {
			return compact;
		}
		return compact.substring(0, 140) + "...";
	}

	private String compactForPrompt(String value, int maxLength) {
		if (value == null || value.isBlank()) {
			return "";
		}
		String compact = value.replaceAll("\\s+", " ").trim();
		if (compact.length() <= maxLength) {
			return compact;
		}
		return compact.substring(0, maxLength) + "\n...(중략: 로컬 컨텍스트 절감)";
	}

	private String truncate(String value, int maxLength) {
		if (value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}

	private record SuggestionDraft(
			String title,
			String description,
			TaskPriority priority
	) {
	}
}
