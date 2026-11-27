# 04_UI_UX_Design_Brief.md — Zara UI/UX (Stitch Design Par Based)

## 0. SAB SE UPAR SAKHT HIDAYAT (AI Studio ke liye)

**Google Drive wali UI Zip (`Zara_UI_Stitch.zip`) ka code hi UI ka source of truth hai.**

- Zip ka wohi code/design use karein. **Naya design na banayen.**
- Layout, colors, typography, spacing, radius, shadows, glass effect, glow, animations, components, copy text **change na karein.**
- Sirf in cheezon ka izafa/badlao jaiza hai: React + TypeScript conversion, asal data wiring, routing, forms/validation, states (loading/empty/error), safety UI behavior, aur Section 6 ka responsive collapse.
- Zip mein 15 screens + `luminescent_companion/DESIGN.md` hain. Har screen ka folder: `<folder>/code.html` + `screen.png` (visual reference). Compare ke waqt `screen.png` dekhein.

---

## 1. Design System ("Luminescent Companion")

Style: dark, glassmorphism, soft bioluminescent glow, warm/intimate (cold corporate nahi). Source: `luminescent_companion/DESIGN.md` aur har page ka Tailwind config (15 pages mein ek jaisa).

### Colors (hex)
| Role | Hex |
|------|-----|
| Background Deep | `#0B0A14` (body: `bg-surface-container-lowest`) |
| Surface / `background` / `surface` | `#13121C` |
| Surface Card | `#161426` |
| Surface Elevated | `#1F1C36` |
| Border Structural | `#2E2A4D` |
| **Primary (Rose Magenta)** | `#E94B9A` (Tailwind `primary-container` = `#F454A3`, `primary` = `#FFB0CE`) |
| **Secondary (Electric Violet)** | `#7C5CFF` (`secondary` = `#CABEFF`, `secondary-container` = `#4816CB`) |
| **Accent (Soft Gold)** | `#F5C26B` (`tertiary` = `#F1BE68`) |
| Success / Warning / Danger | `#3DDC97` / `#FFB547` / `#FF5C6C` (Tailwind `error` = `#FFB4AB`) |
| Text Primary / Secondary / Muted | `#F4F1FF` / `#A8A3C7` / `#69638E` |
| `on-surface` / `on-surface-variant` | `#E5E0F0` / `#DDBFC8` |
| `outline` / `outline-variant` | `#A58993` / `#574149` |

Poora Material-style token set (`surface-container-*`, `on-*`, `*-fixed`, `inverse-*`) Zip ke Tailwind config mein hai; **wohi config copy karein**. `DESIGN.md` ke extra tokens (`surface-card`, `surface-elevated`, `border-subtle`, `text-primary`, `text-secondary`, `success`, `warning`, `danger`, muted text) Tailwind config mein nahi hain; unhein CSS variables / `theme.extend.colors` mein add karein (Zip ke arbitrary hex classes jaisa behavior barqarar rahe).

### Gradients
- **Core Luminescence:** `linear-gradient(135deg, #E94B9A 0%, #7C5CFF 100%)` — primary buttons, active chips, orb.
- **Ethereal Sheen:** `linear-gradient(180deg, rgba(244,241,255,.12), rgba(244,241,255,.02))`.
- Canvas ambient radials: `rgba(124,92,255,.08)` aur `rgba(233,75,154,.06)`.

### Typography (Tailwind `font-*` + size tokens Zip config se)
| Token | Font | Size / Weight / LH |
|-------|------|--------------------|
| `display-lg` | Plus Jakarta Sans | 48/700/56, tracking -0.02em (`display-lg-mobile` 36/700/44) |
| `headline-lg` / `-md` / `-sm` | Plus Jakarta Sans | 32/600/40 · 24/600/32 · 20/600/28 |
| `title-md` | Plus Jakarta Sans | 18/500/26 |
| `body-lg/md/sm` | Inter | 18/28 · 16/24 · 14/20 (400) |
| `label-md` / `label-sm` | Plus Jakarta Sans | 14/600/20 · 12/500/16 |
| `urdu-headline` | Noto Nastaliq Urdu | 26/600/54 |
| `urdu-body` | Noto Nastaliq Urdu | 16/400/36 |

Urdu text `dir="rtl"` + Nastaliq; line-height ≥ 2.0× (clipping se bachne ke liye); RTL container mein vertical padding +4px. Fonts (Google Fonts): Plus Jakarta Sans 500–800, Inter 300–700, Noto Nastaliq Urdu 400/600, Material Symbols Outlined.

