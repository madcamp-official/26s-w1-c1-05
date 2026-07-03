package com.scrumhelper.task.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.domain.task.TaskComment;

import java.time.LocalDateTime;

public record TaskCommentResponse(
		Long id,
		Long taskId,
		UserSummaryResponse author,
		String content,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static TaskCommentResponse from(TaskComment comment) {
		return new TaskCommentResponse(
				comment.getId(),
				comment.getTask().getId(),
				UserSummaryResponse.from(comment.getAuthor()),
				comment.getContent(),
				comment.getCreatedAt(),
				comment.getUpdatedAt()
		);
	}
}
