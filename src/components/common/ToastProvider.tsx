import React, { useCallback, useState } from 'react';
import { ToastContext } from '../../context/ToastContext';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const iconMap: Record<ToastVariant, string> = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const colorMap: Record<ToastVariant, string> = {
    success: 'border-emerald-400/40 text-emerald-300',
    error: 'border-rose-400/50 text-error',
    warning: 'border-amber-400/40 text-tertiary',
    info: 'border-secondary/40 text-secondary',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto glass-elevated rounded-2xl px-4 py-3 flex items-center gap-3 border ${colorMap[t.variant]}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">
              {iconMap[t.variant]}
            </span>
            <p className="text-body-sm text-on-surface flex-1">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
