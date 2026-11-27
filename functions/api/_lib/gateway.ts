import { GoogleGenAI, Type } from '@google/genai';

interface WorkersAiBinding {
  run(
    model: string,
    input: {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      response_format?: { type: 'json_object' };
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<{ response?: string }>;
}

export interface GatewayEnv {
  GEMINI_API_KEY?: string;
  GEMINI_CHAT_MODEL?: string;
  GEMINI_TTS_MODEL?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_TTS_MODEL_ID?: string;
  ELEVENLABS_QUALITY_MODEL_ID?: string;
  ELEVENLABS_DEFAULT_VOICE_ID?: string;
  CLOUDFLARE_MODEL?: string;
  AI?: WorkersAiBinding;
  GEMINI_LIVE_GATEWAY_URL?: string;
  GEMINI_LIVE_MODEL?: string;
}

const VALID_EMOTIONS = [
  'happy',
  'sad',
  'angry',
  'surprised',
  'shy',
  'laughing',
  'caring',
  'teasing',
] as const;

type Emotion = (typeof VALID_EMOTIONS)[number];

export function createGeminiClient(apiKey: string) {
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function runLiveChat(
  env: GatewayEnv,
  body: {
    message?: string;
    history?: Array<{ role: 'user' | 'assistant'; text: string }>;
    systemInstruction?: string;
    language?: string;
    toolResults?: Array<{ name: string; ok: boolean; message: string; data?: unknown }>;
  }
) {
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return { status: 400, body: { ok: false, error: 'Message text is required.' } };
  }
  if (!env.GEMINI_API_KEY && !env.AI) {
    return {
      status: 503,
      body: {
        ok: false,
        error: 'No chat provider is configured. Add GEMINI_API_KEY or enable the Cloudflare Workers AI binding.',
      },
    };
  }

  try {
    const historyParts = (body.history ?? []).slice(-12).map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    }));

    const sys = [
      body.systemInstruction ||
        'You are Zara, Boss’s warm, caring bilingual Urdu + English personal voice companion.',
      `Language mode preference: ${body.language || 'urdu_english'}.`,
      'Return JSON with replyText (primary natural response in requested language script), replyRoman (Roman Urdu transliteration), replyEn (concise English meaning), emotion (one of happy,sad,angry,surprised,shy,laughing,caring,teasing), intensity (0-100 integer), and optional toolCalls array. Tool-call names are laptop_command, browser_command, report_emotion, save_memory, create_reminder, get_schedule. Each item must be {name,argsJson}, where argsJson is a JSON-encoded object. Use browser_command for Chrome tabs, searching, navigating, reading the current page, and scrolling. Never claim a browser action succeeded before the tool result is returned. For browser actions use only the allowlisted action names: list_tabs, open_tab, search, read_page, switch_tab, close_tab, scroll_page.',
    ];
    if (body.toolResults?.length) {
      sys.push('The client has already executed the requested tools. Do not call any more tools. Use these actual tool results to answer truthfully; never claim an action succeeded if ok=false. Tool results:\n' + JSON.stringify(body.toolResults).slice(0, 10000));
    }
    const systemText = sys.join('\n');

