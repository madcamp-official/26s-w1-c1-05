import { request } from './client';
import type { TaskDependency } from '../types/task';

export function getTeamDependencies(teamId: number) {
  return request<TaskDependency[]>(`/teams/${teamId}/task-dependencies`);
}

export function addDependency(taskId: number, predecessorTaskId: number) {
  return request<TaskDependency>(`/tasks/${taskId}/dependencies`, {
    method: 'POST',
    body: { predecessorTaskId },
  });
}

export function removeDependency(taskId: number, predecessorTaskId: number) {
  return request<null>(`/tasks/${taskId}/dependencies/${predecessorTaskId}`, {
    method: 'DELETE',
  });
}
