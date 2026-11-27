import React, { useEffect, useMemo, useState } from 'react';
import {
  EmptyState,
  GlassCard,
  ModalShell,
  PillButton,
  ToggleSwitch,
} from '../components/ui/Primitives';
import { useToast } from '../context/ToastContext';
import { useZara } from '../context/ZaraContext';
import { formatClockTime, formatDuration } from '../lib/format';
import {
  CITY_PRESETS,
  calculatePrayerTimesForDate,
  getNextPrayer,
  type PrayerSlotKey,
} from '../lib/prayer';
import { containsUrduScript } from '../lib/rtl';
import { reminderSchema } from '../lib/validation';
import type {
  AsrMethod,
  NotifyMode,
  PrayerCalculationMethod,
  ReminderCategory,
  ReminderKind,
  RepeatRule,
} from '../types/db';

type RemTab = 'active' | 'timers' | 'alarms' | 'completed';

const PRAYER_SLOTS: Array<{
  key: PrayerSlotKey;
  alertField: 'alert_fajr' | 'alert_zuhr' | 'alert_asr' | 'alert_maghrib' | 'alert_isha';
  label: string;
  urdu: string;
  period: string;
}> = [
  { key: 'fajr', alertField: 'alert_fajr', label: 'Fajr', urdu: 'فجر', period: 'Dawn' },
  { key: 'zuhr', alertField: 'alert_zuhr', label: 'Dhuhr', urdu: 'ظہر', period: 'Midday' },
  { key: 'asr', alertField: 'alert_asr', label: 'Asr', urdu: 'عصر', period: 'Afternoon' },
  { key: 'maghrib', alertField: 'alert_maghrib', label: 'Maghrib', urdu: 'مغرب', period: 'Sunset' },
  { key: 'isha', alertField: 'alert_isha', label: 'Isha', urdu: 'عشاء', period: 'Night' },
];

