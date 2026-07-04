package com.scrumhelper.specdocument.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.domain.specdocument.SpecDocument;
import com.scrumhelper.domain.specdocument.SpecDocumentStatus;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record SpecDocumentResponse(
		Long id,
		Long teamId,
		String title,
		String content,
		List<Long> sourceMeetingIds,
		SpecDocumentStatus status,
		boolean isMain,
		UserSummaryResponse createdBy,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static SpecDocumentResponse from(SpecDocument document) {
		return new SpecDocumentResponse(
				document.getId(),
				document.getTeam().getId(),
				document.getTitle(),
				document.getContent(),
				parseSourceMeetingIds(document.getSourceMeetingIds()),
				document.getStatus(),
				document.isMain(),
				UserSummaryResponse.from(document.getCreatedBy()),
				document.getCreatedAt(),
				document.getUpdatedAt()
		);
	}

	private static List<Long> parseSourceMeetingIds(String value) {
		if (value == null || value.isBlank()) {
			return List.of();
		}
		return Arrays.stream(value.split(","))
				.map(String::trim)
				.filter(part -> !part.isBlank())
				.map(Long::valueOf)
				.toList();
	}
}
