import './StatusDot.css';

type StatusDotProps = {
  variant: 'filled' | 'half' | 'outline' | 'danger';
};

export function StatusDot({ variant }: StatusDotProps) {
  return <span className={`ds-status-dot ds-status-dot-${variant}`} aria-hidden="true" />;
}
