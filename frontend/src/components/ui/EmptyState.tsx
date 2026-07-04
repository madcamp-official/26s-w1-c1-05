import type { ReactNode } from 'react';
import './EmptyState.css';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="ds-empty">
      {icon && <div className="ds-empty-icon">{icon}</div>}
      <div className="ds-empty-title">{title}</div>
      {description && <div className="ds-empty-description">{description}</div>}
      {action}
    </div>
  );
}
