package com.scrumhelper.task.dto;

import com.scrumhelper.domain.task.TaskPriority;

import java.time.LocalDate;

public record AiTaskRecommendationResponse(
		String title,
		String description,
		TaskPriority priority,
		LocalDate dueDate,
		String reason,
		String generatedBy
) {
}
