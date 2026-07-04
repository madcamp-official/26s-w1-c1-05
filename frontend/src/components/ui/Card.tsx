import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'paper' | 'sunken';
  interactive?: boolean;
  children: ReactNode;
};

export function Card({ tone = 'paper', interactive = false, children, className = '', ...props }: CardProps) {
  const classes = ['ds-card', `ds-card-${tone}`, interactive ? 'ds-card-interactive' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
