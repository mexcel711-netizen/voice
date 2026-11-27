# Zara — Personal AI Voice Assistant

Single-owner bilingual (**Urdu + Roman Urdu + English**) AI voice companion with live Gemini multimodal voice/chat proxy, Memory Vault, Emotion & Personality Studios, Reminders & Adhan Prayer Times (`adhan`), Safety Guardrails, and Supabase Realtime command dispatch for Zara Local Agent.

## Local Development

```bash
npm install
npm run dev
```

The server listens on `http://localhost:3000` (Express + Vite middlewares + `/api/*` endpoints).

## Environment Variables

Copy `.env.example` and configure as needed (never commit secrets):

- `GEMINI_API_KEY`: Server-side Gemini API key (`@google/genai`)
- `ELEVENLABS_API_KEY`: Optional server-side ElevenLabs TTS key
- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Optional Supabase project URL & anon key
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OWNER_EMAIL`: Server-side JWT & owner verification for `/api/*`

When Supabase env vars are omitted, the workspace runs cleanly in local mode with explicit `"Supabase configure nahi hai"` notices and empty user data lists.

## Cloudflare Pages Deployment

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Functions directory:** `functions/api/` (`/api/live-session`, `/api/live-chat`, `/api/tts`, `/api/provider-test`)

## Premium Urdu voice

The app defaults to the connected ElevenLabs Reva Urdu companion voice (voice ID `o85TqPN3F4P7dWae2paA`) using `eleven_v4_turbo` for lower-latency conversation. Voice Studio can select another stored voice profile. Set `ELEVENLABS_API_KEY` as a Cloudflare Pages secret; the browser never receives the provider key. If ElevenLabs is unavailable, the server attempts Gemini TTS when `GEMINI_API_KEY` is configured.

Set `ELEVENLABS_TTS_MODEL_ID=eleven_v4_turbo` for conversation and `ELEVENLABS_QUALITY_MODEL_ID=eleven_v4` for studio-quality playback. The `qualityPreset` request option selects between them.

## Chrome browser control

See [chrome-extension/README.md](chrome-extension/README.md). The MV3 extension provides a narrow, allowlisted bridge for listing/opening/searching tabs, switching/closing tabs, reading a user-permitted page, and scrolling. It does not expose arbitrary JavaScript execution, cookies, or password access.

## Cloudflare and Supabase

Cloudflare Pages uses `wrangler.toml` for the Workers AI binding and builds from `dist`. Configure these server secrets in Cloudflare Pages:

- `GEMINI_API_KEY` — optional when Workers AI is available; Gemini fallback and Gemini TTS.
- `ELEVENLABS_API_KEY` — required to use the selected ElevenLabs voice.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` — server-side owner JWT verification.
- `OWNER_EMAIL` — optional extra owner email restriction.

Frontend build variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (use only the Supabase publishable/anon key). Never put a service-role key in frontend variables, source control, or this repository.

The Supabase migration is required before the app can persist data. Create the first owner in Supabase Auth and set the immutable `app_metadata.role` claim to `owner`; user-editable metadata is not an authorization source.

## Verification

```bash
npm run lint
npm run build
npx tsx --test src/lib/*.test.ts
```
