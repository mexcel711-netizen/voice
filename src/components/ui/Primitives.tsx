import React, { useEffect } from 'react';
import { isSupabaseConfigured } from '../../services/supabase';
import type { RiskLevel } from '../../types/db';

export function ZaraOrbLogo({
  size = 'sm',
  className = '',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dims =
    size === 'xs'
      ? 'w-7 h-7'
      : size === 'sm'
      ? 'w-9 h-9'
      : size === 'md'
      ? 'w-14 h-14'
      : 'w-28 h-28';

  return (
    <div
      className={`relative rounded-full bg-gradient-to-br from-primary via-primary-container to-secondary-container p-[2px] shadow-[0_0_24px_rgba(244,84,163,0.45)] flex items-center justify-center shrink-0 ${dims} ${className}`}
      aria-hidden="true"
    >
      <div className="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/40 via-transparent to-secondary-container/50" />
        <svg viewBox="0 0 48 48" className="w-3/4 h-3/4 relative z-10" fill="none">
          <circle
            cx="24"
            cy="24"
            r="17"
            stroke="url(#zaraLogoGrad)"
            strokeWidth="2.2"
            strokeDasharray="4 4"
          />
          <circle cx="24" cy="24" r="9.5" stroke="#ffb0ce" strokeWidth="2" />
          <circle cx="24" cy="24" r="4" fill="#f1be68" />
          <defs>
            <linearGradient id="zaraLogoGrad" x1="0" y1="0" x2="48" y2="48">
              <stop offset="0%" stopColor="#ffb0ce" />
              <stop offset="100%" stopColor="#cabeff" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export function GlassCard({
  children,
  className = '',
  elevated = false,
}: {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}) {
  return (
    <div
      className={`${
        elevated ? 'glass-elevated' : 'glass-panel'
      } rounded-[20px] ${className}`}
    >
      {children}
    </div>
  );
}

export function PillButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const styles =
    variant === 'primary'
      ? 'btn-primary-glow font-semibold'
      : variant === 'danger'
      ? 'bg-error-container hover:brightness-110 text-on-error-container border border-error/40 font-semibold shadow-[0_4px_20px_rgba(255,92,108,0.25)]'
      : variant === 'ghost'
      ? 'bg-transparent hover:bg-surface-container-high/70 text-on-surface-variant hover:text-on-surface'
      : 'bg-surface-container-high/80 hover:bg-surface-bright text-on-surface border border-border-subtle/80 hover:border-electric-violet/40';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-label-md text-label-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
        checked
          ? 'bg-gradient-to-r from-primary-container to-secondary-container shadow-[0_0_12px_rgba(244,84,163,0.45)]'
          : 'bg-surface-container-highest border border-outline-variant/60'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-on-surface shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    low: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    medium: 'bg-amber-500/15 text-tertiary border-tertiary/30',
    high: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    critical: 'bg-error-container/60 text-error border-error/50',
  };
  const icons: Record<RiskLevel, string> = {
    low: 'verified',
    medium: 'shield',
    high: 'warning',
    critical: 'gpp_bad',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${styles[risk]}`}
    >
      <span className="material-symbols-outlined text-[13px]">{icons[risk]}</span>
      {risk} Risk
    </span>
  );
}

export function ComingLaterBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-container-highest text-on-surface-variant border border-outline-variant/50">
      <span className="material-symbols-outlined text-[12px]">schedule</span>
      Coming later
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <GlassCard className="p-8 md:p-10 text-center flex flex-col items-center justify-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary shadow-[0_0_24px_rgba(244,84,163,0.18)]">
        <span className="material-symbols-outlined text-[30px]">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">{subtitle}</p>
      {actionLabel && onAction && (
        <PillButton onClick={onAction} className="mt-2">
          {actionLabel}
        </PillButton>
      )}
    </GlassCard>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-panel rounded-[20px] p-6 animate-pulse space-y-3">
      <div className="h-5 w-1/3 rounded-full bg-surface-container-highest" />
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="h-3.5 rounded-full bg-surface-container-high"
          style={{ width: `${88 - idx * 14}%` }}
        />
      ))}
    </div>
  );
}

export function SupabaseConfigNotice({ compact = false }: { compact?: boolean }) {
  if (isSupabaseConfigured()) return null;
  return (
    <div
      role="note"
      className={`rounded-2xl border border-secondary/30 bg-surface-container-high/60 backdrop-blur-md flex items-center gap-3 text-body-sm text-on-surface-variant ${
        compact ? 'px-3.5 py-2' : 'px-4 py-3'
      }`}
    >
      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
        cloud_off
      </span>
      <p className="text-xs leading-relaxed">
        <strong className="text-on-surface font-semibold">Supabase configure nahi hai:</strong>{' '}
        Local session state active hai; cloud database sync aur Local Agent ke liye{' '}
        <code className="text-primary">VITE_SUPABASE_URL</code> aur{' '}
        <code className="text-primary">VITE_SUPABASE_ANON_KEY</code> set karein.
      </p>
    </div>
  );
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`glass-elevated w-full ${maxWidth} rounded-t-3xl md:rounded-[24px] p-6 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
          <button
            type="button"
            aria-label={`Close ${title}`}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
