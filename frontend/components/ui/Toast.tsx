'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    timeouts.current.delete(id);
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    const timer = setTimeout(() => remove(id), 4000);
    timeouts.current.set(id, timer);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              style={{ color: 'var(--color-text-muted)', fontSize: '16px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
