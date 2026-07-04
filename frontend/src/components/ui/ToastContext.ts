import { createContext, useContext } from 'react';

export type ToastFunction = (message?: string) => void;
export const ToastContext = createContext<ToastFunction | null>(null);

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used inside ToastProvider.');
  return toast;
}
