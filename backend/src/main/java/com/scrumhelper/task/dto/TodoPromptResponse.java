package com.scrumhelper.task.dto;

public record TodoPromptResponse(
		String prompt,
		String generatedBy
) {
}
