import type { UserSummary } from './auth';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'DONE';

export type Task = {
  id: number;
  teamId: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  createdBy: UserSummary;
  assignees: UserSummary[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskComment = {
  id: number;
  taskId: number;
  author: UserSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskFilter = {
  priority?: TaskPriority;
  assigneeId?: number;
  dueFrom?: string;
  dueTo?: string;
};

export type SaveTaskRequest = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: string;
  assigneeUserIds: number[];
};

export type SaveCommentRequest = {
  content: string;
};
