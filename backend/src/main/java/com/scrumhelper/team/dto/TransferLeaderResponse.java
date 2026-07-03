package com.scrumhelper.team.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;

public record TransferLeaderResponse(
		Long teamId,
		UserSummaryResponse previousLeader,
		UserSummaryResponse newLeader
) {
}
