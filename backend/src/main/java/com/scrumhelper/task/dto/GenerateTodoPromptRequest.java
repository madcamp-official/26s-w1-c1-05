package com.scrumhelper.task.dto;

import java.util.List;

public record GenerateTodoPromptRequest(
		List<Long> taskIds
) {
}
