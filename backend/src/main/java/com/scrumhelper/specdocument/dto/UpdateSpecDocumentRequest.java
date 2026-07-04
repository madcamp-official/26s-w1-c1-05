package com.scrumhelper.specdocument.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateSpecDocumentRequest(
		@NotBlank(message = "문서 제목을 입력하세요.")
		@Size(max = 200, message = "문서 제목은 200자 이하로 입력하세요.")
		String title,

		@NotBlank(message = "문서 내용을 입력하세요.")
		String content,

		List<Long> sourceMeetingIds
) {
}
