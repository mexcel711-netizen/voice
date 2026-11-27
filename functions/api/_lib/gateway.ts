import { GoogleGenAI, Type } from '@google/genai';

export interface GatewayEnv {
  GEMINI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
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
  }
) {
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return { status: 400, body: { ok: false, error: 'Message text is required.' } };
  }
  if (!env.GEMINI_API_KEY) {
    return {
      status: 503,
      body: {
        ok: false,
        error: 'GEMINI_API_KEY is not configured on the server. Set it in runtime secrets.',
      },
    };
  }

  try {
    const ai = createGeminiClient(env.GEMINI_API_KEY);
    const historyParts = (body.history ?? []).slice(-12).map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    }));

    const sys = [
      body.systemInstruction ||
        'You are Zara, Boss’s warm, caring bilingual Urdu + English personal voice companion.',
      `Language mode preference: ${body.language || 'urdu_english'}.`,
      'Return JSON with replyText (primary natural response in requested language script), replyRoman (Roman Urdu transliteration), replyEn (concise English meaning), emotion (one of happy,sad,angry,surprised,shy,laughing,caring,teasing), intensity (0-100 integer), and optional toolCalls array when Boss explicitly asks to control the laptop or create a reminder/memory.',
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [
        ...historyParts,
        { role: 'user', parts: [{ text: message }] },
      ],
      config: {
        systemInstruction: sys,
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
      toolCalls?: Array<{ name: string; argsJson?: string }>;
    };

    const mappedTools = (parsed.toolCalls ?? []).map((t) => {
      let args: Record<string, unknown> = {};
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

export async function runTts(
  env: GatewayEnv,
  body: {
    text?: string;
    voiceId?: string;
    provider?: 'gemini' | 'elevenlabs';
    warmth?: number;
    expressiveness?: number;
  }
) {
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return { status: 400, body: { ok: false, error: 'Text is required for speech synthesis.' } };
  }

  if (body.provider === 'elevenlabs') {
    if (!env.ELEVENLABS_API_KEY) {
      return {
        status: 503,
        body: {
          ok: false,
          providerUsed: 'browser_fallback',
          error: 'ELEVENLABS_API_KEY is not configured on the server.',
        },
      };
    }
    try {
      const targetVoice = body.voiceId || 'EXAVITQu4vr4xnSDxMaL';
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(targetVoice)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
        }),
      });
      if (!res.ok) {
        return {
          status: 502,
          body: {
            ok: false,
            providerUsed: 'elevenlabs',
            error: `ElevenLabs returned HTTP ${res.status}`,
          },
        };
      }
      const arr = new Uint8Array(await res.arrayBuffer());
      let bin = '';
      for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
      const audioBase64 = btoa(bin);
      return {
        status: 200,
        body: {
          ok: true,
          providerUsed: 'elevenlabs',
          audioBase64,
          mimeType: 'audio/mpeg',
        },
      };
    } catch (err) {
      return {
        status: 502,
        body: {
          ok: false,
          providerUsed: 'elevenlabs',
          error: err instanceof Error ? err.message : 'ElevenLabs synthesis failed.',
        },
      };
    }
  }

  if (!env.GEMINI_API_KEY) {
    return {
      status: 503,
      body: {
        ok: false,
        providerUsed: 'browser_fallback',
        error: 'GEMINI_API_KEY is not configured on the server.',
      },
    };
  }

  try {
    const ai = createGeminiClient(env.GEMINI_API_KEY);
    const voiceName = mapVoiceForGeminiTts(body.voiceId);
    const style =
      (body.warmth ?? 80) >= 85
        ? 'Warm, gentle, affectionate bilingual Urdu and English companion tone'
        : 'Clear, expressive, natural conversational companion tone';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: { style },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return {
        status: 502,
        body: { ok: false, providerUsed: 'gemini', error: 'Gemini TTS returned no audio data.' },
      };
    }
    return {
      status: 200,
      body: {
        ok: true,
        providerUsed: 'gemini',
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      },
    };
  } catch (err) {
    return {
      status: 502,
      body: {
        ok: false,
        providerUsed: 'gemini',
        error: err instanceof Error ? err.message : 'Gemini TTS failed.',
      },
    };
  }
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
      model: 'gemini-4-hydrogen',
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
          model: 'gemini-3.8-live',
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
        model: 'gemini-3.8-live',
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
        model: 'gemini-3.8-live',
        message: err instanceof Error ? err.message : 'Gemini ping failed.',
      },
    };
  }
}

export async function runLiveSession(env: GatewayEnv) {
  const model = env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
  if (!env.GEMINI_API_KEY) {
    return {
      status: 200,
      body: {
        ok: false,
        mode: 'unconfigured',
        model,
        systemInstruction: '',
        gatewayUrl: null,
        error: 'GEMINI_API_KEY is not configured on server.',
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      mode: 'server_chat_relay',
      model,
      systemInstruction: '',
      gatewayUrl: env.GEMINI_LIVE_GATEWAY_URL || null,
    },
  };
}
