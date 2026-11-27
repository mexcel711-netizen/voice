import React, { useEffect, useState } from 'react';
import { PinPad } from '../components/safety/ConfirmModal';
import {
  ComingLaterBadge,
  GlassCard,
  ModalShell,
  PillButton,
  ToggleSwitch,
} from '../components/ui/Primitives';
import { useToast } from '../context/ToastContext';
import { useZara } from '../context/ZaraContext';
import type { LanguageMode, WakePhraseMode } from '../types/db';

const AURA_TINTS = [
  { hex: '#E94B9A', label: 'Zara Magenta' },
  { hex: '#8B5CF6', label: 'Electric Violet' },
  { hex: '#F1BE68', label: 'Warm Amber' },
  { hex: '#34D399', label: 'Emerald Aura' },
];

export default function Settings() {
  const {
    settings,
    providers,
    persona,
    memories,
    automations,
    reminders,
    prayerSettings,
    hasPinSet,
    updateSettings,
    testProvider,
    setPin,
    resetDataWorkspace,
    lockScreen,
    logout,
  } = useZara();
  const { showToast } = useToast();

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [testingProv, setTestingProv] = useState<string | null>(null);

  // Change PIN modal
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [currPin, setCurrPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinErr, setPinErr] = useState<string | null>(null);

  // Delete All Data modal
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipePin, setWipePin] = useState('');
  const [wipeErr, setWipeErr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((list) => setDevices(list.filter((d) => d.kind === 'audioinput')))
      .catch(() => setDevices([]));
  }, []);

  const geminiProv = providers.find((p) => p.provider === 'gemini');
  const elevenProv = providers.find((p) => p.provider === 'elevenlabs');

  const handleTest = async (prov: 'gemini' | 'elevenlabs') => {
    setTestingProv(prov);
    try {
      await testProvider(prov);
    } finally {
      setTestingProv(null);
    }
  };

  const handleChangePin = async () => {
    setPinErr(null);
    const res = await setPin(newPin, hasPinSet ? currPin : undefined);
    if (!res.ok) {
      setPinErr(res.error || 'Failed to update PIN.');
      return;
    }
    showToast('Owner 6-digit PIN updated.', 'success');
    setCurrPin('');
    setNewPin('');
    setPinModalOpen(false);
  };

  const handleBackupExport = () => {
    const bundle = {
      exported_at: new Date().toISOString(),
      settings,
      persona,
      memories,
      automations,
      reminders,
      prayerSettings,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zara-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Workspace backup downloaded.', 'success');
  };

  const handleResetWorkspace = async () => {
    setWipeErr(null);
    const res = await resetDataWorkspace(wipePin);
    if (!res.ok) {
      setWipeErr(res.error || 'PIN verification failed.');
      return;
    }
    showToast('All user conversations, memories, reminders, and automations cleared.', 'info');
    setWipePin('');
    setWipeOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">
          Preferences &amp; System Configuration
        </p>
        <h1 className="font-headline-lg text-headline-lg text-on-surface flex flex-wrap items-baseline gap-3">
          <span>System Settings</span>
          <span className="urdu-rtl text-xl text-primary-fixed-dim" dir="rtl" lang="ur">
            سیٹنگز اور کنفیگریشن
          </span>
        </h1>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Configure server-proxied AI pipelines, wake phrases, Owner PIN, appearance, and backups.
        </p>
      </div>

      {/* 1. AI & API Engines (No API Key Inputs!) */}
      <GlassCard className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              AI &amp; Voice Pipeline Connections
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Server-side credentials are injected securely via environment secrets — never stored in browser UI.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs bg-surface-container-high text-primary font-medium">
            {settings.live_model}
          </span>
        </div>

        {/* Gemini */}
        <div className="rounded-2xl p-4 bg-surface-container-low/80 border border-border-subtle space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-on-surface">Gemini 3.8 Live</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    geminiProv?.status === 'connected'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : geminiProv?.status === 'error'
                      ? 'bg-error-container/50 text-error'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {geminiProv?.status === 'connected'
                    ? `Connected (${geminiProv.last_latency_ms ?? 0}ms)`
                    : geminiProv?.status === 'error'
                    ? 'Error / Key Missing'
                    : 'Not Tested'}
                </span>
              </div>
              {geminiProv?.last_error && (
                <p className="text-xs text-error mt-1">{geminiProv.last_error}</p>
              )}
            </div>
            <PillButton
              variant="secondary"
              disabled={testingProv === 'gemini'}
              onClick={() => void handleTest('gemini')}
            >
              <span className="material-symbols-outlined text-[16px]">network_ping</span>
              {testingProv === 'gemini' ? 'Pinging...' : 'Test Ping'}
            </PillButton>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-on-surface-variant">Sampling Temperature</span>
              <span className="font-mono text-primary">{settings.sampling_temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.2}
              step={0.05}
              value={settings.sampling_temperature}
              onChange={(e) =>
                void updateSettings({ sampling_temperature: Number(e.target.value) })
              }
              className="zara-slider"
              aria-label="Sampling temperature"
            />
          </div>
        </div>

        {/* ElevenLabs */}
        <div className="rounded-2xl p-4 bg-surface-container-low/80 border border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-on-surface">ElevenLabs Optional TTS</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-surface-container-highest text-on-surface-variant">
                {elevenProv?.status ?? 'unknown'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Optional premium voice routing when `ELEVENLABS_API_KEY` is configured on server.
            </p>
          </div>
          <PillButton
            variant="secondary"
            disabled={testingProv === 'elevenlabs'}
            onClick={() => void handleTest('elevenlabs')}
          >
            {testingProv === 'elevenlabs' ? 'Testing...' : 'Test Voice Connection'}
          </PillButton>
        </div>

        {/* Whisper local fallback */}
        <div className="rounded-2xl p-4 bg-surface-container-low/40 border border-border-subtle/50 flex flex-wrap items-center justify-between gap-3 opacity-70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-on-surface">Local On-Device Whisper v3</span>
              <ComingLaterBadge />
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Offline speech recognition fallback planned alongside Zara Local Agent desktop service.
            </p>
          </div>
          <ToggleSwitch checked={false} disabled onChange={() => {}} label="Whisper local" />
        </div>
      </GlassCard>

      {/* 2. Speech, Wake Word & Language */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Speech, Wake Word &amp; Microphone
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(
            [
              { mode: 'primary', title: '"Hey Zara"', sub: 'Recommended default' },
              { mode: 'swift', title: '"Zara"', sub: 'Short instant wake' },
              { mode: 'native_urdu', title: 'سنو زہرا', sub: 'Suno Zara (Urdu)', urdu: true },
            ] as Array<{ mode: WakePhraseMode; title: string; sub: string; urdu?: boolean }>
          ).map((item) => {
            const active = settings.wake_phrase_mode === item.mode;
            return (
              <button
                key={item.mode}
                type="button"
                onClick={() => void updateSettings({ wake_phrase_mode: item.mode })}
                className={`rounded-2xl p-4 text-left border transition-all cursor-pointer ${
                  active
                    ? 'bg-primary/15 border-primary shadow-[0_0_16px_rgba(244,84,163,0.2)]'
                    : 'bg-surface-container-low border-border-subtle'
                }`}
              >
                <p className={`font-bold text-on-surface ${item.urdu ? 'urdu-rtl text-lg' : 'text-base'}`}>
                  {item.title}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">{item.sub}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">
              Microphone Input Device
            </label>
            <select
              value={settings.mic_device_id ?? ''}
              onChange={(e) =>
                void updateSettings({ mic_device_id: e.target.value || null })
              }
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            >
              <option value="">System Default Microphone</option>
              {devices.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId}>
                  {d.label || `Audio Input ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">
              Language &amp; Code-Switching
            </label>
            <select
              value={settings.language_mode}
              onChange={(e) =>
                void updateSettings({ language_mode: e.target.value as LanguageMode })
              }
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            >
              <option value="urdu_english">Bilingual Urdu + English</option>
              <option value="urdu">Urdu Primary</option>
              <option value="english">English Primary</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* 3. Owner Auth & Biometrics */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Owner Authentication &amp; Security
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl p-4 bg-surface-container-low border border-border-subtle flex flex-col justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm text-on-surface">Owner 6-Digit PIN</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {hasPinSet
                  ? 'PIN configured for quick unlock and sensitive laptop commands.'
                  : 'Set a 6-digit PIN to protect sensitive actions and session locks.'}
              </p>
            </div>
            <PillButton variant="secondary" onClick={() => setPinModalOpen(true)}>
              {hasPinSet ? 'Change Master PIN' : 'Set Master PIN'}
            </PillButton>
          </div>

          <div className="rounded-2xl p-4 bg-surface-container-low/50 border border-border-subtle/50 flex flex-col justify-between gap-3 opacity-70">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm text-on-surface">Touch ID / Windows Hello</h3>
                <ComingLaterBadge />
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                WebAuthn passkey &amp; hardware biometric unlock.
              </p>
            </div>
            <PillButton variant="secondary" disabled>
              Configure Biometrics
            </PillButton>
          </div>

          <div className="rounded-2xl p-4 bg-surface-container-low/50 border border-border-subtle/50 flex flex-col justify-between gap-3 opacity-70">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm text-on-surface">Acoustic Voiceprint</h3>
                <ComingLaterBadge />
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Verify Boss&rsquo;s voice timbre before sensitive actions.
              </p>
            </div>
            <PillButton variant="secondary" disabled>
              Calibrate Voiceprint
            </PillButton>
          </div>
        </div>
      </GlassCard>

      {/* 4. Appearance, Idle Lock & Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Appearance &amp; Session Lock
          </h2>
          <div>
            <p className="text-xs text-on-surface-variant mb-2">Primary Aura Tint</p>
            <div className="flex items-center gap-3">
              {AURA_TINTS.map((t) => {
                const selected = settings.accent_tint === t.hex;
                return (
                  <button
                    key={t.hex}
                    type="button"
                    aria-label={t.label}
                    onClick={() => void updateSettings({ accent_tint: t.hex })}
                    className={`w-9 h-9 rounded-full cursor-pointer transition-transform ${
                      selected ? 'ring-2 ring-white scale-110' : 'opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: t.hex }}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">
              Auto-Lock Idle Timeout
            </label>
            <select
              value={settings.auto_lock_minutes}
              onChange={(e) =>
                void updateSettings({ auto_lock_minutes: Number(e.target.value) })
              }
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={0}>Never auto-lock</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-on-surface-variant">
              Store conversation audio clips (requires Storage)
            </span>
            <ToggleSwitch
              checked={settings.store_audio}
              onChange={(next) => void updateSettings({ store_audio: next })}
              label="Toggle store audio clips"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Data Backup &amp; Session Lifecycle
            </h2>
            <p className="text-xs text-on-surface-variant">
              Export your memories, routines, reminders, and persona settings as portable JSON, or
              lock/reset your workspace.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <PillButton variant="secondary" onClick={handleBackupExport}>
                <span className="material-symbols-outlined text-[16px]">download</span>
                Export Backup JSON
              </PillButton>
              <PillButton
                variant="danger"
                onClick={() => {
                  setWipePin('');
                  setWipeErr(null);
                  setWipeOpen(true);
                }}
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                Delete All Data
              </PillButton>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle/50 flex flex-wrap items-center justify-between gap-2">
            <PillButton variant="secondary" onClick={lockScreen}>
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Lock Session
            </PillButton>
            <PillButton variant="ghost" className="text-error" onClick={() => void logout()}>
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Sign Out
            </PillButton>
          </div>
        </GlassCard>
      </div>

      {/* Change PIN Modal */}
      <ModalShell
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        title={hasPinSet ? 'Change Master Owner PIN' : 'Set Master Owner PIN'}
      >
        <div className="space-y-4">
          {hasPinSet && (
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">
                Current 6-digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={currPin}
                onChange={(e) => setCurrPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter current 6-digit PIN"
                className="zara-input w-full px-3.5 py-2.5 text-sm tracking-[0.35em]"
              />
            </div>
          )}
          <div>
            <p className="text-xs text-on-surface-variant mb-2">New 6-digit PIN</p>
            <PinPad
              value={newPin}
              onChange={(v) => {
                setNewPin(v);
                setPinErr(null);
              }}
              onSubmit={() => void handleChangePin()}
              disabled={hasPinSet && currPin.length !== 6}
              submitLabel="Save PIN"
              errorShake={Boolean(pinErr)}
            />
          </div>
          {pinErr && (
            <p role="alert" className="text-xs text-error font-medium">
              {pinErr}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <PillButton variant="ghost" onClick={() => setPinModalOpen(false)}>
              Cancel
            </PillButton>
          </div>
        </div>
      </ModalShell>

      {/* Delete All Data Modal */}
      <ModalShell
        isOpen={wipeOpen}
        onClose={() => setWipeOpen(false)}
        title="Delete All Workspace Data"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-on-surface-variant">
            This clears all conversations, memories, reminders, automations, and emotion logs.
            Enter your 6-digit Owner PIN to confirm.
          </p>
          {wipeErr && (
            <p role="alert" className="text-xs text-error font-medium">
              {wipeErr}
            </p>
          )}
          <PinPad
            value={wipePin}
            onChange={(v) => {
              setWipePin(v);
              setWipeErr(null);
            }}
            onSubmit={() => void handleResetWorkspace()}
            submitLabel="Delete All Data"
            errorShake={Boolean(wipeErr)}
          />
          <div className="flex justify-end gap-2">
            <PillButton variant="ghost" onClick={() => setWipeOpen(false)}>
              Cancel
            </PillButton>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