    if (!env.GEMINI_API_KEY && env.AI) {
      const workerResponse = await env.AI.run(
        env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        {
          messages: [
            { role: 'system', content: systemText },
            ...(body.history ?? []).slice(-12).map((h) => ({
              role: h.role,
              content: h.text,
            })),
            { role: 'user', content: message },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.55,
          max_tokens: 1200,
        }
      );
      const rawWorkerText = workerResponse.response?.trim();
      if (!rawWorkerText) {
        return { status: 502, body: { ok: false, error: 'Cloudflare Workers AI returned an empty response.' } };
      }
      const workerParsed = JSON.parse(rawWorkerText) as {
        replyText?: string;
        replyRoman?: string;
        replyEn?: string;
        emotion?: Emotion;
        intensity?: number;
        toolCalls?: Array<{ name: string; argsJson?: string; args?: Record<string, unknown> }>;
      };
      const workerTools = (workerParsed.toolCalls ?? []).map((tool) => {
        let args = tool.args ?? {};
        if (tool.argsJson) {
          try { args = JSON.parse(tool.argsJson) as Record<string, unknown>; } catch { args = {}; }
        }
        return { name: tool.name, args };
      });
      return {
        status: 200,
        body: {
          ok: true,
          replyText: workerParsed.replyText || 'Maazrat, main is waqt jawab tayyar nahi kar saki.',
          replyRoman: workerParsed.replyRoman ?? '',
          replyEn: workerParsed.replyEn ?? '',
          emotion: VALID_EMOTIONS.includes(workerParsed.emotion as Emotion) ? workerParsed.emotion as Emotion : 'caring',
          intensity: Math.max(0, Math.min(100, Number(workerParsed.intensity ?? 70))),
          toolCalls: workerTools.length ? workerTools : undefined,
          providerUsed: 'cloudflare',
          modelUsed: env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        },
      };
    }

    const ai = createGeminiClient(env.GEMINI_API_KEY!);
    const response = await ai.models.generateContent({
      model: env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash',
      contents: [
        ...historyParts,
        { role: 'user', parts: [{ text: message }] },
      ],
      config: {
        systemInstruction: systemText,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: { type: Type.STRING },
            replyRoman: { type: Type.STRING },
            replyEn: { type: Type.STRING },
            emotion: { type: Type.STRING, enum: [...VALID_EMOTIONS] },
            intensity: { type: Type.INTEGER },
            toolCalls: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  argsJson: { type: Type.STRING },
                },
                required: ['name'],
              },
            },
          },
          required: ['replyText', 'emotion', 'intensity'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return { status: 502, body: { ok: false, error: 'Empty response from Gemini model.' } };
    }
    const parsed = JSON.parse(rawText) as {
      replyText: string;
      replyRoman?: string;
      replyEn?: string;
      emotion?: Emotion;
      intensity?: number;
      toolCalls?: Array<{ name: string; argsJson?: string; args?: Record<string, unknown> }>;
    };

    const mappedTools = (parsed.toolCalls ?? []).map((t) => {
      let args: Record<string, unknown> = {};
      if (t.args && typeof t.args === 'object') args = t.args;
      if (t.argsJson) {
        try {
          args = JSON.parse(t.argsJson) as Record<string, unknown>;
        } catch {
          args = {};
        }
      }
      return { name: t.name, args };
    });

    return {
      status: 200,
      body: {
        ok: true,
        replyText: parsed.replyText,
        replyRoman: parsed.replyRoman ?? '',
        replyEn: parsed.replyEn ?? '',
        emotion: VALID_EMOTIONS.includes(parsed.emotion as Emotion)
          ? (parsed.emotion as Emotion)
          : 'caring',
        intensity: Math.max(0, Math.min(100, Number(parsed.intensity ?? 70))),
        toolCalls: mappedTools.length > 0 ? mappedTools : undefined,
      },
    };
  } catch (err) {
    return {
      status: 502,
      body: {
        ok: false,
        error: err instanceof Error ? err.message : 'Gemini API call failed.',
      },
    };
  }
}

function mapVoiceForGeminiTts(voiceId?: string): 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' {
  const v = (voiceId ?? '').toLowerCase();
  if (v === 'kore' || v === 'noor') return 'Kore';
  if (v === 'zephyr' || v === 'leda' || v === 'simran') return 'Zephyr';
  if (v === 'charon' || v === 'mehru') return 'Charon';
  if (v === 'puck') return 'Puck';
  return 'Kore';
}

