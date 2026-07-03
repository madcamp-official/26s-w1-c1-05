import type { UserSummary } from './auth';

export type Retrospective = {
  id: number;
  teamId: number;
  title: string;
  yesterdayWork: string | null;
  todayPlan: string | null;
  note: string | null;
  author: UserSummary;
  collaborators: UserSummary[];
  createdAt: string;
  updatedAt: string;
};

export type RetrospectiveFilter = {
  authorId?: number;
  collaboratorId?: number;
};

export type SaveRetrospectiveRequest = {
  title: string;
  yesterdayWork?: string;
  todayPlan?: string;
  note?: string;
  collaboratorUserIds: number[];
};
