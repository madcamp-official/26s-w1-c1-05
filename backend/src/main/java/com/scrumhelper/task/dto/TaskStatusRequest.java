package com.scrumhelper.task.dto;

import com.scrumhelper.domain.task.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusRequest(
		@NotNull(message = "상태를 선택하세요.")
		TaskStatus status,
		Integer position
) {
}