### Shape, Spacing, Elevation
- Radius: pill `rounded-full` (buttons, chips, search); cards **20px**; form controls **14px**; Tailwind config: `DEFAULT 1rem`, `lg 2rem`, `xl 3rem`.
- Spacing tokens: `gutter 1.5rem`, `gutter-mobile 1rem`, `margin 3rem`, `margin-mobile 1.25rem`, `space-xs .25 / sm .5 / md 1 / lg 1.5 / xl 2.5 rem`.
- Elevation: **Tier 1** card: `rgba(22,20,38,.65)` + `blur(20px)` + `1px rgba(46,42,77,.6)` + `0 8px 32px -4px rgba(0,0,0,.35)`. **Tier 2** popover: `rgba(31,28,54,.85)` + `blur(32px)` + `1px rgba(124,92,255,.25)`. **Tier 3** voice core aura: `0 0 40px 8px rgba(233,75,154,.35), 0 0 80px 24px rgba(124,92,255,.2)`.

### Components
| Component | Spec |
|-----------|------|
| Primary Glow Button | pill, core gradient, label `#F4F1FF`, glow `0 4px 20px rgba(233,75,154,.4)`; active `scale(.98)` + `0 6px 30px rgba(124,92,255,.6)` |
| Secondary Glass Button | `rgba(244,241,255,.05)`, border `rgba(46,42,77,.8)`, hover violet tint `rgba(124,92,255,.15)` |
| Danger Button | solid danger; critical actions |
| Glass Card | 20px radius, frosted, gradient border |
| Inputs | 14px, fill `rgba(11,10,20,.6)`, border `#2E2A4D`, focus `#7C5CFF` + ring `0 0 0 3px rgba(124,92,255,.25)` |
| Chips | pill, h-32, px-14; active = rose→violet gradient |
| Checkbox/Radio/Toggle | 1.75px stroke, active gradient fill + glow |
| Voice Orb & Waveform | multi-layer radial gradient, amplitude-reactive scale; hue: Rose = speaking, Violet = thinking/processing, Gold = suggestions |
| Risk Badge | Low = success, Medium = warning, High = `#FFB547`→danger tint, Critical = danger; Zip ke badge styling jaisa |
| Modals | desktop centered, backdrop blur; mobile bottom sheet |
| Icons | **Material Symbols Outlined** (jaisa Zip mein), rounded, stroke ~1.75 look; icon-font ki jagah SVG na badlein jab tak zaroorat na ho |

### Motion
Orb breathing glow, waveform bars, shimmer skeleton, 200ms ease transitions, page fade. `prefers-reduced-motion` par animations band/soft.

---

## 2. Layout & Navigation (Zip ke mutabiq)

- **AppShell (13 screens):** left fixed sidebar `w-72` (glass, blur) + main `ml-72`; sticky top bar. Sidebar: logo + "Zara" + "Ready" chip, 13 items (Dashboard, Talk **LIVE** badge, History, Control, Files, Automations, Reminders & Prayer, Memory Vault, Emotions & Mood, Personality Studio, Voice Studio, Safety & Logs, Settings), footer: **Lock Screen** + **Mute Mic**. Active item = gradient pill.
- **Top bar:** breadcrumb "Companion Space › Active Session", Mic pill ("Mic Active (Urdu / English)"), Wi-Fi + battery, "Boss (Owner)" avatar.
- **PublicLayout:** Landing — apni top nav + footer. **AuthLayout:** Login — sidebar nahi.
- Desktop content max width ~1280px (DESIGN.md), 12-column grid.

---

## 3. Screen-to-Route-to-Component Mapping

Zip folder (`stitch_split_screen_typing_app/`) → route → component → data tables (Schema se).

