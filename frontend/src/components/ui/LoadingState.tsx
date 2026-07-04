import './LoadingState.css';

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="ds-loading">
      <span className="ds-loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
