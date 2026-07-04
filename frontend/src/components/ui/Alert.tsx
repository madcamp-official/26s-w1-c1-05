import './Alert.css';

type AlertProps = {
  message?: string | null;
  tone?: 'danger' | 'info' | 'success';
};

export function Alert({ message, tone = 'danger' }: AlertProps) {
  if (!message) {
    return null;
  }

  return <div className={`ds-alert ds-alert-${tone}`}>{message}</div>;
}
