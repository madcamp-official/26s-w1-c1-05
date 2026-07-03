package com.scrumhelper.task.dto;

import jakarta.validation.constraints.NotBlank;

public record SaveCommentRequest(
		@NotBlank(message = "댓글 내용을 입력하세요.")
		String content
) {
}
