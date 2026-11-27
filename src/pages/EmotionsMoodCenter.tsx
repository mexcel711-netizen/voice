import React, { useMemo } from 'react';
import { useZara } from '../context/ZaraContext';
import { EmptyState, GlassCard, PillButton, ToggleSwitch } from '../components/ui/Primitives';
import { apiService } from '../services/api.service';
import { useToast } from '../context/ToastContext';
import type { EmotionName, TonePreset } from '../types/db';

const EMOTION_META: Record<
  EmotionName,
  { label: string; urdu: string; icon: string; sample: string; color: string }
> = {
  happy: { label: 'Happy', urdu: 'خوش', icon: 'sentiment_very_satisfied', sample: 'Aaj aap ka din bohat acha guzrega Boss!', color: 'text-tertiary' },
  sad: { label: 'Sad / Gentle', urdu: 'اداس', icon: 'sentiment_dissatisfied', sample: 'Agar aap thak gaye hain to thora aaram kar lein.', color: 'text-secondary' },
  angry: { label: 'Protective Firm', urdu: 'سخت', icon: 'mood_bad', sample: 'Yeh risky command main bina ijazaat nahi chalungi.', color: 'text-error' },
  surprised: { label: 'Surprised', urdu: 'حیران', icon: 'sentiment_excited', sample: 'Waah Boss! Yeh toh kamaal ka idea hai!', color: 'text-primary' },
  shy: { label: 'Shy / Modest', urdu: 'شرمیلی', icon: 'auto_fix_high', sample: 'Aap aise tareef karenge to main sharma jaungi.', color: 'text-primary-fixed' },
  laughing: { label: 'Laughing', urdu: 'ہنسی', icon: 'sentiment_extremely_dissatisfied', sample: 'Haha! Aap bhi na Boss, hamesha hansaa dete hain.', color: 'text-tertiary-fixed' },
  caring: { label: 'Caring', urdu: 'فکرمند', icon: 'favorite', sample: 'Paani pi lein aur aankhon ko thora rest dein Boss.', color: 'text-primary' },
  teasing: { label: 'Teasing', urdu: 'شرارتی', icon: 'sentiment_satisfied', sample: 'Chai ke bina phir late night coding? Main nazar rakh rahi hoon!', color: 'text-secondary' },
};

