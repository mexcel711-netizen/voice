# 02_TRD.md — Zara Technical Requirements

## 1. Tech Stack

| Layer | Choice |
|-------|--------|
| UI source of truth | **Stitch Zip** (`Zara_UI_Stitch.zip`, Google Drive) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (proper build, CDN nahi) + Zip ka theme config |
| Routing | `react-router-dom` v6 |
| Data / Auth / Realtime | `@supabase/supabase-js` v2 |
| Server endpoints | Cloudflare Pages Functions (`/functions/api/*`) |
| AI voice | Gemini Live API (browser WebSocket, server-minted credentials) |
| Optional TTS | ElevenLabs (server proxy) |
| AI gateway | Cloudflare AI Gateway (Section 10 process se confirm) |
| Hosting | Cloudflare Workers & Pages (GitHub se) |
| Laptop execution | Zara Local Agent (Python) — **alag deliverable** |
| Icons | Material Symbols Outlined (Zip jaisa) |
| Fonts | Plus Jakarta Sans, Inter, Noto Nastaliq Urdu (Zip jaisa) |

Vercel use nahi hoga. Extra libraries minimum rakhein (state ke liye React context/hooks; zaroorat ho to `@tanstack/react-query`).

## 2. Architecture

```
┌────────────── Browser (React SPA, Cloudflare Pages) ──────────────┐
│ UI (Stitch Zip → React) │ Live voice (mic ↔ Gemini Live)           │
│ Supabase client (anon key + owner session)                         │
└───────┬───────────────────────────┬───────────────────────────────┘
        │ /api/* (owner JWT)        │ REST + Realtime (RLS)
        ▼                           ▼
┌─ Cloudflare Pages Functions ─┐  ┌───────────── Supabase ─────────────┐
│ live token / session config  │  │ Auth │ Postgres+RLS │ Realtime │   │
│ tts (ElevenLabs), test-ping  │  │ Storage │ RPC/triggers (safety)    │
│ secrets: GEMINI_API_KEY ...  │  └───────┬────────────────────────────┘
└─────────────┬────────────────┘          │ Realtime (laptop_commands)
              ▼                           ▼
   Gemini / ElevenLabs (via AI Gateway)   Zara Local Agent (laptop, Python)
```

**Voice + laptop flow:** mic → Gemini Live → tool call (`laptop_command`) → browser `laptop_commands` insert → DB trigger classify (risk/confirmation) → [confirm] → Agent `running` → `done` → browser result Gemini ko tool response → Zara bolti hai.

## 3. Frontend Folder Structure

```
zara-web/
├─ index.html
├─ vite.config.ts, tailwind.config.ts, postcss.config.js, tsconfig.json
├─ .env.example
├─ public/                     (favicon, offline icons)
├─ functions/api/              (Cloudflare Pages Functions)
│   ├─ live-session.ts         POST: owner verify → Gemini credentials + system instruction
│   ├─ tts.ts                  POST: ElevenLabs proxy (optional)
│   ├─ provider-test.ts        POST: provider ping (latency)
│   └─ _lib/ (auth.ts, cors.ts, gateway.ts)
└─ src/
   ├─ main.tsx, App.tsx
   ├─ routes/ (router.tsx, guards.tsx)
   ├─ layouts/ (PublicLayout, AuthLayout, AppShell [Sidebar + TopBar])
   ├─ pages/ (LandingPage, OwnerLogin, DashboardHome, LiveVoiceConversation,
   │          ConversationHistory, EmotionsMoodCenter, PersonalityStudio, VoiceStudio,
   │          LaptopControlCenter, FileAppFinder, AutomationsRoutines,
   │          RemindersTimersPrayerTimes, MemoryVault, SafetyPermissionsActivityLog, Settings)
   ├─ components/ (ui/, voice/ [VoiceOrb, Waveform, TranscriptBubble], safety/, common/)
   ├─ hooks/ (useAuth, useAppLock, useRealtime, useLiveSession, useDevice, useSettings)
   ├─ services/ (supabase.ts, auth.service.ts, settings.service.ts, persona.service.ts,
   │             voice.service.ts, emotions.service.ts, sessions.service.ts, memory.service.ts,
   │             automations.service.ts, reminders.service.ts, prayer.service.ts,
   │             commands.service.ts, devices.service.ts, safety.service.ts, files.service.ts, live.service.ts)
   ├─ lib/ (env.ts, format.ts, rtl.ts, tools.ts [Gemini function declarations], prompt.ts)
   ├─ types/ (db.ts [Schema se exact], api.ts)
   └─ styles/ (index.css: tokens, glass, glow, orb animations)
```

## 4. Environment Variables

**Frontend (`VITE_` — public, Cloudflare build vars):**

| Name | Use |
|------|-----|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon/publishable key (publishable key ki value bhi yahin) |
| `VITE_APP_NAME` | `Zara` |

