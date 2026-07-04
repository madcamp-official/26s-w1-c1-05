import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { ToastContext } from './ToastContext';
import './ToastProvider.css';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const toast = useCallback((nextMessage = '저장되었습니다') => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    setMessage(nextMessage);
    timerRef.current = window.setTimeout(() => setMessage(null), 1800);
  }, []);

  useEffect(() => () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {message && (
        <div className="ds-toast" role="status" aria-live="polite">
          <Check size={15} aria-hidden="true" />
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
