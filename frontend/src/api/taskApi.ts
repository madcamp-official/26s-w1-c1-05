import { request } from './client';
import type {
  SaveCommentRequest,
  SaveTaskRequest,
  Task,
  TaskComment,
  TaskFilter,
  TaskStatus,
  TaskRecommendation,
  TodoPrompt,
  AiTaskRecommendation,
  TodoList,
  SaveTodoListRequest,
} from '../types/task';

export function getTasks(teamId: number, params?: TaskFilter) {
  return request<WireTask[]>(`/teams/${teamId}/tasks`, {
    query: params,
  }).then((tasks) => tasks.map(normalizeTask));
}

export function getMyTasks(teamId: number, completed?: boolean) {
  return request<WireTask[]>(`/teams/${teamId}/tasks/my`, {
    query: completed == null ? undefined : { completed },
  }).then((tasks) => tasks.map(normalizeTask));
}

export function createTask(teamId: number, data: SaveTaskRequest) {
  return request<WireTask>(`/teams/${teamId}/tasks`, {
    method: 'POST',
    body: data,
  }).then(normalizeTask);
}

export function generateAiTaskRecommendation(teamId: number) {
  return request<AiTaskRecommendation>(`/teams/${teamId}/tasks/ai-recommendation`, {
    method: 'POST',
  });
}

export function acceptAiTaskRecommendation(teamId: number, data: AiTaskRecommendation) {
  return request<WireTask>(`/teams/${teamId}/tasks/ai-recommendation/accept`, {
    method: 'POST',
    body: {
      title: data.title,
      description: data.description ?? undefined,
      priority: data.priority,
      dueDate: data.dueDate,
    },
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

export function getTaskRecommendations(documentId: number) {
  return request<TaskRecommendation[]>(`/spec-documents/${documentId}/task-suggestions`, {
    method: 'POST',
  });
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

export function getTodoList(teamId: number) {
  return request<WireTodoList>(`/teams/${teamId}/todos`).then(normalizeTodoList);
}

export function updateTodoList(teamId: number, data: SaveTodoListRequest) {
  return request<WireTodoList>(`/teams/${teamId}/todos`, {
    method: 'PATCH',
    body: data,
  }).then(normalizeTodoList);
}

export function generateTodoPrompt(teamId: number) {
  return request<TodoPrompt>(`/teams/${teamId}/todos/prompt`, {
    method: 'POST',
  });
}

type WireTodoList = {
  selectedTasks: WireTask[];
  candidateTasks: WireTask[];
  recommendedTasks?: WireTask[];
};

function normalizeTodoList(todoList: WireTodoList): TodoList {
  return {
    selectedTasks: todoList.selectedTasks.map(normalizeTask),
    candidateTasks: todoList.candidateTasks.map(normalizeTask),
    recommendedTasks: (todoList.recommendedTasks ?? []).map(normalizeTask),
  };
}