export default function RemindersTimersPrayerTimes() {
  const {
    reminders,
    prayerSettings,
    createReminder,
    toggleReminderComplete,
    deleteReminder,
    savePrayerSettings,
  } = useZara();
  const { showToast } = useToast();

  const [now, setNow] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState<RemTab>('active');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ReminderCategory>('all');
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  // Add Reminder modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remKind, setRemKind] = useState<ReminderKind>('reminder');
  const [remDueAt, setRemDueAt] = useState(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [remRepeat, setRemRepeat] = useState<RepeatRule>('none');
  const [remCategory, setRemCategory] = useState<ReminderCategory>('personal_health');
  const [remNotify, setRemNotify] = useState<NotifyMode>('both');
  const [remNotes, setRemNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Add Urdu/English parser bar
  const [quickInput, setQuickInput] = useState('');

  // Deep Focus Pomodoro state
  const [pomoTotalSeconds, setPomoTotalSeconds] = useState(25 * 60);
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoRound, setPomoRound] = useState(1);
  const [pomoAutoMute, setPomoAutoMute] = useState(true);

  // Custom Quick Timer widget
  const [customMinutes, setCustomMinutes] = useState(5);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pomoRunning) return;
    const id = setInterval(() => {
      setPomoSeconds((prev) => {
        if (prev <= 1) {
          setPomoRunning(false);
          setPomoRound((r) => (r >= 4 ? 1 : r + 1));
          showToast('Deep Focus Pomodoro session complete!', 'success');
          return pomoTotalSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomoRunning, pomoTotalSeconds, showToast]);

  const prayerDay = useMemo(() => {
    if (prayerSettings.latitude == null || prayerSettings.longitude == null) return null;
    return calculatePrayerTimesForDate(
      prayerSettings.latitude,
      prayerSettings.longitude,
      now,
      prayerSettings.calculation_method,
      prayerSettings.asr_method
    );
  }, [
    now,
    prayerSettings.asr_method,
    prayerSettings.calculation_method,
    prayerSettings.latitude,
    prayerSettings.longitude,
  ]);

  const nextPrayer = useMemo(
    () => (prayerDay ? getNextPrayer(prayerDay, now) : null),
    [now, prayerDay]
  );

  const visibleReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (activeTab === 'completed') {
        if (!r.is_completed) return false;
      } else if (activeTab === 'timers') {
        if (r.is_completed || r.kind !== 'timer') return false;
      } else if (activeTab === 'alarms') {
        if (r.is_completed || r.kind !== 'alarm') return false;
      } else {
        if (r.is_completed) return false;
      }
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      return true;
    });
  }, [activeTab, categoryFilter, reminders]);

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const isoDue = new Date(remDueAt).toISOString();
    const parsed = reminderSchema.safeParse({
      title: remTitle,
      kind: remKind,
      due_at: isoDue,
      repeat_rule: remRepeat,
      category: remCategory,
      notify_mode: remNotify,
      notes: remNotes,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message || 'Invalid reminder input.');
      return;
    }
    await createReminder({
      kind: parsed.data.kind,
      title: parsed.data.title,
      notes: parsed.data.notes,
      due_at: parsed.data.due_at,
      duration_seconds:
        parsed.data.kind === 'timer'
          ? Math.max(60, Math.round((new Date(parsed.data.due_at).getTime() - Date.now()) / 1000))
          : null,
      repeat_rule: parsed.data.repeat_rule,
      repeat_days: [],
      category: parsed.data.category,
      notify_mode: parsed.data.notify_mode,
      voice_created: false,
    });
    setRemTitle('');
    setRemNotes('');
    setAddModalOpen(false);
    showToast('Reminder scheduled.', 'success');
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickInput.trim();
    if (!text) return;
    // Parse simple relative durations ("10 min", "15m", "1 hour")
    const minMatch = text.match(/(\d+)\s*(min|mins|minute|minutes|m)\b/i);
    const hrMatch = text.match(/(\d+)\s*(hr|hrs|hour|hours|h)\b/i);
    const offsetMs = minMatch
      ? Number(minMatch[1]) * 60_000
      : hrMatch
      ? Number(hrMatch[1]) * 3_600_000
      : 30 * 60_000;
    await createReminder({
      kind: minMatch ? 'timer' : 'reminder',
      title: text.slice(0, 120),
      notes: '',
      due_at: new Date(Date.now() + offsetMs).toISOString(),
      duration_seconds: minMatch ? Math.round(offsetMs / 1000) : null,
      repeat_rule: 'none',
      repeat_days: [],
      category: 'personal_health',
      notify_mode: 'both',
      voice_created: false,
    });
    setQuickInput('');
    showToast('Quick reminder saved.', 'success');
  };

  const startCustomTimer = async (label: string, mins: number) => {
    const secs = Math.max(1, mins) * 60;
    await createReminder({
      kind: 'timer',
      title: label,
      notes: '',
      due_at: new Date(Date.now() + secs * 1000).toISOString(),
      duration_seconds: secs,
      repeat_rule: 'none',
      repeat_days: [],
      category: 'personal_health',
      notify_mode: 'both',
      voice_created: false,
    });
    setActiveTab('timers');
    showToast(`${label} (${mins}m) timer started.`, 'success');
  };

  const pomoPct = ((pomoTotalSeconds - pomoSeconds) / pomoTotalSeconds) * 100;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">
            Daily Rhythm &amp; Adhan
          </p>
          <h1 className="font-headline-lg text-headline-lg text-on-surface flex flex-wrap items-baseline gap-3">
            <span>Reminders, Timers &amp; Prayer Times</span>
            <span className="urdu-rtl text-xl text-tertiary" dir="rtl" lang="ur">
              نماز کے اوقات، یاد دہانیاں اور ٹائمرز
            </span>
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Client-side Adhan calculations, proactive reminders, and Pomodoro focus timers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <PillButton
            variant="secondary"
            onClick={() => {
              setNow(new Date());
              if (prayerSettings.city) {
                void savePrayerSettings({ city: prayerSettings.city });
                showToast(`Prayer Almanac synced for ${prayerSettings.city}.`, 'success');
              } else {
                setCityPickerOpen(true);
              }
            }}
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Sync Prayer Almanac
          </PillButton>
          <PillButton onClick={() => setAddModalOpen(true)}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Reminder
          </PillButton>
        </div>
      </div>

      {/* Prayer Times Card */}
      <GlassCard elevated className="p-6 space-y-5 border border-tertiary/20">
        {!prayerDay || cityPickerOpen ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">mosque</span>
                  Select Your City for Prayer Times
                </h2>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Choose a city preset and calculation method to compute accurate local Fajr–Isha times.
                </p>
              </div>
              {prayerDay && (
                <PillButton variant="ghost" onClick={() => setCityPickerOpen(false)}>
                  Done
                </PillButton>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {CITY_PRESETS.map((preset) => {
                const selected = prayerSettings.city === preset.city;
                return (
                  <button
                    key={preset.city}
                    type="button"
                    onClick={async () => {
                      await savePrayerSettings({
                        city: preset.city,
                        country: preset.country,
                        latitude: preset.latitude,
                        longitude: preset.longitude,
                        timezone: preset.timezone,
                      });
                      setCityPickerOpen(false);
                      showToast(`Prayer times set for ${preset.city}.`, 'success');
                    }}
                    className={`rounded-2xl p-3 text-left border transition-all cursor-pointer ${
                      selected
                        ? 'bg-tertiary/15 border-tertiary text-on-surface'
                        : 'bg-surface-container-low border-border-subtle text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <p className="font-semibold text-sm text-on-surface">{preset.city}</p>
                    <p className="text-[11px]">{preset.country}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 pt-2 border-t border-border-subtle/50">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">
                  Calculation Method
                </label>
                <select
                  value={prayerSettings.calculation_method}
                  onChange={(e) =>
                    void savePrayerSettings({
                      calculation_method: e.target.value as PrayerCalculationMethod,
                    })
                  }
                  className="zara-input px-3 py-2 text-xs"
                >
                  <option value="karachi">University of Islamic Sciences, Karachi</option>
                  <option value="mwl">Muslim World League</option>
                  <option value="isna">ISNA (North America)</option>
                  <option value="egypt">Egyptian General Authority</option>
                  <option value="makkah">Umm Al-Qura, Makkah</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Asr Madhab</label>
                <select
                  value={prayerSettings.asr_method}
                  onChange={(e) =>
                    void savePrayerSettings({ asr_method: e.target.value as AsrMethod })
                  }
                  className="zara-input px-3 py-2 text-xs"
                >
                  <option value="hanafi">Hanafi</option>
                  <option value="standard">Shafi / Standard</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-tertiary font-semibold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">mosque</span>
                  <span>
                    Prayer Times Today — {prayerSettings.city}, {prayerSettings.country}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCityPickerOpen(true)}
                    className="underline text-primary ml-1 cursor-pointer"
                  >
                    Change City
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 capitalize">
                  {prayerSettings.asr_method} · {prayerSettings.calculation_method} · Qibla{' '}
                  {prayerDay.qiblaDegrees}°
                </p>
              </div>

              {nextPrayer && (
                <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface-container-low/80 border border-tertiary/30 px-4 py-2.5">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-tertiary font-semibold">
                      Next Prayer
                    </p>
                    <p className="text-lg font-bold text-on-surface flex items-center gap-2">
                      <span>{nextPrayer.label}</span>
                      <span className="urdu-rtl text-base text-tertiary" dir="rtl" lang="ur">
                        {nextPrayer.urduLabel}
                      </span>
                      <span className="text-sm font-normal text-on-surface-variant">
                        in {formatDuration(nextPrayer.remainingSeconds)} —{' '}
                        {nextPrayer.time.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
                    <span className="text-xs text-on-surface-variant">Azaan Alert Audio</span>
                    <ToggleSwitch
                      checked={prayerSettings.azaan_audio_enabled}
                      onChange={(next) => void savePrayerSettings({ azaan_audio_enabled: next })}
                      label="Toggle Azaan audio alerts"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {PRAYER_SLOTS.map((slot) => {
                const slotTime = prayerDay[slot.key];
                const isNext = nextPrayer?.key === slot.key;
                const isPassed = slotTime.getTime() < now.getTime() && !isNext;
                const alertOn = prayerSettings[slot.alertField];
                return (
                  <div
                    key={slot.key}
                    className={`rounded-2xl p-4 border transition-all ${
                      isNext
                        ? 'bg-tertiary/10 border-tertiary shadow-[0_0_24px_rgba(241,190,104,0.18)]'
                        : 'bg-surface-container-low/70 border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                          isNext
                            ? 'bg-tertiary/20 text-tertiary'
                            : isPassed
                            ? 'bg-surface-container-highest text-on-surface-variant'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {isNext ? 'Upcoming' : isPassed ? 'Passed' : slot.period}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void savePrayerSettings({ [slot.alertField]: !alertOn })
                        }
                        aria-label={`Toggle ${slot.label} alert`}
                        className={`p-1 rounded-full cursor-pointer ${
                          alertOn ? 'text-tertiary' : 'text-on-surface-variant/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {alertOn ? 'notifications_active' : 'notifications_off'}
                        </span>
                      </button>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="font-semibold text-sm text-on-surface">{slot.label}</p>
                      <span className="urdu-rtl text-base text-tertiary" dir="rtl" lang="ur">
                        {slot.urdu}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-on-surface mt-1 tabular-nums">
                      {slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </GlassCard>

      {/* Main Split: Reminders & Timers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Reminders List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'active', label: `Active (${reminders.filter((r) => !r.is_completed).length})` },
                { id: 'timers', label: `Timers (${reminders.filter((r) => !r.is_completed && r.kind === 'timer').length})` },
                { id: 'alarms', label: `Alarms (${reminders.filter((r) => !r.is_completed && r.kind === 'alarm').length})` },
                { id: 'completed', label: `Completed (${reminders.filter((r) => r.is_completed).length})` },
              ] as Array<{ id: RemTab; label: string }>
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-primary text-on-primary shadow-[0_0_16px_rgba(244,84,163,0.3)]'
                    : 'bg-surface-container-high/70 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all', label: 'All Categories' },
                { id: 'work_code', label: 'Work & Code' },
                { id: 'personal_health', label: 'Personal & Health' },
                { id: 'other', label: 'Other' },
              ] as Array<{ id: 'all' | ReminderCategory; label: string }>
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-full text-xs border cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'border-secondary text-secondary bg-secondary/15'
                    : 'border-border-subtle text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {visibleReminders.length === 0 ? (
            <EmptyState
              icon="event_available"
              title="No items in this view"
              subtitle="Create a reminder or start a quick countdown timer — Zara will alert you gently on time."
              actionLabel="Add Reminder"
              onAction={() => setAddModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {visibleReminders.map((rem) => {
                const dueMs = new Date(rem.due_at).getTime();
                const remainingSec = Math.max(0, Math.floor((dueMs - now.getTime()) / 1000));
                const urdu = containsUrduScript(rem.title);
                return (
                  <GlassCard key={rem.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={rem.is_completed}
                        onChange={() => void toggleReminderComplete(rem.id)}
                        aria-label={`Mark ${rem.title} complete`}
                        className="mt-1 h-4 w-4 accent-primary cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary uppercase font-semibold">
                            {rem.kind}
                          </span>
                          <span className="text-on-surface-variant">
                            {rem.category.replace('_', ' ')}
                          </span>
                          {rem.repeat_rule !== 'none' && (
                            <span className="text-secondary">· {rem.repeat_rule}</span>
                          )}
                        </div>
                        <p
                          className={`font-medium text-on-surface ${
                            rem.is_completed ? 'line-through opacity-60' : ''
                          } ${urdu ? 'urdu-rtl text-base' : 'text-sm'}`}
                          dir={urdu ? 'rtl' : 'ltr'}
                        >
                          {rem.title}
                        </p>
                        {rem.notes && (
                          <p className="text-xs text-on-surface-variant mt-1">{rem.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-semibold text-primary tabular-nums">
                        {rem.kind === 'timer' && !rem.is_completed
                          ? remainingSec > 0
                            ? `${formatDuration(remainingSec)} left`
                            : 'Timer Done'
                          : formatClockTime(rem.due_at)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete ${rem.title}`}
                        onClick={() => void deleteReminder(rem.id)}
                        className="p-1.5 rounded-full text-on-surface-variant hover:text-error cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Deep Focus Pomodoro & Quick Timers */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard elevated className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Deep Focus Pomodoro
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant">Round {pomoRound} / 4</span>
            </div>

            <div className="flex flex-col items-center py-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke="rgba(164,151,182,0.18)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke="#f454a3"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={(2 * Math.PI * 52 * (100 - pomoPct)) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-on-surface tabular-nums">
                    {formatDuration(pomoSeconds)}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">
                    {pomoRunning ? 'Focusing' : 'Paused'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                {[15, 25, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPomoRunning(false);
                      setPomoTotalSeconds(m * 60);
                      setPomoSeconds(m * 60);
                    }}
                    className={`px-3 py-1 rounded-full text-xs border cursor-pointer ${
                      pomoTotalSeconds === m * 60
                        ? 'border-primary text-primary bg-primary/15'
                        : 'border-border-subtle text-on-surface-variant'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-on-surface-variant px-2">
              <span>Auto-mute background alerts</span>
              <ToggleSwitch
                checked={pomoAutoMute}
                onChange={setPomoAutoMute}
                label="Auto-mute background alerts"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PillButton
                variant="secondary"
                onClick={() => {
                  setPomoRunning(false);
                  setPomoSeconds(pomoTotalSeconds);
                }}
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Reset
              </PillButton>
              <PillButton onClick={() => setPomoRunning((r) => !r)}>
                <span className="material-symbols-outlined text-[16px]">
                  {pomoRunning ? 'pause' : 'play_arrow'}
                </span>
                {pomoRunning ? 'Pause' : 'Start Focus'}
              </PillButton>
            </div>
          </GlassCard>

          {/* Quick Countdown Timers */}
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-on-surface">Quick Countdown Timer</h3>
              <span className="urdu-rtl text-sm text-tertiary" dir="rtl" lang="ur">
                چائے / بریک ٹائمر
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={240}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="zara-input w-24 px-3 py-2 text-sm tabular-nums"
                aria-label="Custom timer minutes"
              />
              <span className="text-xs text-on-surface-variant">minutes</span>
              <PillButton
                variant="secondary"
                className="ml-auto !px-4 !py-2 text-xs"
                onClick={() => void startCustomTimer(`Focus Break (${customMinutes}m)`, customMinutes)}
              >
                Start Timer
              </PillButton>
            </div>
          </GlassCard>

          {/* Quick Bilingual Input */}
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-on-surface">Quick Add (Urdu / English)</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                Smart Parse
              </span>
            </div>
            <form onSubmit={handleQuickAdd} className="flex gap-2">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder='e.g. "Chai break in 10 min"'
                className="zara-input flex-1 px-3.5 py-2.5 text-sm"
              />
              <PillButton type="submit" className="!px-4">
                Save
              </PillButton>
            </form>
          </GlassCard>
        </div>
      </div>

      {/* Add Reminder Modal */}
      <ModalShell
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Schedule Reminder or Alarm"
      >
        <form onSubmit={handleCreateReminder} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-error-container/40 border border-error/40 px-3.5 py-2 text-xs text-error">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Title (Urdu or English)</label>
            <input
              type="text"
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
              placeholder="e.g. Submit evening deploy notes"
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Kind</label>
              <select
                value={remKind}
                onChange={(e) => setRemKind(e.target.value as ReminderKind)}
                className="zara-input w-full px-3 py-2.5 text-sm"
              >
                <option value="reminder">Reminder</option>
                <option value="timer">Timer</option>
                <option value="alarm">Alarm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={remDueAt}
                onChange={(e) => setRemDueAt(e.target.value)}
                className="zara-input w-full px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Category</label>
              <select
                value={remCategory}
                onChange={(e) => setRemCategory(e.target.value as ReminderCategory)}
                className="zara-input w-full px-3 py-2 text-xs"
              >
                <option value="work_code">Work &amp; Code</option>
                <option value="personal_health">Personal &amp; Health</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Repeat</label>
              <select
                value={remRepeat}
                onChange={(e) => setRemRepeat(e.target.value as RepeatRule)}
                className="zara-input w-full px-3 py-2 text-xs"
              >
                <option value="none">Once</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Notify Mode</label>
              <select
                value={remNotify}
                onChange={(e) => setRemNotify(e.target.value as NotifyMode)}
                className="zara-input w-full px-3 py-2 text-xs"
              >
                <option value="both">Voice + Alert</option>
                <option value="voice">Voice Only</option>
                <option value="notification">Notification Only</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Notes</label>
            <textarea
              rows={2}
              value={remNotes}
              onChange={(e) => setRemNotes(e.target.value)}
              className="zara-input w-full px-3.5 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <PillButton variant="ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </PillButton>
            <PillButton type="submit">Save Reminder</PillButton>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}
