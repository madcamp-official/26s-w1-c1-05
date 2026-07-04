package com.scrumhelper.meeting.dto;

public record MeetingSummaryResponse(
		Long meetingId,
		String summary,
		String generatedBy,
		MeetingResponse meeting
) {
	public static MeetingSummaryResponse of(MeetingResponse meeting, String summary, String generatedBy) {
		return new MeetingSummaryResponse(meeting.id(), summary, generatedBy, meeting);
	}
}
