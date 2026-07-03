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

export type SaveMeetingRequest = {
  title: string;
  meetingAt: string;
  rawContent?: string;
  summary?: string;
};
