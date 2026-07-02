package com.scrumhelper.common;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
		boolean success,
		T data,
		String message,
		ErrorResponse error
) {
	public static <T> ApiResponse<T> ok(T data) {
		return new ApiResponse<>(true, data, "ok", null);
	}

	public static <T> ApiResponse<T> created(T data) {
		return new ApiResponse<>(true, data, "created", null);
	}

	public static ApiResponse<Void> deleted() {
		return new ApiResponse<>(true, null, "deleted", null);
	}

	public static ApiResponse<Void> error(ErrorCode code, String message) {
		return new ApiResponse<>(false, null, null, new ErrorResponse(code.name(), message));
	}
}
