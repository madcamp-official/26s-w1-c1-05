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
