package com.scrumhelper.userprofile;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.userprofile.dto.UserProfileResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {
	private final UserProfileService userProfileService;

	public UserProfileController(UserProfileService userProfileService) {
		this.userProfileService = userProfileService;
	}

	@GetMapping("/me/profile")
	public ApiResponse<UserProfileResponse> getMyProfile(Authentication authentication) {
		return ApiResponse.ok(userProfileService.getProfile(Long.valueOf(authentication.getName())));
	}

	@GetMapping("/{userId}/profile")
	public ApiResponse<UserProfileResponse> getProfile(@PathVariable Long userId) {
		return ApiResponse.ok(userProfileService.getProfile(userId));
	}
}
