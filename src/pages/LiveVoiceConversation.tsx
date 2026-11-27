import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useZara } from '../context/ZaraContext';
import { GlassCard, PillButton } from '../components/ui/Primitives';
import { VoiceOrb, Waveform } from '../components/voice/VoiceOrb';
import { ZaraLiveAdapter, type LiveVoiceState } from '../services/live.service';
import { buildZaraSystemInstruction } from '../lib/prompt';
import { containsUrduScript } from '../lib/rtl';
import { useToast } from '../context/ToastContext';
import type { CommandType, EmotionName, MemoryCategory, MemoryType } from '../types/db';
import { chromeBrowserService, type ChromeBrowserCommand } from '../services/chrome.service';

export default function LiveVoiceConversation() {
  const {
    persona,
    settings,
    emotionSettings,
    memories,
    device,
    deviceOnline,
    commands,
    messagesBySession,
    createSession,
    appendMessage,
    endSession,
    dispatchCommand,
    logEmotion,
    addMemory,
    createReminder,
    voices,
  } = useZara();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const continueSummary = (location.state as { continueSummary?: string } | null)
    ?.continueSummary;

  const adapterRef = useRef<ZaraLiveAdapter | null>(null);
  const [voiceState, setVoiceState] = useState<LiveVoiceState>('idle');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionName>('caring');
  const [textInput, setTextInput] = useState('');
  const [showEnglish, setShowEnglish] = useState(true);
  const [muted, setMuted] = useState(false);
  const [activeModelLabel, setActiveModelLabel] = useState('Gemini 3.8 Live');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chromeConnected, setChromeConnected] = useState(false);
  const selectedVoice = useMemo(() => voices.find((voice) => voice.is_selected) ?? voices[0], [voices]);

  const messages = useMemo(
    () => (activeSessionId ? messagesBySession[activeSessionId] ?? [] : []),
    [activeSessionId, messagesBySession]
  );

  const sessionActions = useMemo(
    () =>
      activeSessionId
        ? commands.filter((c) => c.session_id === activeSessionId)
        : commands.slice(0, 5),
    [activeSessionId, commands]
  );

  useEffect(() => {
    const adapter = new ZaraLiveAdapter();
    adapterRef.current = adapter;

    const unsubState = adapter.onStateChange((st) => setVoiceState(st));
    void chromeBrowserService.ping().then(setChromeConnected).catch(() => setChromeConnected(false));

    const unsubErr = adapter.onError((msg) => {
      setErrorMsg(msg);
      showToast(msg, 'warning');
    });

    return () => {
      unsubState();
      unsubErr();
      adapter.close();
    };
  }, [showToast]);

  // Attach dynamic transcript and tool handlers whenever activeSessionId changes
  useEffect(() => {
    const adapter = adapterRef.current;
    if (!adapter || !activeSessionId) return;

    const unsubTranscript = adapter.onTranscript((ev) => {
      if (ev.emotion) setCurrentEmotion(ev.emotion);
      void appendMessage(activeSessionId, {
        role: ev.role,
        content_text: ev.text,
        content_roman: ev.roman ?? null,
        content_en: ev.english ?? null,
        emotion: ev.emotion ?? null,
        command_id: null,
        audio_path: null,
      });
    });

    const unsubTools = adapter.onToolCall((call) => {
      if (call.name === 'laptop_command') {
        const cmdType = call.args.command_type as CommandType;
        const params = (call.args.params as Record<string, unknown>) || {};
        void dispatchCommand(cmdType, params, 'voice', activeSessionId);
      } else if (call.name === 'report_emotion') {
        const zEm = (call.args.zara_emotion as EmotionName) || 'caring';
        setCurrentEmotion(zEm);
        void logEmotion({
          session_id: activeSessionId,
          detected_user_mood: (call.args.user_mood as EmotionName) ?? 'neutral',
          zara_emotion: zEm,
          intensity: Number(call.args.intensity ?? 70),
          note: null,
        });
      } else if (call.name === 'save_memory' && settings.auto_learn_enabled) {
        void addMemory({
          content: String(call.args.content || ''),
          category: (call.args.category as MemoryCategory) || 'personal',
          memory_type: (call.args.memory_type as MemoryType) || 'semantic',
          importance: Number(call.args.importance ?? 3),
          source: 'conversation',
          source_session_id: activeSessionId,
        });
      } else if (call.name === 'browser_command') {
        void chromeBrowserService.execute(call.args as unknown as ChromeBrowserCommand)
          .then((result) => {
            setChromeConnected(true);
            const detail = result.message || 'Chrome action completed.';
            showToast(detail, 'success');
          })
          .catch((error: unknown) => {
            setChromeConnected(false);
            showToast(error instanceof Error ? error.message : 'Chrome extension is not connected.', 'warning');
          });
      } else if (call.name === 'create_reminder') {
        void createReminder({
          kind: (call.args.kind as 'reminder' | 'timer' | 'alarm') || 'reminder',
          title: String(call.args.title || 'Voice Reminder'),
          notes: '',
          due_at: String(call.args.due_at || new Date(Date.now() + 3600_000).toISOString()),
          duration_seconds: null,
          repeat_rule: 'none',
          repeat_days: [],
          category: 'personal_health',
          notify_mode: 'both',
          voice_created: true,
        });
      }
    });

    return () => {
      unsubTranscript();
      unsubTools();
    };
  }, [
    activeSessionId,
    addMemory,
    appendMessage,
    createReminder,
    dispatchCommand,
    logEmotion,
    settings.auto_learn_enabled,
  ]);

  const handleStartSession = async () => {
    if (settings.panic_active) {
      showToast('Panic mode ON — Live Voice blocked.', 'error');
      return;
    }
    if (!settings.mic_enabled) {
      showToast('Master mic switch is muted. Unmute in sidebar or Safety.', 'warning');
      return;
    }
    setErrorMsg(null);
    const session = await createSession(
      continueSummary ? 'Continued Voice Session' : 'Live Voice Session',
      continueSummary ?? null
    );
    setActiveSessionId(session.id);

    const sysInstruction = buildZaraSystemInstruction({
      persona,
      emotions: emotionSettings,
      memories,
      tonePreset: settings.tone_preset,
      deviceSummary: deviceOnline && device ? device : null,
      continueSummary,
      nowIso: new Date().toISOString(),
    });

    try {
      const info = await adapterRef.current?.connect({
        sessionId: session.id,
        systemInstruction: sysInstruction,
        language: settings.language_mode,
        micDeviceId: settings.mic_device_id,
        continueSummary,
        voiceProfile: selectedVoice ? {
          provider: selectedVoice.provider,
          provider_voice_id: selectedVoice.provider_voice_id,
          speed: selectedVoice.speed,
          warmth: selectedVoice.warmth,
          expressiveness: selectedVoice.expressiveness,
        } : undefined,
      });
      if (info?.model) setActiveModelLabel(info.model);
      showToast('Voice session connected.', 'success');
    } catch {
      // Error listener displays state
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed) return;
    if (settings.panic_active) {
      showToast('Panic mode active — resume on Safety page.', 'error');
      return;
    }
    let sid = activeSessionId;
    if (!sid) {
      const session = await createSession('Live Voice Session', continueSummary ?? null);
      sid = session.id;
      setActiveSessionId(sid);
    }
    setTextInput('');
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        text: m.content_text,
      }));
    await adapterRef.current?.sendText(trimmed, history);
  };

  const handleEndSession = async () => {
    adapterRef.current?.close();
    if (activeSessionId) {
      await endSession(activeSessionId, messages[messages.length - 1]?.content_text || undefined);
      showToast('Session saved to Conversation History.', 'info');
      navigate(`/history/${activeSessionId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    adapterRef.current?.setMuted(next);
  };

  return (
      <div className="space-y-6 pb-8">
        {/* Telemetry Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div
              aria-live="polite"
              className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface-container-high/90"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-label-md text-on-surface capitalize">
                {voiceState === 'idle'
                  ? 'Tap Orb or Send Message to Start'
                  : `Zara is ${voiceState}...`}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-low/80">
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                auto_awesome
              </span>
              <span className="text-label-sm text-on-surface-variant">Emotion:</span>
              <span className="text-label-sm text-tertiary font-semibold capitalize">
                {currentEmotion}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${chromeConnected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-surface-container-high/70 text-on-surface-variant'}`}>
              Chrome {chromeConnected ? 'Connected' : 'Extension not connected'}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-surface-container-high/70 text-xs text-secondary font-medium">
              {activeModelLabel}
            </span>
            <button
              type="button"
              onClick={() => setShowEnglish((v) => !v)}
              className="px-3 py-1.5 rounded-full bg-surface-container-high text-xs text-on-surface hover:bg-surface-bright cursor-pointer"
            >
              {showEnglish ? 'Hide English' : 'Show English'}
            </button>
          </div>
        </div>

        {/* Main 12-Col Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Orb + Transcript + Input */}
          <div className="xl:col-span-8 space-y-6">
            <GlassCard className="p-6 lg:p-8 flex flex-col items-center space-y-6 relative overflow-hidden">
              <div className="w-full flex items-center justify-between text-xs text-on-surface-variant">
                <span className="uppercase tracking-widest">Sonic Chamber</span>
                <span>{settings.language_mode.replace('_', ' / ')}</span>
              </div>

              <VoiceOrb
                size="lg"
                state={voiceState}
                onClick={voiceState === 'idle' ? handleStartSession : () => adapterRef.current?.interrupt()}
                ariaLabel={voiceState === 'idle' ? 'Start Live Session' : 'Tap to Interrupt Zara'}
              />

              <Waveform
                active={voiceState === 'listening' || voiceState === 'speaking'}
                tone={voiceState === 'speaking' ? 'rose' : voiceState === 'thinking' ? 'gold' : 'violet'}
                className="w-full max-w-xl"
              />

              {errorMsg && (
                <div
                  role="alert"
                  className="w-full max-w-xl rounded-xl bg-error-container/40 border border-error/40 px-4 py-2.5 text-xs text-on-error-container flex items-center justify-between"
                >
                  <span>{errorMsg}</span>
                  <button
                    type="button"
                    onClick={handleStartSession}
                    className="underline font-semibold ml-3 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Voice Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {voiceState === 'idle' ? (
                  <PillButton
                    onClick={handleStartSession}
                    disabled={settings.panic_active || !settings.mic_enabled}
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                    Start Voice Session
                  </PillButton>
                ) : (
                  <>
                    <PillButton variant="secondary" onClick={toggleMute}>
                      <span className="material-symbols-outlined text-[18px]">
                        {muted ? 'mic' : 'mic_off'}
                      </span>
                      {muted ? 'Unmute' : 'Mute Mic'}
                    </PillButton>
                    <PillButton variant="secondary" onClick={() => adapterRef.current?.interrupt()}>
                      <span className="material-symbols-outlined text-[18px]">pan_tool</span>
                      Interrupt
                    </PillButton>
                    <PillButton variant="danger" onClick={handleEndSession}>
                      <span className="material-symbols-outlined text-[18px]">call_end</span>
                      End Session
                    </PillButton>
                  </>
                )}
              </div>
            </GlassCard>

            {/* Transcript Feed */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">forum</span>
                  Live Transcription Stream
                </h2>
                <span className="text-xs text-on-surface-variant">
                  {messages.length} turns
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="py-8 text-center text-body-sm text-on-surface-variant">
                  Speak after starting a session or type a message below in Urdu, Roman Urdu, or
                  English.
                </div>
              ) : (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {messages.map((m) => {
                    const isUser = m.role === 'user';
                    const isUrdu = containsUrduScript(m.content_text);
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[11px] text-on-surface-variant mb-1">
                          {isUser ? persona.owner_nickname || 'Boss' : persona.assistant_name || 'Zara'}
                          {m.emotion ? ` • ${m.emotion}` : ''}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 space-y-1.5 ${
                            isUser
                              ? 'bg-secondary-container/40 border border-secondary/30'
                              : 'bg-surface-container-high/85 border border-primary/25'
                          }`}
                        >
                          <p
                            className={
                              isUrdu
                                ? 'urdu-rtl text-urdu-body text-primary-fixed text-right'
                                : 'text-body-sm text-on-surface'
                            }
                            dir={isUrdu ? 'rtl' : 'ltr'}
                            lang={isUrdu ? 'ur' : 'en'}
                          >
                            {m.content_text}
                          </p>
                          {m.content_roman && m.content_roman !== m.content_text && (
                            <p className="text-xs text-on-surface-variant italic">
                              {m.content_roman}
                            </p>
                          )}
                          {showEnglish && m.content_en && (
                            <p className="text-xs text-secondary border-t border-border-subtle/40 pt-1">
                              {m.content_en}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Text Input Fallback */}
              <form onSubmit={handleSendText} className="flex items-center gap-2 pt-2">
                <label htmlFor="live-text-input" className="sr-only">
                  Send message to Zara
                </label>
                <input
                  id="live-text-input"
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={settings.panic_active}
                  placeholder="Type in Urdu, Roman Urdu, or English (e.g., 'Zara Chrome kholo')..."
                  className="zara-input flex-1 px-4 py-3 text-sm"
                />
                <PillButton type="submit" disabled={!textInput.trim() || settings.panic_active}>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Send
                </PillButton>
              </form>
            </GlassCard>
          </div>

          {/* Right 4 Cols: Zara Actions Panel */}
          <div className="xl:col-span-4 space-y-4">
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Zara ne kiya
                </h2>
                <span className="text-xs text-on-surface-variant">
                  {deviceOnline ? 'Agent Online' : 'Agent Offline'}
                </span>
              </div>

              {sessionActions.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant py-6 text-center">
                  No laptop commands dispatched in this session yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {sessionActions.map((cmd) => (
                    <li
                      key={cmd.id}
                      className="p-3.5 rounded-2xl bg-surface-container/80 border border-border-subtle/40 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-label-sm text-on-surface font-semibold">
                          {cmd.command_type}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                            cmd.status === 'done'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : cmd.status === 'blocked' || cmd.status === 'failed'
                              ? 'bg-error-container/60 text-error'
                              : 'bg-tertiary/20 text-tertiary'
                          }`}
                        >
                          {cmd.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-mono truncate">
                        {JSON.stringify(cmd.params)}
                      </p>
                      {cmd.blocked_reason && (
                        <p className="text-xs text-error">{cmd.blocked_reason}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
  );
}