| # | Stitch Screen | Zip folder | Route | Component | Mobile version Zip mein? | Main tables |
|---|---------------|-----------|-------|-----------|--------------------------|-------------|
| 1 | Landing Page | `landing_page` | `/` | `LandingPage` | Nahi (desktop) | — (static) |
| 2 | Owner Login | `owner_login` | `/login` | `OwnerLogin` | Nahi | `owner_profile` (RPC) |
| 3 | Dashboard Home | `dashboard_home` | `/dashboard` | `DashboardHome` | Nahi | `laptop_devices`, `reminders`, `prayer_times_cache`, `conversation_sessions`, `emotion_logs` |
| 4 | Live Voice Conversation | `live_voice_conversation` | `/talk` | `LiveVoiceConversation` | Nahi | `conversation_sessions`, `conversation_messages`, `laptop_commands`, `emotion_logs`, `memories` |
| 5 | Conversation History | `conversation_history` | `/history` | `ConversationHistory` | Nahi | `conversation_sessions`, `conversation_messages` |
| 6 | Emotions & Mood Center | `emotions_mood_center` | `/emotions` | `EmotionsMoodCenter` | Nahi | `emotion_settings`, `emotion_logs`, `assistant_settings` |
| 7 | Personality Studio | `personality_studio` | `/personality` | `PersonalityStudio` | Nahi | `persona_profiles` |
| 8 | Voice Studio | `voice_studio` | `/voice-studio` | `VoiceStudio` | Nahi | `voice_profiles`, `assistant_settings`, `provider_connections` |
| 9 | Laptop Control Center | `laptop_control_center` | `/control` | `LaptopControlCenter` | Nahi | `laptop_devices`, `laptop_commands` |
| 10 | File & App Finder | `file_app_finder` | `/files` | `FileAppFinder` | Nahi | `files_index`, `laptop_commands` |
| 11 | Automations & Routines | `automations_routines` | `/automations` | `AutomationsRoutines` | Nahi | `automations`, `automation_runs`, `command_catalog` |
| 12 | Reminders, Timers & Prayer Times | `reminders_timers_prayer_times` | `/reminders` | `RemindersTimersPrayerTimes` | Nahi | `reminders`, `prayer_settings`, `prayer_times_cache` |
| 13 | Memory Vault | `memory_vault` | `/memory` | `MemoryVault` | Nahi | `memories`, `assistant_settings` |
| 14 | Safety, Permissions & Activity Log | `safety_permissions_activity_log` | `/safety` | `SafetyPermissionsActivityLog` | Nahi | `permission_rules`, `ask_before_rules`, `activity_log`, `assistant_settings`, `laptop_commands` |
| 15 | Settings | `settings` | `/settings` | `Settings` | Nahi | `assistant_settings`, `provider_connections`, `owner_profile`, `persona_profiles` |

---

## 4. Per-Screen Wiring Notes

| Screen | Zip ke elements jo wire/badlen |
|--------|-------------------------------|
| Landing | Static. "Enter"/"Talk to Zara" → `/login`. External images → local asset. |
| Login | Pad digits → `verify_pin`; "Switch to Master Password" → email/password form (same card style); error shake, locked countdown. |
| Dashboard | "Good evening, Boss" time-based; mood chip latest log; telemetry (battery, CPU "Core Temp", volume, brightness) live; schedule = reminders+prayers; "Neural Core 4.2" jaisa decorative label hata dein ya app version dikhayein. |
| Live Voice | Orb states, transcript RTL, side panel actions, controls, States (Section 5). |
| History | Filter chips functional, export PDF/TXT dropdown, "Toggle Empty State" demo button **hata dein**. |
| Emotions | 8 cards sliders save; Preview Voice; Mirror Mode toggle; tone presets (3 buttons). |
| Personality | Sliders, nickname chips (Boss/Jaan/Sartaj/Sir), flirt segmented, sandbox. |
| Voice Studio | 4 voice cards ("Zara Sovereign/Noor/Mehru/Simran" = `voice_profiles.code`), sliders, accent cards, wake word block (setting save + mic meter), playground (Roman Urdu preview + English meaning generated), Export WAV. |
| Control | Hardware matrix real telemetry; Bluetooth/Wi-Fi speedtest/Dolby/True Tone/IP/DNS tiles **Later**: disable ya hide. |
| Files | Zip ke demo rows replace; Trash modal ("Trash 'file'?") real flow. |
| Automations | Builder (6 inputs) save; "Run Dry Test"; "Hardware Event Triggers" tab. |
| Reminders | Prayer card real times; "Sync Prayer Almanac"; add reminder modal. |
| Memory | Add memory modal (textarea + categories Personal / Code & Dev / Relationship → `personal`/`work_code`/`relationship`); "Purge All" 2-step modal. |
| Safety | Toggles, modes, ledger table, pagination, export CSV; "Sovereignty Guarantee", "99.8% Match Floor", "Zero Unsigned Invocations", "Trust Index" jaise **fake numbers hata dein** ya real metric (e.g. blocked/executed ratio) se badlein. |
| Settings | **API key "Show" fields hata dein** (status + Test Ping rahega); Whisper/Biometrics/Voiceprint disabled "Coming later"; mic list = browser devices. |

---

## 5. UI States (har screen par implement)

Loading = skeleton glass cards; Empty = icon + warm line (examples: "No memories yet. Say hello to Zara.", "Abhi koi routine nahi."); Error = inline card + retry; Offline laptop = badge + disabled controls; Awaiting confirmation = modal; Blocked = danger toast with reason; Panic = red banner; Success = toast 3s. Voice states: idle, connecting, listening (violet), thinking (shimmer), speaking (rose), muted, error.

