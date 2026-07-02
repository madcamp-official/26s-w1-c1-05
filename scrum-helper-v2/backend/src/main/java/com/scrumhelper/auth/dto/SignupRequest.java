package com.scrumhelper.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SignupRequest(
		@NotBlank(message = "이름을 입력하세요.")
		String name,

		@NotBlank(message = "이메일을 입력하세요.")
		@Email(message = "이메일 형식이 올바르지 않습니다.")
		String email,

		@NotBlank(message = "비밀번호를 입력하세요.")
		String password
) {
}
