# 06_Implementation_Plan.md — Zara (AI Studio Internal Execution Plan)

> Ye AI Studio ke liye **ek hi baar mein** poora kaam karne ka internal plan hai (user ke liye phase-wise prompts nahi). Pass 1 (`Follow the plan`) mein pura build; Pass 2 mein compare/finalize.

## 0. Inputs
1. `01_PRD.md`, `02_TRD.md`, `03_App_Flow.md`, `04_UI_UX_Design_Brief.md`, `05_Backend_Schema.md`, `06_Implementation_Plan.md`
2. **Google Drive se `Zara_UI_Stitch.zip`** — UI ka source of truth (design wahi, naya nahi).

## 1. Hard Rules
- UI Zip ka code base: design/layout/colors/typography/spacing **change nahi**.
- React 18 + TypeScript + Vite + Tailwind; React Router; Supabase JS.
- Table/column/enum/route/env names files se exact (`05` aur `04` mapping).
- Frontend Supabase-ready ho (env vars se client); **Supabase project/DB yahan nahi banta**; env missing ho to app "Supabase configure nahi hai" ka saaf message aur empty states dikhaye; **mock/demo data kahin nahi**.
- Koi secret/service-role key code mein nahi. `VITE_` sirf URL + anon key.
- Local Agent is build ka hissa **nahi**.
- AI Studio Zip ignore kar de to design Zip ke mutabiq wapas laye.

## 2. Build Order (internal)

| # | Kaam | Output |
|---|------|--------|
| 1 | **Zip analyze:** 15 `code.html`, `DESIGN.md`, `screen.png` dekhein; shared sidebar/top bar/components pehchanein | Component inventory |
| 2 | **Project scaffold:** Vite React TS, Tailwind (Zip config), fonts, Material Symbols, `.env.example`, folder structure (TRD §3) | Running shell |
| 3 | **Design system layer:** `styles/index.css` (glass, glow, orb, waveform, skeleton), UI components (`GlassCard`, `PillButton`, `Chip`, `Toggle`, `Slider`, `Modal/ConfirmModal`, `Toast`, `EmptyState`, `Skeleton`, `RiskBadge`, `VoiceOrb`, `Waveform`) | Components Zip jaisa dikhen |
| 4 | **Layouts + routing:** `PublicLayout`, `AuthLayout`, `AppShell` (Sidebar 13 items, TopBar, lock/mic buttons), router, guards, 404, **responsive collapse** (Brief §6) | Navigation chalay |
| 5 | **Types + services:** `types/db.ts` (Schema exact), `supabase.ts`, har service (TRD §3), `env.ts` validation | Typed data layer |
| 6 | **Auth & app lock:** Master Password, PIN pad (`verify_pin`/`set_pin`), idle lock, guards, Landing→Login flow | Login complete |
| 7 | **Pages (Zip se convert), is tarteeb se:** Landing → Login → Dashboard → Settings → Personality → Voice Studio → Emotions → Memory → Reminders & Prayer → History → Automations → Safety → Control → Files → Live Voice | 15 pages Zip ke mutabiq + asal data |
| 8 | **Safety UI:** Confirm modal (voice/manual/pin), panic flow, blocked/awaiting states, ledger (Realtime, filter, CSV) | Safety complete |
| 9 | **Laptop command layer:** `commands.service.ts` (insert, Realtime status, timeout, cancel), `devices.service.ts` (online/telemetry), offline states | Agent-ready UI |
| 10 | **Live voice:** `live.service.ts` adapter interface, mic capture, playback, transcript save, tools (`lib/tools.ts`), prompt builder client hooks, session lifecycle, error/reconnect | `/talk` complete (backend endpoint stub ke saath) |
| 11 | **Cloudflare Functions:** `functions/api/live-session.ts`, `tts.ts`, `provider-test.ts`, `_lib/*` (JWT verify, CORS, gateway adapter placeholder) | Endpoints code |
| 12 | **Reminders engine:** in-app scheduler + Notification API, prayer calc + cache | Alerts |
| 13 | **Config:** `public/_headers` (CSP etc.), `_redirects`/`_routes.json`, `README.md` (env list, setup) | Deploy-ready |
| 14 | **Polish & QA:** states, a11y, responsive, error boundaries, lint/typecheck/build | Checklist pass |

## 3. Dependencies
- Schema (05) ka DB tab bane jab ChatGPT Supabase set kare; tab tak code env-guarded.
- Live voice `/api/live-session` ka final tareeqa **AI Gateway process (Section 10)** par; adapter pattern isi liye.
- Local Agent ke baghair Control/Files/telemetry "Laptop offline" state dikhaengi (yeh expected hai).
- Prayer calc library (e.g. `adhan`), Notification API.

## 4. Testing Checkpoints

| Checkpoint | Verify |
|-----------|--------|
| After #4 | 13 routes + guards + responsive drawer/tab bar |
| After #6 | Login/PIN lock/unlock/idle lock |
| After #7 | Har page Zip `screen.png` se visually match; koi demo data nahi |
| After #8 | Confirm modal 3 methods, panic banner, ledger filters |
| After #10 | Mic permission, states, transcript save, tool call → command insert |
| After #13 | `npm run build` pass, output `dist`, `_redirects` + `/api/*` conflict nahi |

## 5. Final Checklist

- [ ] 15 screens routed, naam Brief §3 se match
- [ ] Design Zip jaisa (colors, fonts, radius, glass, glow); sirf Brief §10 wali cheezen badli
- [ ] Mobile/tablet responsive collapse
- [ ] Kahin `localhost`/mock secret/external image URL nahi
- [ ] Bundle mein koi API key nahi (grep `GEMINI`, `ELEVEN`, `service_role`)
- [ ] `.env.example` TRD §4 ke mutabiq
- [ ] Sab table/column names `05` se exact
- [ ] Empty/loading/error/offline states har page par
- [ ] Urdu RTL Nastaliq sahi (clipping nahi)
- [ ] Flirt/explicit rule system prompt (server) mein; UI note maujood
- [ ] "Later" features disabled + label
- [ ] `package-lock.json` maujood, `bun.lock`/`bun.lockb` nahi, root mein `.npmrc` (`legacy-peer-deps=true`)
- [ ] `public/_redirects` (SPA fallback) maujood
- [ ] `tsc --noEmit`, lint, `npm run build` clean (output `dist`)
- [ ] README: setup, env, Cloudflare settings (build `npm run build`, output `dist`)

## 6. Website Ke Baad (AI Studio ka kaam nahi)
1. Supabase setup (ChatGPT, `05` ke mutabiq).
2. **Zara Local Agent** (Python; OS: Windows/Mac aap bataenge): Realtime listener, command executors (22 `command_type`), telemetry heartbeat, file indexer, reminders notifier, permission re-check.
3. AI Gateway integration (Section 10), images (Section 9), GitHub, Cloudflare deploy.
