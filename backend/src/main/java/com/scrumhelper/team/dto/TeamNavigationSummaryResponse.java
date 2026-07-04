package com.scrumhelper.team.dto;

public record TeamNavigationSummaryResponse(
		Long teamId,
		String teamName,
		String teamBadge,
		long openTaskCount,
		long meetingCount,
		long specCount,
		long retrospectiveCount,
		long memberCount
) {
}
