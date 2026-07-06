import type { UserSummary } from './auth';

export type TeamRole = 'LEADER' | 'MEMBER';

export type TeamSummary = {
  id: number;
  name: string;
  description: string | null;
  hasPassword: boolean;
  memberCount: number;
  leader: UserSummary;
  joined: boolean;
  myRole: TeamRole | null;
};

export type TeamDetail = {
  id: number;
  name: string;
  description: string | null;
  hasPassword: boolean;
  inviteCode: string | null;
  leader: UserSummary;
  myRole: TeamRole;
  createdAt: string;
  updatedAt: string;
};

export type TeamMember = {
  id: number;
  teamId: number;
  user: UserSummary;
  role: TeamRole;
  joinedAt: string;
};

export type TeamDashboard = {
  teamId: number;
  memberCount: number;
  task: {
    totalCount: number;
    completedCount: number;
    incompleteCount: number;
    backlogCount: number;
    inProgressCount: number;
  };
  retrospective: {
    totalCount: number;
    myCount: number;
    collaboratingCount: number;
  };
};

export type TeamLeaderboardRow = {
  user: UserSummary;
  completedTaskCount: number;
  points: number;
  rank: number;
  reputationLevel: 'SEED' | 'SPROUT' | 'SAPLING' | 'OAK' | string;
};

export type TeamMemberProfile = TeamLeaderboardRow & {
  role: TeamRole;
  joinedAt: string;
};

export type CreateTeamRequest = {
  name: string;
  description?: string;
  password?: string;
};

export type JoinTeamRequest = {
  password?: string;
};

export type JoinTeamByInviteCodeRequest = {
  inviteCode: string;
};

export type UpdateTeamRequest = {
  name: string;
  description?: string;
};

export type UpdateTeamPasswordRequest = {
  password: string | null;
};

export type TeamPasswordStatus = {
  teamId: number;
  hasPassword: boolean;
};

export type TeamInviteCodeStatus = {
  teamId: number;
  inviteCode: string;
};

export type TransferLeaderResponse = {
  teamId: number;
  previousLeader: UserSummary;
  newLeader: UserSummary;
};