function elevenLabsEmotionTag(emotion?: Emotion): string {
  const tags: Record<Emotion, string> = {
    happy: '[excited]',
    sad: '[crying]',
    angry: '[firmly]',
    surprised: '[curious]',
    shy: '[whispers]',
    laughing: '[laughs]',
    caring: '[warmly]',
    teasing: '[mischievously]',
  };
  return emotion ? tags[emotion] || '' : '';
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function synthesizeWithElevenLabs(
  env: GatewayEnv,
  body: { text: string; voiceId?: string; warmth?: number; expressiveness?: number; speed?: number; emotion?: Emotion; qualityPreset?: 'realtime' | 'studio' }
) {
  if (!env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not configured on the server.');
  const voiceId = body.voiceId || env.ELEVENLABS_DEFAULT_VOICE_ID || 'o85TqPN3F4P7dWae2paA';

  // This app uses the standard HTTP TTS endpoint, so choose Eleven v4.
  // Eleven v4 Turbo is a Text-to-Dialogue WebSocket model and must not be
  // sent to /text-to-speech/{voice_id}.
  const modelId = body.qualityPreset === 'studio'
    ? env.ELEVENLABS_QUALITY_MODEL_ID || 'eleven_v4'
    : env.ELEVENLABS_TTS_MODEL_ID || 'eleven_v4';
  const expressiveness = Math.max(0, Math.min(100, body.expressiveness ?? 84)) / 100;
  const emotionTag = elevenLabsEmotionTag(body.emotion);
  const spokenText = emotionTag ? `${emotionTag} ${body.text}` : body.text;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: spokenText,
        model_id: modelId,
        language_code: 'ur',
        voice_settings: {
          // v4 exposes stability and similarity; style/speed are not used by this model.
          stability: Math.max(0.3, Math.min(0.75, 0.68 - expressiveness * 0.32)),
          similarity_boost: 0.85,
        },
      }),
    }
  );
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 240);
    throw new Error(`ElevenLabs returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length) throw new Error('ElevenLabs returned an empty audio response.');
  return {
    ok: true,
    providerUsed: 'elevenlabs' as const,
    modelUsed: modelId,
    voiceId,
    audioBase64: toBase64(bytes),
    mimeType: 'audio/mpeg',
  };
}

async function synthesizeWithGemini(
  env: GatewayEnv,
  body: { text: string; voiceId?: string; warmth?: number; emotion?: Emotion }
) {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured on the server.');
  const ai = createGeminiClient(env.GEMINI_API_KEY);
  const voiceName = mapVoiceForGeminiTts(body.voiceId);
  const moodStyle: Record<Emotion, string> = {
    happy: 'bright, upbeat and genuinely pleased',
    sad: 'soft, gentle and compassionate',
    angry: 'calm, firm and protective without shouting',
    surprised: 'curious and pleasantly surprised',
    shy: 'soft-spoken, modest and a little bashful',
    laughing: 'light-hearted with a natural amused smile',
    caring: 'warm, reassuring and patient',
    teasing: 'playfully mischievous, affectionate and respectful',
  };
  const warmthStyle = (body.warmth ?? 80) >= 85
    ? 'Warm, gentle, affectionate bilingual Pakistani Urdu and English companion tone.'
    : 'Clear, expressive, natural conversational Pakistani Urdu and English companion tone.';
  const style = `${warmthStyle} Delivery: ${moodStyle[body.emotion ?? 'caring']}. Speak naturally with human pacing. Keep romance sweet, consensual and non-explicit.`;
  const response = await ai.models.generateContent({
    model: env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts',
    contents: [{ role: 'user', parts: [{ text: body.text, speechMetadata: { style } }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;
  if (!base64Audio) throw new Error('Gemini TTS returned no audio data.');
  return { ok: true, providerUsed: 'gemini' as const, audioBase64: base64Audio, mimeType: 'audio/wav' };
}

export async function runTts(
  env: GatewayEnv,
  body: {
    text?: string;
    voiceId?: string;
    provider?: 'gemini' | 'elevenlabs';
    warmth?: number;
    expressiveness?: number;
    emotion?: Emotion;
    speed?: number;
    qualityPreset?: 'realtime' | 'studio';
  }
) {
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return { status: 400, body: { ok: false, error: 'Text is required for speech synthesis.' } };
  }
  if (text.length > 5000) {
    return { status: 413, body: { ok: false, error: 'Speech text exceeds the 5000-character request limit.' } };
  }

  const requestedProvider = body.provider || 'elevenlabs';
  const providerOrder = requestedProvider === 'elevenlabs' ? ['elevenlabs', 'gemini'] as const : ['gemini', 'elevenlabs'] as const;
  let lastError = '';

  for (const provider of providerOrder) {
    try {
      if (provider === 'elevenlabs') {
        if (!env.ELEVENLABS_API_KEY) {
          lastError = 'ElevenLabs API key is missing; attempting Gemini TTS fallback.';
          continue;
        }
        const audio = await synthesizeWithElevenLabs(env, {
          text,
          voiceId: body.voiceId,
          warmth: body.warmth,
          expressiveness: body.expressiveness,
          speed: body.speed,
          qualityPreset: body.qualityPreset || 'realtime',
          emotion: body.emotion,
        });
        return { status: 200, body: audio };
      }

      if (!env.GEMINI_API_KEY) {
        lastError = 'Gemini API key is missing.';
        continue;
      }
      const audio = await synthesizeWithGemini(env, {
        text,
        voiceId: body.voiceId,
        warmth: body.warmth,
        emotion: body.emotion,
      });
      return {
        status: 200,
        body: {
          ...audio,
          warning: requestedProvider === 'elevenlabs' ? lastError || 'ElevenLabs unavailable; Gemini TTS fallback is active.' : undefined,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Speech provider failed.';
    }
  }

  return {
    status: 503,
    body: {
      ok: false,
      providerUsed: 'browser_fallback',
      error: lastError || 'No speech provider is configured. Add ELEVENLABS_API_KEY or GEMINI_API_KEY.',
    },
  };
}

export async function runProviderTest(
  env: GatewayEnv,
  body: { provider?: 'gemini' | 'elevenlabs' | 'whisper_local' }
) {
  const provider = body.provider ?? 'gemini';
  if (provider === 'whisper_local') {
    return {
      status: 200,
      body: {
        ok: false,
        provider: 'whisper_local',
        status: 'disabled',
        latencyMs: null,
        message: 'Local Whisper v3 fallback is marked Coming later.',
      },
    };
  }

  if (provider === 'elevenlabs') {
    if (!env.ELEVENLABS_API_KEY) {
      return {
        status: 200,
        body: {
          ok: false,
          provider: 'elevenlabs',
          status: 'error',
          latencyMs: null,
          message: 'ELEVENLABS_API_KEY is not configured in server secrets.',
        },
      };
    }
    const start = Date.now();
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': env.ELEVENLABS_API_KEY },
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return {
          status: 200,
          body: {
            ok: false,
            provider: 'elevenlabs',
            status: 'error',
            latencyMs,
            message: `ElevenLabs ping failed (HTTP ${res.status}).`,
          },
        };
      }
      return {
        status: 200,
        body: {
          ok: true,
          provider: 'elevenlabs',
          status: 'connected',
          latencyMs,
          message: `ElevenLabs connected (${latencyMs}ms).`,
        },
      };
    } catch (err) {
      return {
        status: 200,
        body: {
          ok: false,
          provider: 'elevenlabs',
          status: 'error',
          latencyMs: Date.now() - start,
          message: err instanceof Error ? err.message : 'ElevenLabs request failed.',
        },
      };
    }
  }

  if (!env.GEMINI_API_KEY) {
    return {
      status: 200,
      body: {
        ok: false,
        provider: 'gemini',
        status: 'error',
        latencyMs: null,
        model: env.GEMINI_LIVE_MODEL || 'gemini-3.8-live',
        message: 'GEMINI_API_KEY is not configured in server secrets.',
      },
    };
  }

  const start = Date.now();
  try {
    const ai = createGeminiClient(env.GEMINI_API_KEY);
    const res = await ai.models.generateContent({
      model: env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash',
      contents: 'Reply with OK.',
    });
    const latencyMs = Date.now() - start;
    if (!res.text) {
      return {
        status: 200,
        body: {
          ok: false,
          provider: 'gemini',
          status: 'error',
          latencyMs,
          model: env.GEMINI_LIVE_MODEL || 'gemini-3.8-live',
          message: 'Gemini returned an empty ping response.',
        },
      };
    }
    return {
      status: 200,
      body: {
        ok: true,
        provider: 'gemini',
        status: 'connected',
        latencyMs,
        model: env.GEMINI_LIVE_MODEL || 'gemini-3.8-live',
        message: `Gemini connected (${latencyMs}ms).`,
      },
    };
  } catch (err) {
    return {
      status: 200,
      body: {
        ok: false,
        provider: 'gemini',
        status: 'error',
        latencyMs: Date.now() - start,
        model: env.GEMINI_LIVE_MODEL || 'gemini-3.8-live',
        message: err instanceof Error ? err.message : 'Gemini ping failed.',
      },
    };
  }
}

export async function runLiveSession(env: GatewayEnv) {
  const model = env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
  if (!env.GEMINI_API_KEY && !env.AI) {
    return {
      status: 200,
      body: {
        ok: false,
        mode: 'unconfigured',
        model,
        systemInstruction: '',
        gatewayUrl: null,
        error: 'Neither Gemini API key nor Cloudflare Workers AI binding is configured on the server.',
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      mode: 'server_chat_relay',
      model: env.GEMINI_API_KEY ? model : (env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast'),
      systemInstruction: '',
      gatewayUrl: env.GEMINI_LIVE_GATEWAY_URL || null,
    },
  };
}
