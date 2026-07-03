package com.scrumhelper.team.dto;

public record TeamPasswordResponse(
		Long teamId,
		boolean hasPassword
) {
}
