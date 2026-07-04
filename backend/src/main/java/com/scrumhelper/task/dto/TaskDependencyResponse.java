package com.scrumhelper.task.dto;

import com.scrumhelper.domain.task.TaskDependency;

import java.time.LocalDateTime;

public record TaskDependencyResponse(
		Long id,
		Long predecessorTaskId,
		String predecessorTitle,
		boolean predecessorCompleted,
		Long successorTaskId,
		String successorTitle,
		boolean successorCompleted,
		LocalDateTime createdAt
) {
	public static TaskDependencyResponse from(TaskDependency dependency) {
		return new TaskDependencyResponse(
				dependency.getId(),
				dependency.getPredecessor().getId(),
				dependency.getPredecessor().getTitle(),
				dependency.getPredecessor().isCompleted(),
				dependency.getSuccessor().getId(),
				dependency.getSuccessor().getTitle(),
				dependency.getSuccessor().isCompleted(),
				dependency.getCreatedAt()
		);
	}
}
