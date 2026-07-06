package com.scrumhelper.task.dto;

import com.scrumhelper.domain.task.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AcceptAiTaskRecommendationRequest(
		@NotBlank(message = "task 제목을 입력하세요.")
		String title,
		String description,
		@NotNull(message = "중요도를 선택하세요.")
		TaskPriority priority,
		@NotNull(message = "마감일을 선택하세요.")
		LocalDate dueDate
) {
}
