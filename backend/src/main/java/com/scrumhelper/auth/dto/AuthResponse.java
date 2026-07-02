package com.scrumhelper.auth.dto;

public record AuthResponse(
		UserSummaryResponse user,
		String accessToken
) {
}
