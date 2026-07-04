import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import './Button.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}, ref) {
  const classes = ['ds-btn', `ds-btn-${variant}`, `ds-btn-${size}`, className].filter(Boolean).join(' ');

  return (
    <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading ? 'Working…' : children}
    </button>
  );
});
