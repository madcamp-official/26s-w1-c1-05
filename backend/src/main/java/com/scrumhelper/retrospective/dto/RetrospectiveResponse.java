package com.scrumhelper.retrospective.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.domain.retrospective.Retrospective;

import java.time.LocalDateTime;
import java.util.List;

public record RetrospectiveResponse(
		Long id,
		Long teamId,
		String title,
		String yesterdayWork,
		String todayPlan,
		String note,
		UserSummaryResponse author,
		List<UserSummaryResponse> collaborators,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static RetrospectiveResponse from(Retrospective retrospective, List<UserSummaryResponse> collaborators) {
		return new RetrospectiveResponse(
				retrospective.getId(),
				retrospective.getTeam().getId(),
				retrospective.getTitle(),
				retrospective.getYesterdayWork(),
				retrospective.getTodayPlan(),
				retrospective.getNote(),
				UserSummaryResponse.from(retrospective.getAuthor()),
				collaborators,
				retrospective.getCreatedAt(),
				retrospective.getUpdatedAt()
		);
	}
}
