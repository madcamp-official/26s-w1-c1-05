package com.scrumhelper.retrospective;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.retrospective.dto.RetrospectiveResponse;
import com.scrumhelper.retrospective.dto.SaveRetrospectiveRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RetrospectiveController {
	private final RetrospectiveService retrospectiveService;

	public RetrospectiveController(RetrospectiveService retrospectiveService) {
		this.retrospectiveService = retrospectiveService;
	}

	@GetMapping("/teams/{teamId}/retrospectives")
	public ApiResponse<List<RetrospectiveResponse>> getRetrospectives(
			@PathVariable Long teamId,
			@RequestParam(required = false) Long authorId,
			@RequestParam(required = false) Long collaboratorId,
			Authentication authentication
	) {
		return ApiResponse.ok(retrospectiveService.getRetrospectives(
				currentUserId(authentication),
				teamId,
				authorId,
				collaboratorId
		));
	}

	@PostMapping("/teams/{teamId}/retrospectives")
	public ResponseEntity<ApiResponse<RetrospectiveResponse>> createRetrospective(
			@PathVariable Long teamId,
			@Valid @RequestBody SaveRetrospectiveRequest request,
			Authentication authentication
	) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(retrospectiveService.createRetrospective(
						currentUserId(authentication),
						teamId,
						request
				)));
	}

	@GetMapping("/retrospectives/{retrospectiveId}")
	public ApiResponse<RetrospectiveResponse> getRetrospective(
			@PathVariable Long retrospectiveId,
			Authentication authentication
	) {
		return ApiResponse.ok(retrospectiveService.getRetrospective(currentUserId(authentication), retrospectiveId));
	}

	@PatchMapping("/retrospectives/{retrospectiveId}")
	public ApiResponse<RetrospectiveResponse> updateRetrospective(
			@PathVariable Long retrospectiveId,
			@Valid @RequestBody SaveRetrospectiveRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(retrospectiveService.updateRetrospective(
				currentUserId(authentication),
				retrospectiveId,
				request
		));
	}

	@DeleteMapping("/retrospectives/{retrospectiveId}")
	public ApiResponse<Void> deleteRetrospective(
			@PathVariable Long retrospectiveId,
			Authentication authentication
	) {
		retrospectiveService.deleteRetrospective(currentUserId(authentication), retrospectiveId);
		return ApiResponse.deleted();
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
