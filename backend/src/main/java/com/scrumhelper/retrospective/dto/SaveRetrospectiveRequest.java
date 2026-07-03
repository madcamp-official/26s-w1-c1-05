package com.scrumhelper.retrospective.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SaveRetrospectiveRequest(
		@NotBlank(message = "회고록 제목을 입력하세요.")
		@Size(max = 200, message = "회고록 제목은 200자 이하로 입력하세요.")
		String title,
		String yesterdayWork,
		String todayPlan,
		String note,
		List<Long> collaboratorUserIds
) {
}
