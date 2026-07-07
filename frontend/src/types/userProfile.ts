import type { UserSummary } from './auth';
import type { Task } from './task';

export type UserProfileTeam = {
  teamId: number;
  teamName: string;
  role: 'LEADER' | 'MEMBER' | string;
  completedTaskCount: number;
  tasks: Task[];
};

export type UserProfile = {
  user: UserSummary;
  totalCompletedTaskCount: number;
  teams: UserProfileTeam[];
};
