package com.scrumhelper.task.dto;

import java.util.List;

public record GenerateTodoPromptRequest(
		List<Long> taskIds,
		Boolean forceRemote
) {
	public boolean shouldForceRemote() {
		return Boolean.TRUE.equals(forceRemote);
	}
}
