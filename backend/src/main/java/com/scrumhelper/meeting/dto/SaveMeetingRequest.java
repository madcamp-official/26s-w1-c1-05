package com.scrumhelper.meeting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record SaveMeetingRequest(
		@NotBlank(message = "회의 제목을 입력하세요.")
		@Size(max = 200, message = "회의 제목은 200자 이하로 입력하세요.")
		String title,
		@NotNull(message = "회의 일시를 입력하세요.")
		LocalDateTime meetingAt,
		String rawContent,
		String summary
) {
}
