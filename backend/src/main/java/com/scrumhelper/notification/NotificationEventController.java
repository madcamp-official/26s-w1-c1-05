package com.scrumhelper.notification;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.notification.dto.NotificationEventResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class NotificationEventController {
	private final NotificationEventService notificationEventService;

	public NotificationEventController(NotificationEventService notificationEventService) {
		this.notificationEventService = notificationEventService;
	}

	@GetMapping("/teams/{teamId}/notifications")
	public ApiResponse<List<NotificationEventResponse>> getMyNotifications(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(notificationEventService.getMyNotifications(currentUserId(authentication), teamId));
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
