import React from 'react';
import type { LiveVoiceState } from '../../services/live.service';

export function VoiceOrb({
  state = 'idle',
  size = 'lg',
  onClick,
  ariaLabel = 'Activate Zara voice orb',
}: {
  state?: LiveVoiceState;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const outer =
    size === 'sm'
      ? 'w-28 h-28'
      : size === 'md'
      ? 'w-44 h-44'
      : 'w-56 h-56 lg:w-64 lg:h-64';
  const core =
    size === 'sm'
      ? 'w-20 h-20'
      : size === 'md'
      ? 'w-32 h-32'
      : 'w-40 h-40 lg:w-44 lg:h-44';

  const auraColor =
    state === 'speaking'
      ? 'from-primary/35 to-primary-container/35'
      : state === 'listening'
      ? 'from-secondary-container/40 to-secondary/30'
      : state === 'thinking'
      ? 'from-tertiary/30 to-secondary-container/30'
      : state === 'error'
      ? 'from-error-container/50 to-error/30'
      : 'from-primary-container/20 to-secondary-container/20';

  const coreBorder =
    state === 'speaking'
      ? 'from-primary via-primary-container to-secondary-container shadow-[0_0_50px_rgba(244,84,163,0.65)]'
      : state === 'listening'
      ? 'from-secondary via-secondary-container to-primary-container shadow-[0_0_50px_rgba(124,92,255,0.55)]'
      : state === 'thinking'
      ? 'from-tertiary via-primary to-secondary shadow-[0_0_45px_rgba(241,190,104,0.5)]'
      : 'from-primary/70 via-primary-container/70 to-secondary-container/70 shadow-[0_0_32px_rgba(244,84,163,0.35)]';

  const labelText =
    state === 'connecting'
      ? 'Connecting'
      : state === 'listening'
      ? 'Listening'
      : state === 'thinking'
      ? 'Thinking'
      : state === 'speaking'
      ? 'Speaking'
      : state === 'muted'
      ? 'Muted'
      : state === 'error'
      ? 'Error'
      : 'Zara Core';

  const inner = (
    <div className={`relative flex items-center justify-center ${outer}`}>
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${auraColor} blur-2xl animate-orb-breathe`}
      />
      {state === 'speaking' || state === 'listening' ? (
        <div
          className="absolute inset-4 rounded-full bg-gradient-to-tr from-primary-container/35 to-secondary/25 blur-md animate-ping"
          style={{ animationDuration: state === 'speaking' ? '2.5s' : '3.8s' }}
        />
      ) : null}
      <div
        className={`relative ${core} rounded-full p-1 bg-gradient-to-br ${coreBorder} flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105`}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-surface-container-lowest via-surface-container-high to-primary-container/30 flex items-center justify-center relative overflow-hidden backdrop-blur-sm">
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-primary text-[34px] drop-shadow-[0_0_12px_rgba(255,176,206,0.9)]">
              {state === 'muted'
                ? 'mic_off'
                : state === 'error'
                ? 'error'
                : 'lens_blur'}
            </span>
            <span className="font-label-sm text-[10px] tracking-widest text-primary-fixed uppercase font-bold mt-1">
              {labelText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="group cursor-pointer rounded-full focus-visible:outline-none"
      >
        {inner}
      </button>
    );
  }
  return inner;
}

const BAR_HEIGHTS = [16, 28, 44, 24, 52, 36, 60, 32, 54, 42, 58, 34, 48, 26, 44, 20];

export function Waveform({
  active = false,
  tone = 'rose',
  className = '',
}: {
  active?: boolean;
  tone?: 'rose' | 'violet' | 'gold';
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-1.5 h-16 px-4 ${className}`}
      aria-hidden="true"
    >
      {BAR_HEIGHTS.map((h, i) => {
        const barColor =
          tone === 'gold'
            ? i % 2 === 0
              ? 'bg-tertiary'
              : 'bg-tertiary-container'
            : tone === 'violet'
            ? i % 2 === 0
              ? 'bg-secondary'
              : 'bg-secondary-container'
            : i % 3 === 0
            ? 'bg-primary'
            : i % 3 === 1
            ? 'bg-primary-container'
            : 'bg-secondary';

        return (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all ${barColor} ${
              active ? 'animate-wave-bar' : 'opacity-55'
            }`}
            style={{
              height: active ? `${h}px` : `${Math.max(10, Math.round(h * 0.45))}px`,
              animationDuration: `${0.45 + (i % 5) * 0.14}s`,
              animationDelay: `${(i % 4) * 0.08}s`,
            }}
          />
        );
      })}
    </div>
  );
}
