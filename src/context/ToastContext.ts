import React, { createContext, useContext } from 'react';
import type { ToastVariant } from '../components/common/ToastProvider';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  description: string;
  method: 'manual' | 'voice' | 'pin';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  commandSummary?: string;
  confirmLabel?: string;
  onConfirm: (pin?: string) => Promise<void> | void;
  onCancel?: () => void;
}

export interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}
