package com.scrumhelper.specdocument.dto;

import java.util.List;

public record SpecDraftResponse(
		String title,
		String content,
		List<Long> sourceMeetingIds,
		String generatedBy
) {
}
