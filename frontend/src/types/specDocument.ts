import type { UserSummary } from './auth';

export type SpecDraft = {
  title: string;
  content: string;
  sourceMeetingIds: number[];
  generatedBy: 'GEMINI' | 'LOCAL_FALLBACK' | string;
};

export type SpecDocument = {
  id: number;
  teamId: number;
  title: string;
  content: string;
  sourceMeetingIds: number[];
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
};

export type GenerateSpecDraftRequest = {
  meetingIds: number[];
};

export type SaveSpecDocumentRequest = {
  title: string;
  content: string;
  sourceMeetingIds: number[];
};
