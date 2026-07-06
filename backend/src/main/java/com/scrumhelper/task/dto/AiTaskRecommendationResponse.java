package com.scrumhelper.task.dto;

public record AiTaskRecommendationResponse(
		TaskResponse task,
		String reason,
		String generatedBy
) {
}
