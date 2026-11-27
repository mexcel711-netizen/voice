import { apiService } from './api.service';
import type { EmotionName, LanguageMode, VoiceProfile } from '../types/db';


export type LiveVoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted'
  | 'error';

export interface LiveTranscriptEvent {
  role: 'user' | 'assistant';
  text: string;
  roman?: string;
  english?: string;
  emotion?: EmotionName;
  intensity?: number;
}

export interface LiveToolCallEvent {
  name: string;
  args: Record<string, unknown>;
}

export interface LiveVoiceAdapter {
  connect(opts: {
    sessionId: string;
    systemInstruction: string;
    language: LanguageMode;
    micDeviceId?: string | null;
    continueSummary?: string | null;
    voiceProfile?: Pick<VoiceProfile, 'provider' | 'provider_voice_id' | 'speed' | 'warmth' | 'expressiveness'>;
  }): Promise<{ mode: string; model: string }>;
  sendText(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; text: string }>
  ): Promise<void>;
  interrupt(): void;
  setMuted(muted: boolean): void;
  onStateChange(cb: (state: LiveVoiceState) => void): () => void;
  onTranscript(cb: (ev: LiveTranscriptEvent) => void): () => void;
  onToolCall(cb: (ev: LiveToolCallEvent) => void): () => void;
  onError(cb: (err: string) => void): () => void;
  close(): void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

/**
 * Adapter encapsulating Gemini Live credentials + Web Audio / Web Speech + Server Relay
 * so Cloudflare AI Gateway WebSocket transport can drop in without changing /talk UI.
 */
export class ZaraLiveAdapter implements LiveVoiceAdapter {
  private stateListeners = new Set<(s: LiveVoiceState) => void>();
  private transcriptListeners = new Set<(e: LiveTranscriptEvent) => void>();
  private toolListeners = new Set<(e: LiveToolCallEvent) => void>();
  private errorListeners = new Set<(err: string) => void>();

  private mediaStream: MediaStream | null = null;
  private recognition: SpeechRecognitionLike | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private state: LiveVoiceState = 'idle';
  private muted = false;
  private systemInstruction = '';
  private language: LanguageMode = 'urdu_english';
  private sessionId = '';
  private historyRef: Array<{ role: 'user' | 'assistant'; text: string }> = [];
  private voiceProfile: Pick<VoiceProfile, 'provider' | 'provider_voice_id' | 'speed' | 'warmth' | 'expressiveness'> = {
    provider: 'elevenlabs', provider_voice_id: 'o85TqPN3F4P7dWae2paA', speed: 1, warmth: 86, expressiveness: 84,
  };

  private setState(next: LiveVoiceState) {
    this.state = next;
    this.stateListeners.forEach((cb) => cb(next));
  }

