package com.scrumhelper.team.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;

public record TeamLeaderboardResponse(
		UserSummaryResponse user,
		long completedTaskCount,
		int rank,
		String reputationLevel
) {
}
