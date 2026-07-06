import type { UserSummary } from './auth';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'DONE';

export type Task = {
  id: number;
  teamId: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
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
  completed?: boolean;
  priority?: TaskPriority;
  assigneeId?: number;
};

export type SaveTaskRequest = {
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeUserIds: number[];
};

export type TaskRecommendation = {
  id?: number;
  specDocumentId?: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  reason?: string;
};

export type TodoPrompt = {
  prompt: string;
  generatedBy: 'GEMINI' | 'LOCAL_FALLBACK' | string;
};

export type AiTaskRecommendation = {
  task: Task;
  reason: string | null;
  generatedBy: 'GEMINI' | 'LOCAL_FALLBACK' | string;
};

export type SaveCommentRequest = {
  content: string;
};

export type TodoList = {
  selectedTasks: Task[];
  candidateTasks: Task[];
  recommendedTasks: Task[];
};

export type SaveTodoListRequest = {
  taskIds: number[];
};