  onStateChange(cb: (state: LiveVoiceState) => void) {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  onTranscript(cb: (ev: LiveTranscriptEvent) => void) {
    this.transcriptListeners.add(cb);
    return () => this.transcriptListeners.delete(cb);
  }

  onToolCall(cb: (ev: LiveToolCallEvent) => void) {
    this.toolListeners.add(cb);
    return () => this.toolListeners.delete(cb);
  }

  onError(cb: (err: string) => void) {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  async connect(opts: {
    sessionId: string;
    systemInstruction: string;
    language: LanguageMode;
    micDeviceId?: string | null;
    continueSummary?: string | null;
    voiceProfile?: Pick<VoiceProfile, 'provider' | 'provider_voice_id' | 'speed' | 'warmth' | 'expressiveness'>;
  }): Promise<{ mode: string; model: string }> {
    this.sessionId = opts.sessionId;
    if (opts.voiceProfile) this.voiceProfile = opts.voiceProfile;
    this.systemInstruction = opts.systemInstruction;
    this.language = opts.language;
    this.setState('connecting');

    const sessionInfo = await apiService.createLiveSession({
      sessionId: opts.sessionId,
      continueSummary: opts.continueSummary ?? null,
    });

    if (!sessionInfo.ok) {
      const msg = sessionInfo.error || 'Could not start live voice session.';
      this.setState('error');
      this.errorListeners.forEach((cb) => cb(msg));
      throw new Error(msg);
    }

    if (sessionInfo.systemInstruction) {
      this.systemInstruction = sessionInfo.systemInstruction;
    }

    // Request mic permission cleanly if supported
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const audioConstraint: MediaTrackConstraints | boolean = opts.micDeviceId
          ? { deviceId: { exact: opts.micDeviceId } }
          : true;
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint });
      } catch {
        // Text fallback still works even if mic is denied
        this.errorListeners.forEach((cb) =>
          cb('Mic permission denied — text input fallback active.')
        );
      }
    }

    this.startSpeechRecognition();
    this.setState(this.muted ? 'muted' : 'listening');

    return { mode: sessionInfo.mode, model: sessionInfo.model };
  }

  private startSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR || !this.mediaStream) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = this.language === 'urdu' ? 'ur-PK' : 'en-US';
    rec.onresult = (ev) => {
      if (this.muted) return;
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          const text = res[0]?.transcript?.trim();
          if (text) {
            void this.sendText(text, this.historyRef);
          }
        }
      }
    };
    rec.onerror = () => {
      // Ignore no-speech idle timeouts silently
    };
    rec.onend = () => {
      if (this.state === 'listening' && !this.muted && this.mediaStream) {
        try {
          rec.start();
        } catch {
          // ignore restart collision
        }
      }
    };
    try {
      rec.start();
      this.recognition = rec;
    } catch {
      this.recognition = null;
    }
  }

  async sendText(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; text: string }>
  ): Promise<void> {
    const trimmed = message.trim();
    if (!trimmed) return;

    this.historyRef = history;
    this.transcriptListeners.forEach((cb) =>
      cb({ role: 'user', text: trimmed })
    );

    this.setState('thinking');
    try {
      const reply = await apiService.sendLiveChat({
        message: trimmed,
        history,
        sessionId: this.sessionId,
        systemInstruction: this.systemInstruction,
        language: this.language,
      });

      if (!reply.ok) {
        this.setState('error');
        this.errorListeners.forEach((cb) => cb(reply.error || 'Gemini response error.'));
        return;
      }

      if (reply.toolCalls && reply.toolCalls.length > 0) {
        for (const call of reply.toolCalls) {
          this.toolListeners.forEach((cb) => cb(call));
        }
      }

      this.setState('speaking');
      this.transcriptListeners.forEach((cb) =>
        cb({
          role: 'assistant',
          text: reply.replyText,
          roman: reply.replyRoman,
          english: reply.replyEn,
          emotion: reply.emotion,
          intensity: reply.intensity,
        })
      );

      // Synthesize audio via TTS endpoint or SpeechSynthesis fallback
      const spokenText = this.language === 'urdu'
        ? reply.replyText
        : this.language === 'english'
          ? (reply.replyEn || reply.replyText)
          : (reply.replyRoman || reply.replyText);
      await this.playAssistantVoice(spokenText);

      this.setState(this.muted ? 'muted' : 'listening');
    } catch (err) {
      this.setState('error');
      this.errorListeners.forEach((cb) =>
        cb(err instanceof Error ? err.message : 'Live chat request failed.')
      );
    }
  }

  private async playAssistantVoice(text: string) {
    try {
      const tts = await apiService.synthesizeSpeech({
        text: text.slice(0, 500),
        provider: this.voiceProfile.provider,
        voiceId: this.voiceProfile.provider_voice_id || 'o85TqPN3F4P7dWae2paA',
        speed: this.voiceProfile.speed,
        warmth: this.voiceProfile.warmth,
        expressiveness: this.voiceProfile.expressiveness,
      });
      if (tts.ok && tts.audioBase64 && tts.mimeType) {
        await new Promise<void>((resolve) => {
          const audio = new Audio(`data:${tts.mimeType};base64,${tts.audioBase64}`);
          this.activeAudio = audio;
          audio.onended = () => {
            this.activeAudio = null;
            resolve();
          };
          audio.onerror = () => {
            this.activeAudio = null;
            resolve();
          };
          audio.play().catch(() => resolve());
        });
        return;
      }
    } catch {
      // Fallback to browser synthesis
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      await new Promise<void>((resolve) => {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const preferred =
            voices.find((v) => /ur|hi/i.test(v.lang)) ||
            voices.find((v) => /female|samantha|victoria|zira|google/i.test(v.name));
          if (preferred) utter.voice = preferred;
          utter.rate = 1.02;
          utter.onend = () => resolve();
          utter.onerror = () => resolve();
          window.speechSynthesis.speak(utter);
          setTimeout(resolve, 4000);
        } catch {
          resolve();
        }
      });
    }
  }

  interrupt() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.setState(this.muted ? 'muted' : 'listening');
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
      });
    }
    this.setState(muted ? 'muted' : 'listening');
  }

  close() {
    this.interrupt();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.setState('idle');
  }
}
