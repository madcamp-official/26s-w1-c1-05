import { request } from './client';
import type {
  Retrospective,
  RetrospectiveFilter,
  SaveRetrospectiveRequest,
} from '../types/retrospective';

export function getRetrospectives(teamId: number, params?: RetrospectiveFilter) {
  return request<Retrospective[]>(`/teams/${teamId}/retrospectives`, {
    query: params,
  });
}

export function createRetrospective(teamId: number, data: SaveRetrospectiveRequest) {
  return request<Retrospective>(`/teams/${teamId}/retrospectives`, {
    method: 'POST',
    body: data,
  });
}

export function getRetrospective(retrospectiveId: number) {
  return request<Retrospective>(`/retrospectives/${retrospectiveId}`);
}

export function updateRetrospective(
  retrospectiveId: number,
  data: SaveRetrospectiveRequest,
) {
  return request<Retrospective>(`/retrospectives/${retrospectiveId}`, {
    method: 'PATCH',
    body: data,
  });
}

export function deleteRetrospective(retrospectiveId: number) {
  return request<null>(`/retrospectives/${retrospectiveId}`, {
    method: 'DELETE',
  });
}
