package com.scrumhelper.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
		@NotBlank
		@Size(max = 50)
		String name,

		@Size(max = 80)
		String title,

		@Size(max = 500)
		String bio
) {
}
