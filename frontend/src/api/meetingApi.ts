import { request } from './client';
import type { Meeting, MeetingSummary, SaveMeetingRequest } from '../types/meeting';

export function getMeetings(teamId: number) {
  return request<Meeting[]>(`/teams/${teamId}/meetings`);
}

export function createMeeting(teamId: number, data: SaveMeetingRequest) {
  return request<Meeting>(`/teams/${teamId}/meetings`, {
    method: 'POST',
    body: data,
  });
}

export function getMeeting(meetingId: number) {
  return request<Meeting>(`/meetings/${meetingId}`);
}

export function updateMeeting(meetingId: number, data: SaveMeetingRequest) {
  return request<Meeting>(`/meetings/${meetingId}`, {
    method: 'PATCH',
    body: data,
  });
}

export function generateMeetingSummary(meetingId: number) {
  return request<MeetingSummary>(`/meetings/${meetingId}/summary`, {
    method: 'POST',
  });
}

export function deleteMeeting(meetingId: number) {
  return request<void>(`/meetings/${meetingId}`, {
    method: 'DELETE',
  });
}
