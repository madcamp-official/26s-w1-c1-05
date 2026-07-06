package com.scrumhelper.task.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.domain.task.Task;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.domain.task.TaskStatus;

import java.time.LocalDateTime;
import java.util.List;

public record TaskResponse(
		Long id,
		Long teamId,
		String title,
		String description,
		TaskPriority priority,
		TaskStatus status,
		UserSummaryResponse createdBy,
		List<UserSummaryResponse> assignees,
		long commentCount,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static TaskResponse from(Task task, List<UserSummaryResponse> assignees, long commentCount) {
		return new TaskResponse(
				task.getId(),
				task.getTeam().getId(),
				task.getTitle(),
				task.getDescription(),
				task.getPriority(),
				task.getStatus(),
				UserSummaryResponse.from(task.getCreatedBy()),
				assignees,
				commentCount,
				task.getCreatedAt(),
				task.getUpdatedAt()
		);
	}
}
