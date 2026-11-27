import type { EmotionName, LanguageMode, ProviderName, ProviderStatus } from './db';

export interface LiveSessionRequest {
  sessionId?: string;
  continueSummary?: string | null;
}

export interface LiveSessionResponse {
  ok: boolean;
  mode: 'ephemeral_token' | 'server_chat_relay' | 'unconfigured';
  model: string;
  systemInstruction: string;
  voiceName?: string;
  ephemeralToken?: string;
  gatewayUrl?: string | null;
  error?: string;
}

export interface LiveChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  sessionId?: string;
  systemInstruction?: string;
  language?: LanguageMode;
  sandboxPersona?: boolean;
  toolResults?: Array<{ name: string; ok: boolean; message: string; data?: unknown }>;
}

export interface LiveChatResponse {
  ok: boolean;
  replyText: string;
  replyRoman?: string;
  replyEn?: string;
  emotion: EmotionName;
  intensity: number;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
  }>;
  error?: string;
}

export interface TtsRequest {
  text: string;
  voiceId?: string;
  provider?: 'gemini' | 'elevenlabs';
  speed?: number;
  pitchSemitones?: number;
  warmth?: number;
  expressiveness?: number;
  emotion?: EmotionName;
  qualityPreset?: 'realtime' | 'studio';
}

export interface TtsResponse {
  ok: boolean;
  providerUsed: 'gemini' | 'elevenlabs' | 'browser_fallback';
  audioBase64?: string;
  mimeType?: string;
  romanPreview?: string;
  englishSense?: string;
  error?: string;
  warning?: string;
  modelUsed?: string;
  voiceId?: string;
}

export interface ProviderTestRequest {
  provider: ProviderName;
}

export interface ProviderTestResponse {
  ok: boolean;
  provider: ProviderName;
  status: ProviderStatus;
  latencyMs: number | null;
  model?: string;
  message: string;
}
