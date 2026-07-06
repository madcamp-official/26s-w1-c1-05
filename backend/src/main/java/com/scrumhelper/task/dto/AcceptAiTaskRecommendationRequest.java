package com.scrumhelper.task.dto;

import jakarta.validation.constraints.NotNull;

public record AcceptAiTaskRecommendationRequest(
		@NotNull(message = "task를 선택하세요.")
		Long taskId
) {
}
