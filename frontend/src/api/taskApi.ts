import { request } from './client';
import type {
  SaveCommentRequest,
  SaveTaskRequest,
  Task,
  TaskComment,
  TaskFilter,
  TaskStatus,
} from '../types/task';

export function getTasks(teamId: number, params?: TaskFilter) {
  return request<WireTask[]>(`/teams/${teamId}/tasks`, {
    query: params,
  }).then((tasks) => tasks.map(normalizeTask));
}

export function createTask(teamId: number, data: SaveTaskRequest) {
  return request<WireTask>(`/teams/${teamId}/tasks`, {
    method: 'POST',
    body: data,
  }).then(normalizeTask);
}

export function getTask(taskId: number) {
  return request<WireTask>(`/tasks/${taskId}`).then(normalizeTask);
}

export function updateTask(taskId: number, data: SaveTaskRequest) {
  return request<WireTask>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: data,
  }).then(normalizeTask);
}

export function updateTaskStatus(taskId: number, status: TaskStatus) {
  return request<WireTask>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: { status },
  }).then(normalizeTask);
}

type WireTask = Omit<Task, 'status'> & {
  status?: TaskStatus;
  completed?: boolean;
};

function normalizeTask(task: WireTask): Task {
  return {
    ...task,
    status: task.status ?? (task.completed ? 'DONE' : 'BACKLOG'),
  };
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
