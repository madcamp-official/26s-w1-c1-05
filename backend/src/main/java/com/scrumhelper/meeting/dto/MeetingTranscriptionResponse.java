package com.scrumhelper.meeting.dto;

public record MeetingTranscriptionResponse(
		String transcript,
		String generatedBy
) {
}
