import type { TaskPriority } from '../types/task';

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export type DueTone = 'overdue' | 'soon' | 'normal';

export function dueLabel(dueDateISO: string, completed: boolean): { label: string; tone: DueTone } {
  if (completed) {
    return { label: 'Completed', tone: 'normal' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDateISO}T00:00:00`);
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return { label: `${-diffDays}d overdue`, tone: 'overdue' };
  }
  if (diffDays === 0) {
    return { label: 'Due today', tone: 'soon' };
  }
  if (diffDays === 1) {
    return { label: 'Due tomorrow', tone: 'soon' };
  }
  if (diffDays <= 2) {
    return { label: `In ${diffDays} days`, tone: 'soon' };
  }
  return { label: `In ${diffDays} days`, tone: 'normal' };
}

export function priorityTone(priority: TaskPriority): { label: string; variant: 'solid' | 'subtle' | 'outline' } {
  if (priority === 'HIGH') {
    return { label: 'HIGH', variant: 'solid' };
  }
  if (priority === 'MEDIUM') {
    return { label: 'MEDIUM', variant: 'subtle' };
  }
  return { label: 'LOW', variant: 'outline' };
}

export function relativeTime(isoString: string): string {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(then);
}

export function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
}

export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoString));
}
