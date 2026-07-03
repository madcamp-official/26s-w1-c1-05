package com.scrumhelper.meeting.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.domain.meeting.Meeting;

import java.time.LocalDateTime;

public record MeetingResponse(
		Long id,
		Long teamId,
		String title,
		LocalDateTime meetingAt,
		String rawContent,
		String summary,
		UserSummaryResponse author,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static MeetingResponse from(Meeting meeting) {
		return new MeetingResponse(
				meeting.getId(),
				meeting.getTeam().getId(),
				meeting.getTitle(),
				meeting.getMeetingAt(),
				meeting.getRawContent(),
				meeting.getSummary(),
				UserSummaryResponse.from(meeting.getAuthor()),
				meeting.getCreatedAt(),
				meeting.getUpdatedAt()
		);
	}
}
