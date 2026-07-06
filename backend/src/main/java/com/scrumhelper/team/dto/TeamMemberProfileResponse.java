package com.scrumhelper.team.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.domain.team.TeamRole;

import java.time.LocalDateTime;

public record TeamMemberProfileResponse(
		UserSummaryResponse user,
		TeamRole role,
		LocalDateTime joinedAt,
		long completedTaskCount,
		long points,
		int rank,
		String reputationLevel
) {
}
