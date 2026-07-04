type InitialsAvatarProps = {
  name: string;
};

export function InitialsAvatar({ name }: InitialsAvatarProps) {
  return (
    <span className="avatar" title={name} aria-label={name}>
      {getInitials(name)}
    </span>
  );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return initials.toUpperCase() || '?';
}
