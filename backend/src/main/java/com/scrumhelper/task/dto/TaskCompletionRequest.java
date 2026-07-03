package com.scrumhelper.task.dto;

import jakarta.validation.constraints.NotNull;

public record TaskCompletionRequest(
		@NotNull(message = "완료 여부를 선택하세요.")
		Boolean completed
) {
}
