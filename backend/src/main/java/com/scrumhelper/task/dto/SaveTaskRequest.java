package com.scrumhelper.task.dto;

import com.scrumhelper.domain.task.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SaveTaskRequest(
		@NotBlank(message = "task 제목을 입력하세요.")
		String title,
		String description,
		@NotNull(message = "중요도를 선택하세요.")
		TaskPriority priority,
		List<Long> assigneeUserIds
) {
}
