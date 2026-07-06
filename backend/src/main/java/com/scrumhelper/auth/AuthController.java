package com.scrumhelper.auth;

import com.scrumhelper.auth.dto.AuthResponse;
import com.scrumhelper.auth.dto.LoginRequest;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.auth.dto.UpdateProfileRequest;
import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {
	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/auth/signup")
	public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody SignupRequest request) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(authService.signup(request)));
	}

	@PostMapping("/auth/login")
	public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		return ApiResponse.ok(authService.login(request));
	}

	@PostMapping("/auth/logout")
	public ApiResponse<Void> logout() {
		return ApiResponse.ok(null);
	}

	@GetMapping("/me")
	public ApiResponse<UserSummaryResponse> me(Authentication authentication) {
		return ApiResponse.ok(authService.getMe(Long.valueOf(authentication.getName())));
	}

	@PatchMapping("/me")
	public ApiResponse<UserSummaryResponse> updateProfile(
			@Valid @RequestBody UpdateProfileRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(authService.updateProfile(Long.valueOf(authentication.getName()), request));
	}
}
