import type { UserSummary } from './auth';

export type Meeting = {
  id: number;
  teamId: number;
  title: string;
  meetingAt: string;
  rawContent: string | null;
  summary: string | null;
  author: UserSummary;
  createdAt: string;
  updatedAt: string;
};

export type MeetingSummary = {
  meetingId: number;
  summary: string;
  generatedBy: 'GEMINI' | 'LOCAL_FALLBACK' | string;
  meeting: Meeting;
};

export type MeetingSummaryDraft = {
  summary: string;
  generatedBy: 'GEMINI' | 'LOCAL_FALLBACK' | string;
};

export type MeetingTranscription = {
  transcript: string;
  generatedBy: 'GEMINI' | string;
};

export type SaveMeetingRequest = {
  title: string;
  meetingAt: string;
  rawContent?: string;
  summary?: string;
};

export type GenerateMeetingSummaryRequest = {
  title?: string;
  meetingAt?: string;
  rawContent: string;
  summary?: string;
};
