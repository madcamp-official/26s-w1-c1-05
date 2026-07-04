package com.scrumhelper.tasksuggestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.specdocument.SpecDocument;
import com.scrumhelper.domain.specdocument.SpecDocumentRepository;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.domain.tasksuggestion.TaskSuggestion;
import com.scrumhelper.domain.tasksuggestion.TaskSuggestionRepository;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.specdocument.GeminiSpecDraftClient;
import com.scrumhelper.task.TaskService;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.tasksuggestion.dto.AcceptTaskSuggestionRequest;
import com.scrumhelper.tasksuggestion.dto.TaskSuggestionResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class TaskSuggestionService {
	private final TaskSuggestionRepository taskSuggestionRepository;
	private final SpecDocumentRepository specDocumentRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final TaskService taskService;
	private final GeminiSpecDraftClient geminiSpecDraftClient;
	private final ObjectMapper objectMapper;

	public TaskSuggestionService(
			TaskSuggestionRepository taskSuggestionRepository,
			SpecDocumentRepository specDocumentRepository,
			TeamMemberRepository teamMemberRepository,
			TaskService taskService,
			GeminiSpecDraftClient geminiSpecDraftClient,
			ObjectMapper objectMapper
	) {
		this.taskSuggestionRepository = taskSuggestionRepository;
		this.specDocumentRepository = specDocumentRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.taskService = taskService;
		this.geminiSpecDraftClient = geminiSpecDraftClient;
		this.objectMapper = objectMapper;
	}

	@Transactional
	public List<TaskSuggestionResponse> generateSuggestions(Long currentUserId, Long specDocumentId) {
		SpecDocument specDocument = findSpecDocument(specDocumentId);
		requireMembership(specDocument.getTeam().getId(), currentUserId);

		List<SuggestionDraft> drafts = geminiSpecDraftClient.generateJson(buildPrompt(specDocument))
				.flatMap(this::parseDrafts)
				.filter(parsedDrafts -> !parsedDrafts.isEmpty())
				.orElseGet(() -> buildLocalDrafts(specDocument));

		return drafts.stream()
				.map(draft -> taskSuggestionRepository.save(TaskSuggestion.create(
						specDocument.getTeam(),
						specDocument,
						draft.title(),
						draft.description(),
						draft.priority(),
						draft.dueDate()
				)))
				.map(TaskSuggestionResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<TaskSuggestionResponse> getSuggestions(Long currentUserId, Long specDocumentId) {
		SpecDocument specDocument = findSpecDocument(specDocumentId);
		requireMembership(specDocument.getTeam().getId(), currentUserId);
		return taskSuggestionRepository.findBySpecDocumentIdOrderByCreatedAtDesc(specDocumentId).stream()
				.map(TaskSuggestionResponse::from)
				.toList();
	}

	@Transactional
	public TaskResponse acceptSuggestion(Long currentUserId, Long suggestionId, AcceptTaskSuggestionRequest request) {
		TaskSuggestion suggestion = taskSuggestionRepository.findById(suggestionId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TASK_SUGGESTION_NOT_FOUND));
		requireMembership(suggestion.getTeam().getId(), currentUserId);
		if (suggestion.isAccepted()) {
			throw new BusinessException(ErrorCode.TASK_SUGGESTION_ALREADY_ACCEPTED);
		}

		TaskResponse task = taskService.createTask(
				currentUserId,
				suggestion.getTeam().getId(),
				new SaveTaskRequest(
						suggestion.getTitle(),
						suggestion.getDescription(),
						suggestion.getPriority(),
						suggestion.getDueDate(),
						request.assigneeUserIds()
				)
		);
		suggestion.accept();
		return task;
	}

	private SpecDocument findSpecDocument(Long specDocumentId) {
		return specDocumentRepository.findById(specDocumentId)
				.orElseThrow(() -> new BusinessException(ErrorCode.SPEC_DOCUMENT_NOT_FOUND));
	}

	private void requireMembership(Long teamId, Long userId) {
		if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
			throw new BusinessException(ErrorCode.NOT_TEAM_MEMBER);
		}
	}

	private String buildPrompt(SpecDocument specDocument) {
		return """
				다음 Scrum Helper 스펙 문서를 바탕으로 구현 가능한 task 후보를 JSON 배열로만 작성해줘.
				각 항목은 title, description, priority, dueDate 필드를 가져야 해.
				priority는 LOW, MEDIUM, HIGH 중 하나만 사용해.
				dueDate는 오늘 이후의 YYYY-MM-DD 형식으로 작성해.
				설명이나 마크다운 없이 JSON 배열만 반환해.

				스펙 문서 제목: %s
				스펙 문서 내용:
				%s
				""".formatted(specDocument.getTitle(), specDocument.getContent());
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
				LocalDate dueDate = parseDueDate(node.path("dueDate").asText(""));
				if (!title.isBlank()) {
					drafts.add(new SuggestionDraft(
							truncate(title, 200),
							description.isBlank() ? null : description,
							priority,
							dueDate
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
		LocalDate baseDate = LocalDate.now().plusDays(1);
		String source = compact(specDocument.getContent());
		return List.of(
				new SuggestionDraft(
						"스펙 문서 기반 기능 범위 확정",
						"저장된 스펙 문서를 검토하고 MVP 포함 범위와 제외 범위를 확정한다. 근거: " + source,
						TaskPriority.HIGH,
						baseDate
				),
				new SuggestionDraft(
						"핵심 API 예외 케이스 보강",
						"스펙 문서의 핵심 기능별 권한, 검증 실패, 존재하지 않는 리소스 접근 케이스를 점검한다.",
						TaskPriority.HIGH,
						baseDate.plusDays(1)
				),
				new SuggestionDraft(
						"프론트엔드 연동용 응답 DTO 확인",
						"새 기능 구현 전 화면에서 필요한 필드가 API 응답에 모두 포함되는지 확인한다.",
						TaskPriority.MEDIUM,
						baseDate.plusDays(2)
				),
				new SuggestionDraft(
						"수동 테스트 시나리오 업데이트",
						"스펙 문서에서 도출된 사용자 흐름을 테스트 시나리오에 반영한다.",
						TaskPriority.MEDIUM,
						baseDate.plusDays(3)
				),
				new SuggestionDraft(
						"제출 문서와 구현 상태 동기화",
						"구현된 API, DB 스키마, 실행 방법을 제출 문서에 맞춰 갱신한다.",
						TaskPriority.LOW,
						baseDate.plusDays(4)
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

	private LocalDate parseDueDate(String value) {
		try {
			LocalDate parsed = LocalDate.parse(value.trim());
			return parsed.isBefore(LocalDate.now()) ? LocalDate.now().plusDays(1) : parsed;
		} catch (Exception ignored) {
			return LocalDate.now().plusDays(1);
		}
	}

	private String compact(String value) {
		String compact = value.replaceAll("\\s+", " ").trim();
		if (compact.length() <= 140) {
			return compact;
		}
		return compact.substring(0, 140) + "...";
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
			TaskPriority priority,
			LocalDate dueDate
	) {
	}
}
