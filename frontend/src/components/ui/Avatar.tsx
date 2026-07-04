import { initials } from '../../utils/format';
import './Avatar.css';

type AvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'neutral' | 'ink';
};

export function Avatar({ name, size = 'md', tone = 'neutral' }: AvatarProps) {
  return (
    <span className={`ds-avatar ds-avatar-${size} ds-avatar-${tone}`} title={name}>
      {initials(name)}
    </span>
  );
}
