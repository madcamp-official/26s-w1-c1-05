package com.scrumhelper.task.dto;

import java.util.List;

public record TodoListResponse(
		List<TaskResponse> selectedTasks,
		List<TaskResponse> candidateTasks,
		List<TaskResponse> recommendedTasks
) {
}
