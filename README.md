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

## Verification

```bash
npm run lint
npm run build
npx tsx --test src/lib/*.test.ts
```
