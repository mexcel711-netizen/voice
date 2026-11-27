import React, { useMemo, useRef, useState } from 'react';
import { useZara } from '../context/ZaraContext';
import { GlassCard, PillButton, ToggleSwitch } from '../components/ui/Primitives';
import { Waveform } from '../components/voice/VoiceOrb';
import { apiService } from '../services/api.service';
import { useToast } from '../context/ToastContext';
import type { RegionalDialect } from '../types/db';

const DEFAULT_SAMPLE_URDU = 'جی باس! میں بالکل تیار ہوں۔ بتائیں آج رات ہم کیا نیا کمال کرنے والے ہیں؟';

export default function VoiceStudio() {
  const { voices, settings, selectVoice, updateVoiceProfile, updateSettings } = useZara();
  const { showToast } = useToast();

  const selectedVoice = useMemo(
    () => voices.find((v) => v.is_selected) ?? voices[0],
    [voices]
  );

  const [playgroundText, setPlaygroundText] = useState(DEFAULT_SAMPLE_URDU);
  const [romanPreview, setRomanPreview] = useState(
    'Jee Boss! Main bilkul tayyar hoon. Batayein aaj raat hum kya naya kamaal karne walay hain?'
  );
  const [englishSense, setEnglishSense] = useState(
    'Yes Boss! I am completely ready. Tell me what amazing thing we are creating tonight?'
  );
  const [synthesizing, setSynthesizing] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  const [micTesting, setMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleSynthesize = async (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    setSynthesizing(true);
    try {
      const res = await apiService.synthesizeSpeech({
        text: textToSpeak,
        voiceId: selectedVoice.provider_voice_id,
        provider: selectedVoice.provider,
        speed: selectedVoice.speed,
        pitchSemitones: selectedVoice.pitch_semitones,
        warmth: selectedVoice.warmth,
        expressiveness: selectedVoice.expressiveness,
      });

      if (res.romanPreview) setRomanPreview(res.romanPreview);
      if (res.englishSense) setEnglishSense(res.englishSense);

      if (res.ok && res.audioBase64 && res.mimeType) {
        const url = `data:${res.mimeType};base64,${res.audioBase64}`;
        setLastAudioUrl(url);
        const audio = new Audio(url);
        await audio.play();
        showToast('Synthesized audio playing.', 'success');
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(textToSpeak);
        utter.rate = selectedVoice.speed;
        window.speechSynthesis.speak(utter);
        showToast('Playing browser fallback voice.', 'info');
      }
    } catch {
      showToast('Synthesis failed — check provider status in Settings.', 'error');
    } finally {
      setSynthesizing(false);
    }
  };

  const handleExportWav = () => {
    if (!lastAudioUrl) {
      showToast('Synthesize audio first to export WAV.', 'warning');
      return;
    }
    const a = document.createElement('a');
    a.href = lastAudioUrl;
    a.download = `zara-${selectedVoice.code}.wav`;
    a.click();
  };

  const toggleMicTest = async () => {
    if (micTesting) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setMicTesting(false);
      setMicLevel(0);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicTesting(true);
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      showToast('Microphone permission denied.', 'error');
    }
  };

  return (
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            Voice Studio
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Select female Urdu neural voice profiles, calibrate prosody, and test synthesis.
          </p>
        </div>

        {/* 4 Voice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {voices.map((v) => (
            <GlassCard
              key={v.code}
              elevated={v.is_selected}
              className={`p-5 flex flex-col justify-between gap-4 transition-all ${
                v.is_selected ? 'border-primary/60' : 'border-border-subtle/50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-headline-sm text-on-surface font-semibold">
                      {v.display_name}
                    </h3>
                    <span className="text-[11px] uppercase tracking-wider text-secondary">
                      {v.provider}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Select ${v.display_name}`}
                    onClick={() => void selectVoice(v.code)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      v.is_selected
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {v.is_selected ? 'Active' : 'Select'}
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant">{v.description}</p>
              </div>
              <PillButton
                variant="secondary"
                onClick={() => void handleSynthesize(DEFAULT_SAMPLE_URDU)}
                className="w-full py-2 text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                Sample Audio
              </PillButton>
            </GlassCard>
          ))}
        </div>

        {/* Prosody Sliders + Dialect & Wake Word */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <GlassCard className="lg:col-span-7 p-6 space-y-5">
            <h2 className="font-headline-sm text-on-surface">Acoustic Prosody & Modulation</h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Speed / Tempo</span>
                  <span className="text-primary font-bold">{selectedVoice.speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  aria-label="Speed Tempo"
                  min={0.75}
                  max={1.5}
                  step={0.05}
                  value={selectedVoice.speed}
                  onChange={(e) =>
                    void updateVoiceProfile(selectedVoice.code, { speed: Number(e.target.value) })
                  }
                  className="zara-slider"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Pitch Tuning</span>
                  <span className="text-primary font-bold">
                    {selectedVoice.pitch_semitones} st
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Pitch Tuning"
                  min={-6}
                  max={6}
                  step={0.5}
                  value={selectedVoice.pitch_semitones}
                  onChange={(e) =>
                    void updateVoiceProfile(selectedVoice.code, {
                      pitch_semitones: Number(e.target.value),
                    })
                  }
                  className="zara-slider"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Warmth & Breathiness</span>
                  <span className="text-primary font-bold">{selectedVoice.warmth}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Warmth"
                  min={0}
                  max={100}
                  value={selectedVoice.warmth}
                  onChange={(e) =>
                    void updateVoiceProfile(selectedVoice.code, { warmth: Number(e.target.value) })
                  }
                  className="zara-slider"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Expressiveness</span>
                  <span className="text-primary font-bold">{selectedVoice.expressiveness}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Expressiveness"
                  min={0}
                  max={100}
                  value={selectedVoice.expressiveness}
                  onChange={(e) =>
                    void updateVoiceProfile(selectedVoice.code, {
                      expressiveness: Number(e.target.value),
                    })
                  }
                  className="zara-slider"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Micro-Breath Pause</span>
                  <span className="text-primary font-bold">
                    {selectedVoice.pause_seconds.toFixed(2)}s
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Pause Cadence"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={selectedVoice.pause_seconds}
                  onChange={(e) =>
                    void updateVoiceProfile(selectedVoice.code, {
                      pause_seconds: Number(e.target.value),
                    })
                  }
                  className="zara-slider"
                />
              </div>
            </div>
          </GlassCard>

          <div className="lg:col-span-5 space-y-6">
            <GlassCard className="p-6 space-y-3">
              <h2 className="font-headline-sm text-on-surface">Accent & Dialect Mode</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    ['standard', 'Standard Cultured', 'فصیح اردو'],
                    ['urban_hybrid', 'Urban Hybrid', 'اردو + انگلش'],
                    ['lahori', 'Lahori Cadence', 'لاہوری انداز'],
                    ['karachi', 'Karachite Tone', 'کراچی لب و لہجہ'],
                  ] as Array<[RegionalDialect, string, string]>
                ).map(([mode, title, urdu]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => void updateVoiceProfile(selectedVoice.code, { accent_mode: mode })}
                    className={`p-3 rounded-xl text-left cursor-pointer border ${
                      selectedVoice.accent_mode === mode
                        ? 'bg-primary-container/20 border-primary text-primary'
                        : 'bg-surface-container-high/70 border-transparent text-on-surface-variant'
                    }`}
                  >
                    <p className="text-xs font-semibold">{title}</p>
                    <p className="urdu-rtl text-xs mt-1" dir="rtl" lang="ur">
                      {urdu}
                    </p>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-on-surface">Wake Word Calibration</h2>
                <span className="text-[11px] text-secondary">Setting Saved</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Trigger Sensitivity</span>
                  <span className="text-primary font-bold">{settings.wake_sensitivity}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Wake sensitivity"
                  min={0}
                  max={100}
                  value={settings.wake_sensitivity}
                  onChange={(e) =>
                    void updateSettings({ wake_sensitivity: Number(e.target.value) })
                  }
                  className="zara-slider"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Ambient False-Positive Suppression</span>
                <ToggleSwitch
                  checked={settings.voice_lock_enabled}
                  onChange={(v) => void updateSettings({ voice_lock_enabled: v })}
                  label="False positive suppression"
                />
              </div>
              <div className="space-y-2">
                <PillButton variant="secondary" onClick={toggleMicTest} className="w-full py-2 text-xs">
                  <span className="material-symbols-outlined text-[16px]">mic</span>
                  {micTesting ? 'Stop Mic Meter' : 'Test Mic Trigger'}
                </PillButton>
                {micTesting && (
                  <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Voice Playground */}
        <GlassCard elevated className="p-6 space-y-4">
          <h2 className="font-headline-sm text-on-surface">Voice Playground & Acoustic Visualizer</h2>
          <label htmlFor="voice-playground-input" className="sr-only">
            Text to synthesize
          </label>
          <textarea
            id="voice-playground-input"
            rows={3}
            value={playgroundText}
            onChange={(e) => setPlaygroundText(e.target.value)}
            dir="rtl"
            lang="ur"
            className="zara-input w-full p-4 urdu-rtl text-lg text-primary-fixed"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-surface-container/70">
              <p className="text-[11px] text-secondary font-semibold mb-1">Roman Urdu Preview</p>
              <p className="text-xs text-on-surface">{romanPreview}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container/70">
              <p className="text-[11px] text-tertiary font-semibold mb-1">English Sense Meaning</p>
              <p className="text-xs text-on-surface-variant">{englishSense}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <Waveform active={synthesizing} tone="rose" />
            <div className="flex flex-wrap gap-2">
              <PillButton
                disabled={synthesizing || !playgroundText.trim()}
                onClick={() => void handleSynthesize(playgroundText)}
              >
                <span className="material-symbols-outlined text-[18px]">volume_up</span>
                {synthesizing ? 'Synthesizing...' : 'Synthesize & Play Voice'}
              </PillButton>
              <PillButton variant="secondary" onClick={handleExportWav}>
                Export WAV
              </PillButton>
            </div>
          </div>
        </GlassCard>
      </div>
  );
}
