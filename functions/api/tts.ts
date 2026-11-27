import { verifyOwnerRequest, type AuthEnv } from './_lib/auth';
import { corsHeaders, jsonResponse } from './_lib/cors';
import { runTts, type GatewayEnv } from './_lib/gateway';

interface Env extends AuthEnv, GatewayEnv {
  ALLOWED_ORIGIN?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const origin = context.request.headers.get('Origin');
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin, context.env.ALLOWED_ORIGIN) });
  }
  if (context.request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405, origin, context.env.ALLOWED_ORIGIN);
  }
  const auth = await verifyOwnerRequest(context.request.headers.get('Authorization'), context.env);
  if (!auth.ok) {
    return jsonResponse({ ok: false, error: auth.error }, auth.status ?? 401, origin, context.env.ALLOWED_ORIGIN);
  }
  const payload = (await context.request.json().catch(() => ({}))) as {
    text?: string;
    voiceId?: string;
    provider?: 'gemini' | 'elevenlabs';
    warmth?: number;
    expressiveness?: number;
    emotion?: 'happy' | 'sad' | 'angry' | 'surprised' | 'shy' | 'laughing' | 'caring' | 'teasing';
    speed?: number;
    qualityPreset?: 'realtime' | 'studio';
  };
  const res = await runTts(context.env, payload);
  return jsonResponse(res.body, res.status, origin, context.env.ALLOWED_ORIGIN);
}
