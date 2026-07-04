package com.scrumhelper.tasksuggestion.dto;

import com.scrumhelper.domain.tasksuggestion.TaskSuggestion;
import com.scrumhelper.domain.task.TaskPriority;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskSuggestionResponse(
		Long id,
		Long teamId,
		Long specDocumentId,
		String title,
		String description,
		TaskPriority priority,
		LocalDate dueDate,
		boolean accepted,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static TaskSuggestionResponse from(TaskSuggestion suggestion) {
		return new TaskSuggestionResponse(
				suggestion.getId(),
				suggestion.getTeam().getId(),
				suggestion.getSpecDocument().getId(),
				suggestion.getTitle(),
				suggestion.getDescription(),
				suggestion.getPriority(),
				suggestion.getDueDate(),
				suggestion.isAccepted(),
				suggestion.getCreatedAt(),
				suggestion.getUpdatedAt()
		);
	}
}
