import { verifyOwnerRequest, type AuthEnv } from './_lib/auth';
import { corsHeaders, jsonResponse } from './_lib/cors';

interface Env extends AuthEnv {
  YOUTUBE_API_KEY?: string;
  ALLOWED_ORIGIN?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin, env.ALLOWED_ORIGIN),
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, origin, env.ALLOWED_ORIGIN);
  }

  const auth = await verifyOwnerRequest(request.headers.get('Authorization'), env);
  if (!auth.ok) {
    return jsonResponse({ ok: false, error: auth.error }, auth.status ?? 401, origin, env.ALLOWED_ORIGIN);
  }

  const payload = (await request.json().catch(() => ({}))) as {
    query?: string;
    maxResults?: number;
  };
  const query = typeof payload.query === 'string' ? payload.query.trim().slice(0, 180) : '';
  const maxResults = Math.max(1, Math.min(10, Math.floor(Number(payload.maxResults) || 5)));

  if (!query) {
    return jsonResponse({ ok: false, error: 'A YouTube search query is required.' }, 400, origin, env.ALLOWED_ORIGIN);
  }

  if (!env.YOUTUBE_API_KEY) {
    return jsonResponse({
      ok: false,
      code: 'YOUTUBE_API_KEY_MISSING',
      error: 'YouTube Data API is not configured yet. Zara can still open YouTube search in Chrome.',
    }, 503, origin, env.ALLOWED_ORIGIN);
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.search = new URLSearchParams({
      key: env.YOUTUBE_API_KEY,
      part: 'snippet',
      type: 'video',
      maxResults: String(maxResults),
      q: query,
      safeSearch: 'moderate',
    }).toString();

    const response = await fetch(url.toString());
    const data = await response.json().catch(() => ({})) as {
      items?: YouTubeSearchItem[];
      error?: { message?: string; code?: number };
    };

    if (!response.ok) {
      return jsonResponse({
        ok: false,
        error: data.error?.message || `YouTube API returned HTTP ${response.status}.`,
      }, response.status === 403 ? 503 : 502, origin, env.ALLOWED_ORIGIN);
    }

    const videos = (data.items ?? [])
      .filter((item) => Boolean(item.id?.videoId))
      .map((item) => {
        const videoId = item.id!.videoId!;
        return {
          videoId,
          title: (item.snippet?.title || 'Untitled video').replace(/<[^>]*>/g, '').slice(0, 240),
          description: (item.snippet?.description || '').replace(/<[^>]*>/g, '').slice(0, 500),
          channelTitle: (item.snippet?.channelTitle || '').slice(0, 160),
          publishedAt: item.snippet?.publishedAt || null,
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || null,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      });

    return jsonResponse({ ok: true, query, videos }, 200, origin, env.ALLOWED_ORIGIN);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'YouTube search failed.',
    }, 502, origin, env.ALLOWED_ORIGIN);
  }
}
