package com.scrumhelper.tasksuggestion.dto;

import java.util.List;

public record AcceptTaskSuggestionRequest(
		List<Long> assigneeUserIds
) {
}
