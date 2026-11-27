import React, { useState } from 'react';
import { ModalShell, PillButton, RiskBadge } from '../ui/Primitives';
import type { ConfirmModalState } from '../../context/ToastContext';
import { pinSchema } from '../../lib/validation';

export function PinPad({
  value,
  onChange,
  onSubmit,
  disabled = false,
  submitLabel = 'Unlock Zara',
  errorShake = false,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitLabel?: string;
  errorShake?: boolean;
}) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const pushDigit = (d: string) => {
    if (disabled || value.length >= 6) return;
    onChange(value + d);
  };

  const backspace = () => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  return (
    <div className="space-y-5">
      <div
        className={`grid grid-cols-6 gap-2.5 max-w-[280px] mx-auto ${
          errorShake ? 'animate-shake' : ''
        }`}
        aria-label={`6-digit PIN entry (${value.length} of 6 digits entered)`}
      >
        {Array.from({ length: 6 }).map((_, i) => {
          const filled = i < value.length;
          return (
            <div
              key={i}
              className={`h-12 rounded-xl border flex items-center justify-center transition-all ${
                filled
                  ? 'border-primary bg-surface-container-high shadow-[0_0_16px_rgba(244,84,163,0.3)]'
                  : 'border-outline-variant/60 bg-surface-container-lowest/80'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  filled ? 'bg-primary scale-110' : 'bg-outline-variant/50 scale-75'
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => pushDigit(d)}
            className="h-12 rounded-xl bg-surface-container-high/85 hover:bg-surface-bright text-on-surface font-headline-sm text-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('')}
          className="h-12 rounded-xl bg-surface-container/80 hover:bg-surface-container-high text-on-surface-variant text-label-sm font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-40"
        >
          CLEAR
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => pushDigit('0')}
          className="h-12 rounded-xl bg-surface-container-high/85 hover:bg-surface-bright text-on-surface font-headline-sm text-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Backspace PIN digit"
          onClick={backspace}
          className="h-12 rounded-xl bg-surface-container/80 hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center cursor-pointer disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[20px]">backspace</span>
        </button>
      </div>

      <PillButton
        type="button"
        disabled={disabled || value.length !== 6}
        onClick={onSubmit}
        className="w-full py-3"
      >
        <span className="material-symbols-outlined text-[18px]">lock_open</span>
        {submitLabel}
      </PillButton>
    </div>
  );
}

export function ConfirmModal({
  state,
  onClose,
}: {
  state: ConfirmModalState | null;
  onClose: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!state || !state.isOpen) return null;

  const handleConfirm = async () => {
    setError(null);
    if (state.method === 'pin') {
      const parsed = pinSchema.safeParse(pin);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || 'Enter 6-digit owner PIN.');
        return;
      }
    }
    setBusy(true);
    try {
      await state.onConfirm(state.method === 'pin' ? pin : undefined);
      setPin('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    setError(null);
    state.onCancel?.();
    onClose();
  };

  return (
    <ModalShell isOpen={state.isOpen} onClose={handleCancel} title={state.title}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {state.riskLevel && <RiskBadge risk={state.riskLevel} />}
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-secondary">
            {state.method === 'pin'
              ? '6-Digit PIN Required'
              : state.method === 'voice'
              ? 'Voice Consent Required'
              : 'Manual Approval'}
          </span>
        </div>

        <p className="text-body-sm text-on-surface-variant">{state.description}</p>

        {state.commandSummary && (
          <div className="rounded-xl bg-surface-container-lowest/90 border border-outline-variant/50 px-3.5 py-2.5 font-mono text-xs text-primary">
            {state.commandSummary}
          </div>
        )}

        {state.method === 'pin' && (
          <PinPad
            value={pin}
            onChange={(v) => {
              setPin(v);
              setError(null);
            }}
            onSubmit={handleConfirm}
            disabled={busy}
            submitLabel={state.confirmLabel || 'Verify PIN & Confirm'}
            errorShake={Boolean(error)}
          />
        )}

        {error && (
          <p role="alert" className="text-xs text-error font-medium">
            {error}
          </p>
        )}

        {state.method !== 'pin' && (
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
            <PillButton variant="secondary" onClick={handleCancel} disabled={busy}>
              Reject / Cancel
            </PillButton>
            <PillButton
              variant={state.riskLevel === 'critical' ? 'danger' : 'primary'}
              onClick={handleConfirm}
              disabled={busy}
            >
              {busy
                ? 'Processing...'
                : state.confirmLabel ||
                  (state.method === 'voice' ? 'Haan / Approve' : 'Approve Action')}
            </PillButton>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