---

## 6. Responsive Behavior

**Zip ki haqiqat:** 15 ki 15 screens **desktop-only** hain (fixed sidebar `w-72`, `ml-72`, koi mobile nav nahi). Isliye AI Studio ye add kare (design tokens wohi, naya look nahi):

| Breakpoint | Behavior |
|-----------|----------|
| **≥ 1024px (desktop)** | Bilkul Zip jaisa |
| **768–1023px (tablet)** | Sidebar hide → hamburger drawer; 8-column grid; cards 2-column |
| **< 768px (mobile)** | Sidebar → drawer + **bottom tab bar** (Dashboard, Talk, Control, Memory, Settings); single column; page padding `margin-mobile 1.25rem`; display type `display-lg-mobile`; tap targets ≥ 44px; modals → bottom sheet; wide tables/ledger horizontal scroll ya card list; voice orb bottom zone par floating "puck" |

Main `ml-72` ko sirf `lg:ml-72` karein.

---

## 7. Zip → React Conversion: Kya Same, Kya Wire

**Same rakhein:** Tailwind config, class names, markup structure, spacing, fonts, glass/glow CSS, animations, icon names, sab user-visible copy (siwae "hata dein" wali cheezon ke).
**Wire karein:** Supabase data, auth guards, forms/validation, Realtime, live voice, safety flows, React Router links, toasts, modals.
**Kabhi:** `dangerouslySetInnerHTML`, inline secrets, CDN Tailwind script, external image URLs.

---

## 8. Images & Icons Direction

- Zip mein `googleusercontent.com` ki images (avatar, **logo orb — screenshot mein load nahi hui, sirf alt text dikhta hai**) hain. Logo ko CSS/SVG glowing orb (rose→violet gradient) se banayen; avatar ko initials ("B") circle se.
- Landing ke hero/feature visuals: CSS orb + waveform, koi stock photo nahi.
- Icons: Material Symbols (Zip jaisa). Koi extra icon library na jorein.
- Images baad mein "Images workflow" (Master Prompt Section 9) se aayengi; abhi placeholders ki jagah wo hi CSS/SVG rahegi.

---

## 9. Accessibility

Contrast: text `#F4F1FF` on `#13121C` (AA+); secondary `#A8A3C7` sirf non-critical. Visible focus ring (`#7C5CFF` 3px). Sab icon-only buttons par `aria-label`. Toggles `role="switch"`. Modals focus trap + Esc. Voice status `aria-live="polite"`. Urdu blocks `dir="rtl" lang="ur"`. Keyboard shortcuts (`Ctrl+Space` = talk, `⌘/Ctrl+F` = files search) discoverable. Reduced motion respect. Color ke saath text/icon bhi (risk badges).

---

## 10. Zip Mein Adhoori / Inconsistent Cheezon Ki List (AI Studio kya kare)

| # | Masla | Kya karna hai |
|---|-------|---------------|
| 1 | Mobile/tablet versions nahi, sidebar fixed | Section 6 ke mutabiq responsive collapse |
| 2 | Logo image broken (external link) | CSS/SVG orb |
| 3 | Sab nav links `#` | React Router links (route table Section 3) |
| 4 | Laptop data mixed: MacBook Pro M3/macOS/Zsh (zyada), kuch jagah Windows/Dell | Data asal `laptop_devices` se; demo strings hata dein |
| 5 | Top bar mein "5G" | Laptop Wi-Fi status se replace |
| 6 | Decorative/fake metrics (Neural Core 4.2, 99.8% Match, AES-256, Zero Unsigned, Affection Index, Spotify Synced) | Real data se bind, warna hide |
| 7 | Settings mein API key fields + "Show" | Hata dein; provider status + Test Ping |
| 8 | History mein "Toggle Empty State" demo button | Hata dein |
| 9 | Zip mein Login/Landing ke alawa auth states (wrong PIN, locked) ka poora visual nahi | Same glass card/danger color se banayen |
| 10 | Confirm modal (PIN/voice) ka alag screen nahi | Trash/Purge modal ke style mein banayen |
| 11 | Windows/Touch ID, Voiceprint, Whisper local, wake-word, Bluetooth/Wi-Fi/clipboard | Disabled + "Coming later" |
| 12 | `DESIGN.md` ke kuch tokens Tailwind config mein nahi | Section 1 ke mutabiq add karein |
| 13 | Design system folder ka naam `luminescent_companion`, brand "Zara" | Brand/UI mein "Zara" hi rahe |
