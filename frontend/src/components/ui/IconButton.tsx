import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './IconButton.css';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  active?: boolean;
};

export function IconButton({ children, active = false, className = '', ...props }: IconButtonProps) {
  const classes = ['ds-icon-btn', active ? 'ds-icon-btn-active' : '', className].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
