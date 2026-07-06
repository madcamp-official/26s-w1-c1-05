package com.scrumhelper.meeting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record GenerateMeetingSummaryRequest(
		@Size(max = 200)
		String title,
		LocalDateTime meetingAt,
		@NotBlank
		String rawContent,
		String summary
) {
}
