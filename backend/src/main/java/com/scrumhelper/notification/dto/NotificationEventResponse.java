package com.scrumhelper.notification.dto;

import com.scrumhelper.domain.notification.NotificationEvent;

import java.time.LocalDateTime;

public record NotificationEventResponse(
		Long id,
		Long teamId,
		Long recipientUserId,
		String type,
		Long sourceTaskId,
		Long targetTaskId,
		String payload,
		boolean delivered,
		LocalDateTime createdAt
) {
	public static NotificationEventResponse from(NotificationEvent event) {
		return new NotificationEventResponse(
				event.getId(),
				event.getTeam().getId(),
				event.getRecipient().getId(),
				event.getType(),
				event.getSourceTaskId(),
				event.getTargetTaskId(),
				event.getPayload(),
				event.isDelivered(),
				event.getCreatedAt()
		);
	}
}