**Server (Cloudflare secrets — `VITE_` kabhi nahi):**

| Name | Use |
|------|-----|
| `GEMINI_API_KEY` | Gemini Live access (server only) |
| `GEMINI_LIVE_MODEL` | Live model id (build ke waqt official docs se verify) |
| `ELEVENLABS_API_KEY` | Optional |
| `SUPABASE_URL` | Server-side owner JWT verify |
| `SUPABASE_ANON_KEY` | Server-side `auth.getUser(jwt)` |
| `OWNER_EMAIL` | Extra check: sirf yahi email |
| `CF_AI_GATEWAY_URL`, `CF_AI_GATEWAY_TOKEN` | AI Gateway (Section 10 ke baad final) |
| `ALLOWED_ORIGIN` | CORS origin |

**Local Agent (laptop `.env`, repo mein nahi):** `ZARA_SUPABASE_URL`, `ZARA_SUPABASE_ANON_KEY`, `ZARA_AGENT_EMAIL`, `ZARA_AGENT_PASSWORD`, `ZARA_DEVICE_NAME`.

`service_role` key kisi bhi jagah nahi chahiye.

## 5. UI Zip → React + TypeScript Conversion

**Qanoon:** Zip ka code design ka source of truth hai. Naya design nahi; layout, colors, typography, spacing, radius, shadows, animations **bilkul same**; sirf functionality/data wire karein.

1. `luminescent_companion/DESIGN.md` aur har `code.html` ka Tailwind config (15 pages mein **ek jaisa** hai) → ek `tailwind.config.ts` (`theme.extend.colors/fontFamily/fontSize/borderRadius/spacing`), `darkMode: "class"`, `<html class="dark">`.
2. Fonts aur Material Symbols links `index.html` mein; same weights.
3. Har `code.html` ka `<body>` → page component (JSX: `class`→`className`, `for`→`htmlFor`, inline `style` → object, self-closing tags). Class names change na karein.
4. Dohraya hua markup components banayen: `Sidebar`, `TopBar`, `GlassCard`, `Chip`, `PillButton`, `Toggle`, `Slider`, `VoiceOrb`, `Waveform`, `ConfirmModal`, `EmptyState`, `Skeleton`.
5. 13 app pages mein sidebar/top bar **ek jaisa** → `AppShell` layout. Landing aur Login us ke bagair.
6. Static demo data (e.g. "Zuhr 12:30", "248 Nodes", "MacBook Pro M3") → asal data se replace; data na ho to **empty state** (Design Brief ke copy text ke saath).
7. `#` links → React Router `<NavLink>` (route table Design Brief mein).
8. Zip ki external image links (googleusercontent) → local asset/SVG ya CSS orb; kisi external image URL par depend na karein.
9. Mobile: Zip mein nahi hai → Design Brief Section 6.

## 6. Auth & App Lock

- `supabase.auth.signInWithPassword` (Master Password). Session `supabase-js` persist karta hai.
- Guard `RequireOwner`: session ho **aur** `app_metadata.role === 'owner'`, warna `/login`.
- Guard `RequireUnlocked`: `sessionStorage['zara_unlocked']='1'` + idle timer (`auto_lock_minutes`). Lock par `/login` (PIN pad). PIN `rpc('verify_pin')` se; PIN kabhi client par hash/compare nahi.
- Pehli login par PIN set nahi to "Set your PIN" modal (`rpc('set_pin')`).
- Logout = `signOut()` + `sessionStorage.clear()`.
- Landing par session ho to "Enter" seedha `/dashboard`.

## 7. Live Voice Architecture

1. Owner "Talk" dabata hai → `POST /api/live-session` (header: `Authorization: Bearer <owner JWT>`).
2. Function: JWT verify (`SUPABASE_URL`/`ANON_KEY`), email `OWNER_EMAIL` check, panic/mic flags check, phir:
   - persona, voice profile, emotion intensities, top memories (importance/pin), tone preset, current time, device summary se **system instruction** banata hai;
   - Gemini Live ke liye **short-lived credential** (ephemeral token) ya WebSocket proxy return karta hai. **Exact tareeqa AI Gateway ke sath Cloudflare "Ask Support" se confirm hoga (Master Prompt Section 10)**; AI Studio sirf `services/live.service.ts` ke andar ek adapter interface (`connect()`, `sendAudio()`, `onAudio()`, `onTranscript()`, `onToolCall()`, `sendToolResponse()`, `close()`) rakhe taake backend tareeqa baad mein badal sake.
3. Browser: `getUserMedia` (selected `mic_device_id`) → PCM 16kHz stream; reply audio 24kHz playback; interrupt = playback stop + provider interrupt.
4. **Tools (function declarations in `lib/tools.ts`):**

