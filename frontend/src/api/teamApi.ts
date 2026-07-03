import { request } from './client';
import type {
  CreateTeamRequest,
  JoinTeamRequest,
  TeamDashboard,
  TeamDetail,
  TeamMember,
  TeamPasswordStatus,
  TeamSummary,
  TransferLeaderResponse,
  UpdateTeamPasswordRequest,
  UpdateTeamRequest,
} from '../types/team';

export function getTeams(params?: { keyword?: string }) {
  return request<TeamSummary[]>('/teams', {
    query: params,
  });
}

export function createTeam(data: CreateTeamRequest) {
  return request<TeamDetail>('/teams', {
    method: 'POST',
    body: data,
  });
}

export function getTeam(teamId: number) {
  return request<TeamDetail>(`/teams/${teamId}`);
}

export function getDashboard(teamId: number) {
  return request<TeamDashboard>(`/teams/${teamId}/dashboard`);
}

export function joinTeam(teamId: number, data?: JoinTeamRequest) {
  return request<TeamMember>(`/teams/${teamId}/join`, {
    method: 'POST',
    body: data,
  });
}

export function getMembers(teamId: number) {
  return request<TeamMember[]>(`/teams/${teamId}/members`);
}

export function updateTeam(teamId: number, data: UpdateTeamRequest) {
  return request<TeamDetail>(`/teams/${teamId}`, {
    method: 'PATCH',
    body: data,
  });
}

export function updateTeamPassword(
  teamId: number,
  data: UpdateTeamPasswordRequest,
) {
  return request<TeamPasswordStatus>(`/teams/${teamId}/password`, {
    method: 'PATCH',
    body: data,
  });
}

export function transferLeader(teamId: number, newLeaderUserId: number) {
  return request<TransferLeaderResponse>(`/teams/${teamId}/leader`, {
    method: 'PATCH',
    body: { newLeaderUserId },
  });
}

export function removeMember(teamId: number, memberId: number) {
  return request<null>(`/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
  });
}
