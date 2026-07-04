package com.scrumhelper.task.dto;

import jakarta.validation.constraints.NotNull;

public record AddTaskDependencyRequest(
		@NotNull(message = "선행 task를 선택하세요.")
		Long predecessorTaskId
) {
}
