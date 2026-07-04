import type { HTMLAttributes, ReactNode } from 'react';
import './Badge.css';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'solid' | 'outline' | 'subtle' | 'mono';
  children: ReactNode;
};

export function Badge({ variant = 'outline', children, className = '', ...props }: BadgeProps) {
  const classes = ['ds-badge', `ds-badge-${variant}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
