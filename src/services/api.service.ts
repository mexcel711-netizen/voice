import type {
  LiveChatRequest,
  LiveChatResponse,
  LiveSessionRequest,
  LiveSessionResponse,
  ProviderTestRequest,
  ProviderTestResponse,
  TtsRequest,
  TtsResponse,
} from '../types/api';
import { getAccessToken } from './supabase';

async function postJson<TReq, TRes>(url: string, body: TReq): Promise<TRes> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as TRes & { error?: string };
  if (!res.ok && !data.error) {
    throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export interface YouTubeVideoResult {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  url: string;
}

export interface YouTubeSearchResponse {
  ok: boolean;
  query?: string;
  videos?: YouTubeVideoResult[];
  code?: string;
  error?: string;
}

export const apiService = {
  createLiveSession(payload: LiveSessionRequest): Promise<LiveSessionResponse> {
    return postJson<LiveSessionRequest, LiveSessionResponse>('/api/live-session', payload);
  },
  sendLiveChat(payload: LiveChatRequest): Promise<LiveChatResponse> {
    return postJson<LiveChatRequest, LiveChatResponse>('/api/live-chat', payload);
  },
  synthesizeSpeech(payload: TtsRequest): Promise<TtsResponse> {
    return postJson<TtsRequest, TtsResponse>('/api/tts', payload);
  },
  searchYoutube(payload: { query: string; maxResults?: number }): Promise<YouTubeSearchResponse> {
    return postJson<typeof payload, YouTubeSearchResponse>('/api/youtube-search', payload);
  },
  testProvider(payload: ProviderTestRequest): Promise<ProviderTestResponse> {
    return postJson<ProviderTestRequest, ProviderTestResponse>('/api/provider-test', payload);
  },
};
