import { request } from './client';
import type {
  SaveCommentRequest,
  SaveTaskRequest,
  Task,
  TaskComment,
  TaskFilter,
} from '../types/task';

export function getTasks(teamId: number, params?: TaskFilter) {
  return request<Task[]>(`/teams/${teamId}/tasks`, {
    query: params,
  });
}

export function createTask(teamId: number, data: SaveTaskRequest) {
  return request<Task>(`/teams/${teamId}/tasks`, {
    method: 'POST',
    body: data,
  });
}

export function getTask(taskId: number) {
  return request<Task>(`/tasks/${taskId}`);
}

export function updateTask(taskId: number, data: SaveTaskRequest) {
  return request<Task>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: data,
  });
}

export function updateTaskCompletion(taskId: number, completed: boolean) {
  return request<Task>(`/tasks/${taskId}/completion`, {
    method: 'PATCH',
    body: { completed },
  });
}

export function deleteTask(taskId: number) {
  return request<null>(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export function getComments(taskId: number) {
  return request<TaskComment[]>(`/tasks/${taskId}/comments`);
}

export function createComment(taskId: number, data: SaveCommentRequest) {
  return request<TaskComment>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: data,
  });
}

export function updateComment(commentId: number, data: SaveCommentRequest) {
  return request<TaskComment>(`/comments/${commentId}`, {
    method: 'PATCH',
    body: data,
  });
}

export function deleteComment(commentId: number) {
  return request<null>(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}
