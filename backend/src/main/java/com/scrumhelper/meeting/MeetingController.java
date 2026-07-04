package com.scrumhelper.meeting;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.meeting.dto.MeetingResponse;
import com.scrumhelper.meeting.dto.MeetingSummaryResponse;
import com.scrumhelper.meeting.dto.SaveMeetingRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MeetingController {
	private final MeetingService meetingService;

	public MeetingController(MeetingService meetingService) {
		this.meetingService = meetingService;
	}

	@GetMapping("/teams/{teamId}/meetings")
	public ApiResponse<List<MeetingResponse>> getMeetings(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(meetingService.getMeetings(currentUserId(authentication), teamId));
	}

	@PostMapping("/teams/{teamId}/meetings")
	public ResponseEntity<ApiResponse<MeetingResponse>> createMeeting(
			@PathVariable Long teamId,
			@Valid @RequestBody SaveMeetingRequest request,
			Authentication authentication
	) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(meetingService.createMeeting(currentUserId(authentication), teamId, request)));
	}

	@GetMapping("/meetings/{meetingId}")
	public ApiResponse<MeetingResponse> getMeeting(
			@PathVariable Long meetingId,
			Authentication authentication
	) {
		return ApiResponse.ok(meetingService.getMeeting(currentUserId(authentication), meetingId));
	}

	@PatchMapping("/meetings/{meetingId}")
	public ApiResponse<MeetingResponse> updateMeeting(
			@PathVariable Long meetingId,
			@Valid @RequestBody SaveMeetingRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(meetingService.updateMeeting(currentUserId(authentication), meetingId, request));
	}

	@PostMapping("/meetings/{meetingId}/summary")
	public ApiResponse<MeetingSummaryResponse> generateSummary(
			@PathVariable Long meetingId,
			Authentication authentication
	) {
		return ApiResponse.ok(meetingService.generateSummary(currentUserId(authentication), meetingId));
	}

	@DeleteMapping("/meetings/{meetingId}")
	public ApiResponse<Void> deleteMeeting(
			@PathVariable Long meetingId,
			Authentication authentication
	) {
		meetingService.deleteMeeting(currentUserId(authentication), meetingId);
		return ApiResponse.deleted();
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
