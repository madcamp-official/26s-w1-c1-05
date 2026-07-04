type StatusDotProps = {
  status: 'todo' | 'progress' | 'done' | 'blocked';
};

export function StatusDot({ status }: StatusDotProps) {
  return <span className={`status-dot status-dot-${status}`} aria-hidden="true" />;
}
