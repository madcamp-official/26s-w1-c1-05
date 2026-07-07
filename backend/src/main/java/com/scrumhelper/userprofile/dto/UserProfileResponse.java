package com.scrumhelper.userprofile.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;

import java.util.List;

public record UserProfileResponse(
		UserSummaryResponse user,
		long totalCompletedTaskCount,
		List<UserProfileTeamResponse> teams
) {
}
