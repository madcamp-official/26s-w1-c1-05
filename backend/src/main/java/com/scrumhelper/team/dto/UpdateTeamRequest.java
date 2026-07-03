package com.scrumhelper.team.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTeamRequest(
		@NotBlank(message = "팀 이름을 입력하세요.")
		String name,
		String description
) {
}
