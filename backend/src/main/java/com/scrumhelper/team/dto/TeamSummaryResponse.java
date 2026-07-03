package com.scrumhelper.team.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.domain.team.TeamRole;

public record TeamSummaryResponse(
		Long id,
		String name,
		String description,
		boolean hasPassword,
		long memberCount,
		UserSummaryResponse leader,
		boolean joined,
		TeamRole myRole
) {
}
