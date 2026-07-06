package com.scrumhelper.auth.dto;

import com.scrumhelper.domain.user.User;

public record UserSummaryResponse(
		Long id,
		String name,
		String email,
		String title,
		String bio
) {
	public static UserSummaryResponse from(User user) {
		return new UserSummaryResponse(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getTitle(),
				user.getBio()
		);
	}
}
