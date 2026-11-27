import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useZara } from '../context/ZaraContext';
import {
  EmptyState,
  GlassCard,
  ModalShell,
  PillButton,
  SkeletonCard,
} from '../components/ui/Primitives';
import { VoiceOrb, Waveform } from '../components/voice/VoiceOrb';
import { formatClockTime, formatTimeGreeting } from '../lib/format';
import { calculatePrayerTimesForDate, getNextPrayer } from '../lib/prayer';
import { reminderSchema } from '../lib/validation';
import { useToast } from '../context/ToastContext';

export default function DashboardHome() {
  const {
    loading,
    persona,
    settings,
    emotionLogs,
    device,
    deviceOnline,
    reminders,
    prayerSettings,
    sessions,
    dispatchCommand,
    toggleReminderComplete,
    createReminder,
  } = useZara();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remDue, setRemDue] = useState('');
  const [remCategory, setRemCategory] = useState<'work_code' | 'personal_health' | 'other'>(
    'personal_health'
  );
  const [remError, setRemError] = useState<string | null>(null);

  const latestMood = emotionLogs[0];
  const greeting = formatTimeGreeting();
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const nextPrayer = useMemo(() => {
    if (prayerSettings.latitude == null || prayerSettings.longitude == null) return null;
    const day = calculatePrayerTimesForDate(
      prayerSettings.latitude,
      prayerSettings.longitude,
      new Date(),
      prayerSettings.calculation_method,
      prayerSettings.asr_method
    );
    return getNextPrayer(day);
  }, [prayerSettings]);

  const upcomingReminders = useMemo(
    () => reminders.filter((r) => !r.is_completed).slice(0, 4),
    [reminders]
  );

  const recentSessions = useMemo(() => sessions.slice(0, 3), [sessions]);

  const handleQuickAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setRemError(null);
    const parsed = reminderSchema.safeParse({
      title: remTitle,
      kind: 'reminder',
      due_at: remDue ? new Date(remDue).toISOString() : '',
      repeat_rule: 'none',
      category: remCategory,
      notify_mode: 'both',
    });
    if (!parsed.success) {
      setRemError(parsed.error.issues[0]?.message || 'Check reminder fields.');
      return;
    }
    await createReminder({
      kind: parsed.data.kind,
      title: parsed.data.title,
      notes: '',
      due_at: parsed.data.due_at,
      duration_seconds: null,
      repeat_rule: parsed.data.repeat_rule,
      repeat_days: [],
      category: parsed.data.category,
      notify_mode: parsed.data.notify_mode,
      voice_created: false,
    });
    setRemTitle('');
    setRemDue('');
    setReminderModalOpen(false);
    showToast('Reminder saved.', 'success');
  };

  if (loading) {
    return (
        <div className="space-y-6">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={4} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-8 pb-6">
        {/* Top Greeting & Mood Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                Companion Core
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="urdu-rtl text-sm text-secondary" dir="rtl" lang="ur">
                خوش آمدید، {persona.owner_nickname || 'باس'}
              </span>
            </div>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface font-extrabold tracking-tight">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {persona.owner_nickname || 'Boss'}.
              </span>{' '}
              Ready when you are.
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant flex flex-wrap items-center gap-2">
              <span>{todayLabel}</span>
              <span className="w-1 h-1 rounded-full bg-outline" />
              <span className={deviceOnline ? 'text-emerald-300' : 'text-on-surface-variant'}>
                {deviceOnline && device
                  ? `${device.device_name} Online`
                  : 'Laptop Offline — Agent disconnected'}
              </span>
            </p>
          </div>

          <Link
            to="/emotions"
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-elevated hover:border-primary/40 transition-all shrink-0 whitespace-nowrap"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span className="font-label-sm text-primary font-semibold capitalize">
                Mood: {latestMood ? latestMood.zara_emotion : 'Ready & Attentive'}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {latestMood
                  ? `Intensity ${latestMood.intensity}%`
                  : settings.mirror_mode_enabled
                  ? 'Mirror Mode On'
                  : 'Balanced Tone'}
              </span>
            </div>
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">favorite</span>
          </Link>
        </div>

        {/* Central Voice Hero */}
        <GlassCard className="p-6 sm:p-10 text-center flex flex-col items-center space-y-5 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-gradient-to-b from-primary-container/15 via-secondary-container/10 to-transparent rounded-full blur-3xl" />

          <VoiceOrb
            size="md"
            state={settings.panic_active ? 'error' : settings.mic_enabled ? 'listening' : 'muted'}
            onClick={() => navigate('/talk')}
            ariaLabel="Open Live Voice Conversation"
          />

          <div className="space-y-1 max-w-md relative z-10">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Tap to talk or open Live Voice
            </h2>
            <p className="urdu-rtl text-body-sm text-on-surface-variant" dir="rtl" lang="ur">
              کہیے باس، میں حاضر ہوں اور آپ کی بات غور سے سن رہی ہوں۔
            </p>
          </div>

          <Waveform
            active={settings.mic_enabled && !settings.panic_active}
            tone="rose"
            className="w-full max-w-xl bg-surface-container-lowest/50 rounded-2xl"
          />

          {/* Quick Action Utterance Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 relative z-10">
            <button
              type="button"
              onClick={() => dispatchCommand('open_app', { name: 'Chrome' }, 'ui')}
              disabled={settings.panic_active}
              className="px-4 py-2 rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface text-label-sm flex items-center gap-2 cursor-pointer disabled:opacity-45"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">
                open_in_new
              </span>
              <span>“Open Chrome”</span>
            </button>
            <button
              type="button"
              onClick={() => dispatchCommand('set_volume', { percent: 30 }, 'ui')}
              disabled={settings.panic_active}
              className="px-4 py-2 rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface text-label-sm flex items-center gap-2 cursor-pointer disabled:opacity-45"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">
                volume_down
              </span>
              <span>“Volume 30%”</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/reminders')}
              className="px-4 py-2 rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface text-label-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-tertiary">schedule</span>
              <span>
                {nextPrayer
                  ? `Next Prayer: ${nextPrayer.label} ${nextPrayer.time.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Prayer Schedule'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => dispatchCommand('screenshot', {}, 'ui')}
              disabled={settings.panic_active}
              className="px-4 py-2 rounded-full bg-surface-container-high/80 hover:bg-surface-bright text-on-surface text-label-sm flex items-center gap-2 cursor-pointer disabled:opacity-45"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">screenshot</span>
              <span>“Take screenshot”</span>
            </button>
          </div>
        </GlassCard>

        {/* Direct Actions Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/files')}
            className="glass-panel rounded-[20px] p-5 text-left hover:border-primary/40 transition-all cursor-pointer space-y-2"
          >
            <span className="material-symbols-outlined text-primary text-[24px]">apps</span>
            <p className="font-label-md text-on-surface font-semibold">Open App / File</p>
            <p className="text-xs text-on-surface-variant">Search & launch on laptop</p>
          </button>

          <button
            type="button"
            onClick={() => dispatchCommand('screenshot', {}, 'ui')}
            disabled={settings.panic_active}
            className="glass-panel rounded-[20px] p-5 text-left hover:border-secondary/40 transition-all cursor-pointer disabled:opacity-45 space-y-2"
          >
            <span className="material-symbols-outlined text-secondary text-[24px]">
              screenshot_monitor
            </span>
            <p className="font-label-md text-on-surface font-semibold">Take Screenshot</p>
            <p className="text-xs text-on-surface-variant">Capture current desktop</p>
          </button>

          <button
            type="button"
            onClick={() => dispatchCommand('media_control', { action: 'play_pause' }, 'ui')}
            disabled={settings.panic_active}
            className="glass-panel rounded-[20px] p-5 text-left hover:border-tertiary/40 transition-all cursor-pointer disabled:opacity-45 space-y-2"
          >
            <span className="material-symbols-outlined text-tertiary text-[24px]">music_note</span>
            <p className="font-label-md text-on-surface font-semibold">Play / Pause Media</p>
            <p className="text-xs text-on-surface-variant">Control desktop audio playback</p>
          </button>

          <button
            type="button"
            onClick={() => setReminderModalOpen(true)}
            className="glass-panel rounded-[20px] p-5 text-left hover:border-primary/40 transition-all cursor-pointer space-y-2"
          >
            <span className="material-symbols-outlined text-primary text-[24px]">
              notification_add
            </span>
            <p className="font-label-md text-on-surface font-semibold">Set Reminder</p>
            <p className="text-xs text-on-surface-variant">Voice or notification alert</p>
          </button>
        </div>

        {/* Telemetry + Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Laptop Telemetry */}
          <GlassCard className="lg:col-span-6 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">laptop_mac</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Laptop Telemetry
                </h2>
              </div>
              <Link to="/control" className="text-xs text-primary hover:underline">
                Full Control Center
              </Link>
            </div>

            {deviceOnline && device ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-surface-container/70">
                    <p className="text-xs text-on-surface-variant">Battery</p>
                    <p className="font-headline-sm text-tertiary">
                      {device.telemetry.battery_percent ?? '—'}%
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-container/70">
                    <p className="text-xs text-on-surface-variant">CPU / Temp</p>
                    <p className="font-headline-sm text-secondary">
                      {device.telemetry.cpu_percent ?? '—'}%{' '}
                      {device.telemetry.temperature_c != null
                        ? `· ${device.telemetry.temperature_c}°C`
                        : ''}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-container/70">
                    <p className="text-xs text-on-surface-variant">Volume</p>
                    <p className="font-headline-sm text-primary">
                      {device.telemetry.volume_percent ?? '—'}%
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PillButton
                    variant="secondary"
                    onClick={() => dispatchCommand('lock_screen', {}, 'ui')}
                  >
                    Lock Display
                  </PillButton>
                  <PillButton
                    variant="secondary"
                    onClick={() => dispatchCommand('focus_mode_toggle', { enabled: true }, 'ui')}
                  >
                    Focus Mode
                  </PillButton>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-container/60 p-5 space-y-2 border border-border-subtle/40">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="w-2.5 h-2.5 rounded-full bg-outline" />
                  <span className="font-semibold">Laptop Offline</span>
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  Start Zara Local Agent on your laptop to view live battery, CPU telemetry, and
                  execute hardware commands.
                </p>
              </div>
            )}
          </GlassCard>

          {/* Today's Schedule */}
          <GlassCard className="lg:col-span-6 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">event_upcoming</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Today’s Schedule
                </h2>
              </div>
              <Link to="/reminders" className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>

            {nextPrayer && (
              <div className="p-3.5 rounded-2xl bg-tertiary-container/15 border border-tertiary/30 flex items-center justify-between">
                <div>
                  <p className="text-xs text-tertiary font-semibold uppercase">Next Prayer</p>
                  <p className="font-label-md text-on-surface">
                    {nextPrayer.label}{' '}
                    <span className="urdu-rtl text-tertiary mr-1" dir="rtl" lang="ur">
                      {nextPrayer.urduLabel}
                    </span>
                  </p>
                </div>
                <span className="font-headline-sm text-tertiary">
                  {nextPrayer.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {upcomingReminders.length === 0 ? (
              <div className="p-5 rounded-2xl bg-surface-container/50 text-center space-y-2">
                <p className="text-body-sm text-on-surface-variant">Aaj koi kaam nahi</p>
                <PillButton variant="secondary" onClick={() => setReminderModalOpen(true)}>
                  + Add Reminder
                </PillButton>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcomingReminders.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container/70"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={r.is_completed}
                        onChange={() => toggleReminderComplete(r.id)}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span className="text-body-sm text-on-surface truncate">{r.title}</span>
                    </label>
                    <span className="text-xs text-on-surface-variant shrink-0">
                      {formatClockTime(r.due_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>

        {/* Recent Conversations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Recent Conversations
            </h2>
            <Link to="/history" className="text-xs text-primary hover:underline">
              Open History
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <EmptyState
              icon="forum"
              title="No memories yet. Say hello to Zara."
              subtitle="Start a live voice or text conversation to build your shared history."
              actionLabel="Start Conversation"
              onAction={() => navigate('/talk')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentSessions.map((s) => (
                <Link
                  key={s.id}
                  to={`/history/${s.id}`}
                  className="glass-panel rounded-[20px] p-5 hover:border-primary/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-on-surface truncate">{s.title}</span>
                    {s.primary_emotion && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary capitalize">
                        {s.primary_emotion}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {s.summary || 'Conversation transcript recorded.'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Reminder Modal */}
      <ModalShell
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title="Add Quick Reminder"
      >
        <form onSubmit={handleQuickAddReminder} className="space-y-4">
          <div>
            <label htmlFor="dash-rem-title" className="block text-xs text-on-surface-variant mb-1">
              Title
            </label>
            <input
              id="dash-rem-title"
              type="text"
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
              placeholder="e.g., Evening Chai Break"
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="dash-rem-due" className="block text-xs text-on-surface-variant mb-1">
              Date & Time
            </label>
            <input
              id="dash-rem-due"
              type="datetime-local"
              value={remDue}
              onChange={(e) => setRemDue(e.target.value)}
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="dash-rem-cat" className="block text-xs text-on-surface-variant mb-1">
              Category
            </label>
            <select
              id="dash-rem-cat"
              value={remCategory}
              onChange={(e) =>
                setRemCategory(e.target.value as 'work_code' | 'personal_health' | 'other')
              }
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            >
              <option value="personal_health">Personal & Health</option>
              <option value="work_code">Work & Code</option>
              <option value="other">Other</option>
            </select>
          </div>
          {remError && (
            <p role="alert" className="text-xs text-error">
              {remError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <PillButton variant="secondary" onClick={() => setReminderModalOpen(false)}>
              Cancel
            </PillButton>
            <PillButton type="submit">Save Reminder</PillButton>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
