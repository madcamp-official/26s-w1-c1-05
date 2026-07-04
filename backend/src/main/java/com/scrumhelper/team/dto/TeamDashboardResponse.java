package com.scrumhelper.team.dto;

public record TeamDashboardResponse(
		Long teamId,
		long memberCount,
		TaskSummary task,
		RetrospectiveSummary retrospective
) {
	public record TaskSummary(
			long totalCount,
			long completedCount,
			long incompleteCount,
			long backlogCount,
			long inProgressCount,
			long overdueCount,
			long dueSoonCount
	) {
	}

	public record RetrospectiveSummary(
			long totalCount,
			long myCount,
			long collaboratingCount
	) {
	}
}
