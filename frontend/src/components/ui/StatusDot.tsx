<<<<<<< HEAD:frontend/src/components/common/StatusDot.tsx
type StatusDotProps = {
  status: 'todo' | 'progress' | 'done' | 'blocked';
};

export function StatusDot({ status }: StatusDotProps) {
  return <span className={`status-dot status-dot-${status}`} aria-hidden="true" />;
=======
import './StatusDot.css';

type StatusDotProps = {
  variant: 'filled' | 'half' | 'outline' | 'danger';
};

export function StatusDot({ variant }: StatusDotProps) {
  return <span className={`ds-status-dot ds-status-dot-${variant}`} aria-hidden="true" />;
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92:frontend/src/components/ui/StatusDot.tsx
}