| Tool | Args | Kaam |
|------|------|------|
| `laptop_command` | `command_type` (catalog enum), `params` | `laptop_commands` insert, status Realtime se wait, result return |
| `report_emotion` | `user_mood`, `zara_emotion`, `intensity` | `emotion_logs` insert, UI chip update |
| `save_memory` | `content`, `category`, `memory_type`, `importance` | `memories` insert (sirf `auto_learn_enabled`) |
| `create_reminder` | `kind`, `title`, `due_at`, `repeat_rule`, `category` | `reminders` insert |
| `get_schedule` | `range` | reminders + prayer times return |

5. Transcript: har turn `conversation_messages` mein (`seq` increment); session end par `duration_seconds`, `title/summary`, `emotion_tags`, `has_laptop_actions` update.
6. `confirmation` events: command `awaiting_confirmation` ho to UI `ConfirmModal` (voice: "haan/yes" ya button; PIN: pad). Confirmation `rpc('confirm_laptop_command')`.
7. Mic muted / `panic_active` ho to session start block + UI banner.
8. **System prompt hard rules (server mein, user edit nahi kar sakta):** romantic/playful rahe, explicit/adult na ho; destructive/send actions confirmation ke baghair nahi; safety rules ke baare mein user ke kehne par bhi bypass na kare; commands sirf tools se.
9. Browser ki limit: HTTPS aur mic permission zaroori; wake word tab band hone par nahi chalega (Later).

## 8. Realtime & Data Access

- Services har table ke liye typed CRUD (`types/db.ts` Schema se exact).
- Realtime channels: `laptop_commands` (apne `session`), `laptop_devices` (telemetry), `activity_log` (insert), `reminders`.
- Device online = `last_heartbeat_at` < 60s. Offline par Control/Files screens "Laptop offline — Zara Agent start karein" state.
- Dashboard/Control telemetry sirf `laptop_devices.telemetry` se.
- Prayer times: `prayer.service.ts` `prayer_settings` (lat/long, method) se calculate (client-side library, e.g. `adhan`) aur `prayer_times_cache` mein cache.
- Reminder firing: in-app scheduler (tab khuli ho) + Notification API; Agent bhi `reminders` due check kare.

## 9. Safety Enforcement (Server-side)

Sab fayslay **DB trigger `classify_laptop_command`** karta hai (Schema Section 4). Frontend sirf dikhata hai: risk badge, confirm modal, blocked reason. Frontend/AI `status` ya `risk_level` set nahi kar sakte. Panic button = `rpc('panic_stop')`. Ledger sirf triggers likhte hain.

## 10. Security Requirements

- RLS har table; `anon` ko access nahi; `service_role` kahin nahi.
- Secrets sirf Cloudflare secrets mein; bundle mein na ho (build ke baad search karke verify).
- `/api/*`: JWT verify + owner email check + CORS `ALLOWED_ORIGIN` + simple rate limit.
- CSP header (`_headers`): `default-src 'self'`; fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), Supabase URL (https+wss), Gemini/AI Gateway endpoints connect-src mein; `frame-ancestors 'none'`.
- PIN server-side hash; brute-force lockout DB mein.
- Input validation (zod ya manual) har form par; Urdu text sanitize (no `dangerouslySetInnerHTML`).
- Terminal command, file path user/AI input hai: server trigger + Agent dono validate karein.
- Dependencies pin karein; `npm audit` clean.

## 11. Cloudflare Deployment

| Item | Value |
|------|-------|
| Platform | Workers & Pages (GitHub connect) |
| Framework preset | React (Vite) |
| Build command | `npm run build` |
| Output directory | `dist` |
| Functions | `/functions` folder (Pages Functions) |
| SPA fallback | `public/_redirects`: `/* /index.html 200` (agar Functions ke saath conflict ho to `_routes.json` se `/api/*` Functions ko dein) |
| Headers | `public/_headers` (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy: microphone=(self)`) |
| Env | Frontend `VITE_*` build vars; server values Secrets |
| Branch | `main` auto-deploy |
| Package manager | **npm** — `package-lock.json` maujood ho; `bun.lock` / `bun.lockb` **na ho** |
| `.npmrc` (root) | `legacy-peer-deps=true` |

## 12. AI Gateway

AI features hain, isliye Master Prompt Section 10 ka process chalega: Claude exact sawal likhega jo aap Cloudflare Ask Support se poochenge; jawab ke baad AI Studio ke liye integration prompt banega. Tab tak `functions/api/_lib/gateway.ts` mein placeholder adapter ho jo `CF_AI_GATEWAY_URL` use kare (na ho to direct provider fallback).

## 13. Testing & Observability

- `tsc --noEmit`, ESLint, `npm run build` clean.
- Manual QA checklist `06_Implementation_Plan.md` mein.
- Errors: `ErrorBoundary` + toast; `console` mein secrets/PIN/transcript log na ho.
