package com.scrumhelper.common;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException exception) {
		ErrorCode code = exception.getErrorCode();
		return ResponseEntity
				.status(code.getStatus())
				.body(ApiResponse.error(code, exception.getMessage()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
		String message = exception.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(error -> error.getDefaultMessage() == null ? ErrorCode.VALIDATION_ERROR.getDefaultMessage() : error.getDefaultMessage())
				.orElse(ErrorCode.VALIDATION_ERROR.getDefaultMessage());
		return ResponseEntity
				.status(ErrorCode.VALIDATION_ERROR.getStatus())
				.body(ApiResponse.error(ErrorCode.VALIDATION_ERROR, message));
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException exception) {
		return ResponseEntity
				.status(ErrorCode.VALIDATION_ERROR.getStatus())
				.body(ApiResponse.error(ErrorCode.VALIDATION_ERROR, ErrorCode.VALIDATION_ERROR.getDefaultMessage()));
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException exception) {
		return ResponseEntity
				.status(ErrorCode.UNAUTHORIZED.getStatus())
				.body(ApiResponse.error(ErrorCode.UNAUTHORIZED, ErrorCode.UNAUTHORIZED.getDefaultMessage()));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException exception) {
		return ResponseEntity
				.status(ErrorCode.FORBIDDEN.getStatus())
				.body(ApiResponse.error(ErrorCode.FORBIDDEN, ErrorCode.FORBIDDEN.getDefaultMessage()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<Void>> handleException(Exception exception) {
		return ResponseEntity
				.status(ErrorCode.INTERNAL_SERVER_ERROR.getStatus())
				.body(ApiResponse.error(ErrorCode.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_SERVER_ERROR.getDefaultMessage()));
	}
}
