package com.scrumhelper.task.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SaveTodoListRequest(
		@NotNull
		List<Long> taskIds
) {
}