export default function EmotionsMoodCenter() {
  const {
    settings,
    emotionSettings,
    emotionLogs,
    voices,
    updateSettings,
    updateEmotionIntensity,
    logEmotion,
  } = useZara();
  const { showToast } = useToast();

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.is_selected) ?? voices[0],
    [voices]
  );
  const latest = emotionLogs[0];

  const weeklyWave = useMemo(() => {
    const days: Array<{ label: string; count: number; avg: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000);
      const iso = d.toISOString().slice(0, 10);
      const matching = emotionLogs.filter((l) => l.created_at.startsWith(iso));
      const avg =
        matching.length > 0
          ? Math.round(matching.reduce((s, x) => s + x.intensity, 0) / matching.length)
          : 0;
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        count: matching.length,
        avg,
      });
    }
    return days;
  }, [emotionLogs]);

  const previewEmotionVoice = async (emotion: EmotionName) => {
    const meta = EMOTION_META[emotion];
    try {
      const res = await apiService.synthesizeSpeech({
        text: meta.sample,
        provider: selectedVoice?.provider ?? 'elevenlabs',
        voiceId: selectedVoice?.provider_voice_id || undefined,
        warmth: selectedVoice?.warmth,
        expressiveness: selectedVoice?.expressiveness,
        emotion,
      });
      if (res.ok && res.audioBase64 && res.mimeType) {
        const audio = new Audio(`data:${res.mimeType};base64,${res.audioBase64}`);
        await audio.play();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(meta.sample));
      }
      await logEmotion({
        session_id: null,
        detected_user_mood: 'neutral',
        zara_emotion: emotion,
        intensity: emotionSettings.find((e) => e.emotion === emotion)?.intensity ?? 70,
        note: 'Voice preview triggered',
      });
      showToast(`Previewing ${meta.label} tone`, 'info');
    } catch {
      showToast('Preview audio unavailable.', 'warning');
    }
  };

  return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Emotions & Mood Center
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Calibrate Zara’s 8 expressive emotions, mirror mode, and conversational tone.
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full glass-panel">
            <span className="text-xs text-on-surface-variant">Mirror My Mood</span>
            <ToggleSwitch
              checked={settings.mirror_mode_enabled}
              onChange={(next) => {
                void updateSettings({ mirror_mode_enabled: next });
                showToast(next ? 'Mirror Mode enabled.' : 'Mirror Mode paused.', 'info');
              }}
              label="Mirror My Mood"
            />
          </div>
        </div>

        {/* Hero Mood & Tone Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <GlassCard elevated className="lg:col-span-6 p-6 space-y-3">
            <span className="text-xs uppercase tracking-wider text-primary font-semibold">
              Current Detected State
            </span>
            <h2 className="font-headline-md text-on-surface capitalize">
              {latest ? `${latest.zara_emotion} (${latest.intensity}%)` : 'Ready & Attentive'}
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              {latest
                ? `Detected user mood: ${latest.detected_user_mood ?? 'neutral'}`
                : 'Live emotion detection updates automatically during voice conversations.'}
            </p>
          </GlassCard>

          <GlassCard className="lg:col-span-6 p-6 space-y-3">
            <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
              Response Tone Preset
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['natural_auto', 'Natural Auto'],
                  ['urdu_poetic', 'Urdu Poetic'],
                  ['executive', 'Executive'],
                ] as Array<[TonePreset, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    void updateSettings({ tone_preset: key });
                    showToast(`Tone preset set to ${label}.`, 'success');
                  }}
                  className={`py-3 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    settings.tone_preset === key
                      ? 'bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(244,84,163,0.35)]'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* 8 Emotion Calibration Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {emotionSettings.map((item) => {
            const meta = EMOTION_META[item.emotion];
            return (
              <GlassCard key={item.emotion} className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-[24px] ${meta.color}`}>
                      {meta.icon}
                    </span>
                    <div>
                      <h3 className="font-label-md text-on-surface font-semibold">{meta.label}</h3>
                      <span className="urdu-rtl text-xs text-on-surface-variant" dir="rtl" lang="ur">
                        {meta.urdu}
                      </span>
                    </div>
                  </div>
                  <span className="font-label-md text-primary font-bold">{item.intensity}%</span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  aria-label={`${meta.label} intensity`}
                  value={item.intensity}
                  onChange={(e) =>
                    void updateEmotionIntensity(item.emotion, Number(e.target.value))
                  }
                  className="zara-slider"
                />

                <PillButton
                  variant="secondary"
                  onClick={() => void previewEmotionVoice(item.emotion)}
                  className="w-full py-2 text-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  Preview Voice
                </PillButton>
              </GlassCard>
            );
          })}
        </div>

        {/* 7-Day Resonance Wave & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <GlassCard className="lg:col-span-6 p-6 space-y-4">
            <h2 className="font-headline-sm text-on-surface">7-Day Resonance Wave</h2>
            {emotionLogs.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant py-8 text-center">
                Abhi koi mood data nahi — preview an emotion or start a conversation.
              </p>
            ) : (
              <div className="flex items-end justify-between gap-2 h-40 pt-4">
                {weeklyWave.map((d) => (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-surface-container-highest/50 rounded-xl h-28 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-primary-container to-secondary rounded-xl transition-all"
                        style={{ height: `${Math.max(8, d.avg)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-on-surface-variant">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard className="lg:col-span-6 p-6 space-y-4">
            <h2 className="font-headline-sm text-on-surface">Recent Emotion Logs</h2>
            {emotionLogs.length === 0 ? (
              <EmptyState
                icon="mood"
                title="Abhi koi mood data nahi"
                subtitle="Emotion transitions during live conversations and voice previews appear here."
              />
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {emotionLogs.slice(0, 20).map((log) => (
                  <li
                    key={log.id}
                    className="p-3 rounded-xl bg-surface-container/70 flex items-center justify-between text-xs"
                  >
                    <span className="text-on-surface font-medium capitalize">
                      {log.zara_emotion} ({log.intensity}%)
                    </span>
                    <span className="text-on-surface-variant">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </div>
  );
}
