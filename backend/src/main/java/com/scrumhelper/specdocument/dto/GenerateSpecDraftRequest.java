package com.scrumhelper.specdocument.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record GenerateSpecDraftRequest(
		@NotEmpty(message = "회의록을 1개 이상 선택하세요.")
		List<Long> meetingIds
) {
}
