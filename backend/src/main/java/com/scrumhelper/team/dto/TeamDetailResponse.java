package com.scrumhelper.team.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.domain.team.TeamRole;

import java.time.LocalDateTime;

public record TeamDetailResponse(
		Long id,
		String name,
		String description,
		boolean hasPassword,
		String inviteCode,
		UserSummaryResponse leader,
		TeamRole myRole,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
}
