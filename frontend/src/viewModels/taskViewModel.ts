import type { Task, TaskPriority } from '../types/task';

export type TaskColumnKey = 'backlog' | 'progress' | 'done';

export type TaskCardView = {
  task: Task;
  displayId: string;
  column: TaskColumnKey;
  statusLabel: string;
  status: 'todo' | 'progress' | 'done';
  title: string;
  description: string;
  priority: TaskPriority;
  priorityLabel: string;
  dueLabel: string;
  assigneeNames: string;
};

export function toTaskCardView(task: Task): TaskCardView {
  const column = getTaskColumn(task);
  return {
    task,
    displayId: `SM-${task.id}`,
    column,
    statusLabel: getStatusLabel(column),
    status: column === 'done' ? 'done' : column === 'progress' ? 'progress' : 'todo',
    title: task.title,
    description: task.description || '설명이 없습니다.',
    priority: task.priority,
    priorityLabel: getPriorityLabel(task.priority),
    dueLabel: getDueLabel(task),
    assigneeNames: task.assignees.map((user) => user.name).join(', '),
  };
}

export function getTaskColumn(task: Task): TaskColumnKey {
  if (task.status === 'DONE') {
    return 'done';
  }
  if (task.status === 'IN_PROGRESS') {
    return 'progress';
  }
  return 'backlog';
}

function getDueLabel(task: Task) {
  if (task.status === 'DONE') {
    return 'Completed';
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${task.dueDate}T00:00:00`);
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`;
  }
  if (diffDays === 0) {
    return 'Due today';
  }
  if (diffDays === 1) {
    return 'Due tomorrow';
  }
  return `In ${diffDays} days`;
}

function getStatusLabel(column: TaskColumnKey) {
  if (column === 'done') {
    return 'Completed';
  }
  if (column === 'progress') {
    return 'In progress';
  }
  return 'Backlog';
}

function getPriorityLabel(priority: TaskPriority) {
  if (priority === 'HIGH') {
    return 'HIGH';
  }
  if (priority === 'LOW') {
    return 'LOW';
  }
  return 'MEDIUM';
}
