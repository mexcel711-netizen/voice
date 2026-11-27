# 00_Stitch_UI_Prompts.md — Zara AI Voice Assistant

> Ye file sirf **Google Stitch** ke liye hai (6 Project files ka hissa nahi). Neeche ke prompts English mein hain taake Stitch behtar samjhe.

---

## A. Project Overview

| Item | Detail |
|------|--------|
| **Project Name** | Zara — Personal AI Voice Assistant (naam baad mein badla ja sakta hai) |
| **Website Type** | Landing page + personal control dashboard |
| **Purpose** | Owner ka apna AI voice assistant control karna: female realistic Urdu voice, emotions, playful personality, poore laptop ka control, memory, reminders, safety controls |
| **Target Users** | **Sirf owner (single user).** Koi Admin/Public role nahi. |
| **Roles** | `Owner` (login ke baad sab kuch) + `Visitor` (sirf Landing Page dekh sakta hai) |
| **Language / Direction** | UI English (LTR). Urdu text (transcripts, voice replies) **RTL** mein Nastaliq font ke saath dikhe. Roman Urdu bhi support ho. |
| **Platforms** | Mobile + Desktop dono |

**Assumptions (galat ho to batayen):**
- Assistant ka naam **Zara** rakha hai.
- Personality **romantic aur playful** hai (flirty, caring), explicit content nahi.
- Saari screens sirf owner ke liye hain, isliye Admin panel nahi banaya.
- Landing page bhi sirf apne liye "showcase + entry point" hai.

---

## B. Global Design Direction (har batch mein same)

```
GLOBAL DESIGN DIRECTION (apply to every screen):
- Style: Futuristic, premium, soft-glow "AI companion" look. Dark theme by default. Glassmorphism cards (subtle blur, 1px translucent border), smooth gradients, gentle glow around the voice orb. Feminine, elegant, warm, not cold or corporate.
- Color palette:
  Background Deep: #0B0A14
  Surface / Card: #161426
  Surface Elevated: #1F1C36
  Border: #2E2A4D
  Primary (Rose Magenta): #E94B9A
  Secondary (Violet): #7C5CFF
  Accent (Soft Gold): #F5C26B
  Success: #3DDC97
  Warning: #FFB547
  Danger: #FF5C6C
  Text Primary: #F4F1FF
  Text Secondary: #A8A3C7
  Main gradient: linear 135deg from #E94B9A to #7C5CFF
- Typography: Headings "Plus Jakarta Sans" (bold/semi-bold). Body "Inter". Urdu text "Noto Nastaliq Urdu" (RTL, generous line height). Base 16px, scale 12/14/16/20/24/32/48.
- Buttons: Pill shape, 12px vertical padding. Primary = gradient fill with soft glow; Secondary = translucent outline; Danger = solid #FF5C6C.
- Cards: 20px radius, glass surface, soft shadow 0 8px 32px rgba(0,0,0,0.35).
- Forms: 14px radius inputs, dark surface, focus ring in #7C5CFF, clear labels, helper text.
- Modals: Centered on desktop, bottom sheet on mobile, blurred backdrop.
- Icons: Rounded line icons, 1.75px stroke (Lucide/Phosphor style).
- Spacing: 4px base grid; section gaps 24-48px; page padding 16px mobile, 32px desktop.
- Motion hints: Breathing glow on voice orb, soft waveform animation, 200ms ease transitions.
- Navigation: Mobile = bottom tab bar (Home, Talk, Control, Memory, Settings) + top bar. Desktop = left sidebar with icons + labels, top bar with mic status and owner avatar.
- Tone: Warm, caring, slightly playful microcopy (example: "Welcome back, I missed you.").
- Realistic content only. No lorem ipsum.
- Create BOTH a Mobile version and a Desktop version of every screen with identical content and style.
```

---

## C. Total Screens Table

**Total screens: 15** (har screen Mobile + Desktop = 30 designs)

| # | Screen Name | Role | Purpose | Batch |
|---|-------------|------|---------|-------|
| 1 | Landing Page | Visitor / Owner | Zara ka showcase, features, "Enter" button | 1 |
| 2 | Owner Login | Owner | PIN / password / biometric se private entry | 1 |
| 3 | Dashboard Home | Owner | Voice orb, mood, quick actions, laptop status, today's reminders | 1 |
| 4 | Live Voice Conversation | Owner | Full-screen voice chat, waveform, live Urdu transcript, emotion tag | 1 |
| 5 | Conversation History | Owner | Purani baatein search, filter, replay | 1 |
| 6 | Emotions & Mood Center | Owner | Zara ka current mood, emotion intensity sliders, mood detection log | 2 |
| 7 | Personality Studio | Owner | Personality traits, flirt level, tone, nickname, system prompt preview | 2 |
| 8 | Voice Studio | Owner | Female Urdu voice select, speed/pitch/warmth, test voice | 2 |
| 9 | Laptop Control Center | Owner | Apps, volume, brightness, screenshot, media, power quick controls | 2 |
| 10 | File & App Finder | Owner | Voice/text se files aur apps dhoondna, open, rename | 2 |
| 11 | Automations & Routines | Owner | Custom voice commands aur daily routines | 3 |
| 12 | Reminders, Timers & Prayer Times | Owner | Alarms, timers, reminders, namaz ke auqaat | 3 |
| 13 | Memory Vault | Owner | Zara ko jo yaad hai (pasand, yaadein), edit/delete | 3 |
| 14 | Safety, Permissions & Activity Log | Owner | Confirmations, mic switch, laptop permissions, action log | 3 |
| 15 | Settings | Owner | Wake word, API keys, theme, language, backup, logout | 3 |

---

## D. Batch-wise Prompts

### Batch 1 — Screens 1 to 5

```
Design 5 screens for "Zara", a personal AI voice assistant web app. Create each screen in BOTH Mobile and Desktop versions.

[PASTE GLOBAL DESIGN DIRECTION FROM SECTION B HERE]

SCREEN 1: Landing Page
- Sticky top bar: Zara logo (glowing orb icon) left, links (Features, Voice, Safety) center, "Enter" gradient button right. Mobile: logo + hamburger + Enter.
- Hero: big headline "Meet Zara. Your voice. Your laptop. Your companion." Subtext: "A realistic Urdu-speaking AI who feels, remembers and controls your laptop by voice." Large glowing voice orb with animated waveform. Buttons: "Talk to Zara" (primary) and "See Features" (secondary).
- Features grid (6 cards): Realistic Urdu Voice, Real Emotions, Playful Personality, Full Laptop Control, Memory That Remembers You, Safety First.
- Sample conversation preview card showing a short chat bubble exchange in Urdu (RTL) and English with emotion tags like "Happy" and "Teasing".
- Safety section: "Only you can command Zara" with mic switch, confirmation and activity log illustrations.
- Final CTA band and a minimal footer ("Made for one person. Made with care.").
- Navigation: "Enter" and "Talk to Zara" lead to Screen 2 (Owner Login).

SCREEN 2: Owner Login
- Centered glass card with glowing orb at top, title "Welcome back", subtitle "Only the owner can enter."
- 6-digit PIN pad (mobile friendly large keys) plus password field alternative toggle, "Use fingerprint / Face unlock" button, "Forgot PIN?" link.
- States: default, wrong PIN (error shake + red helper text), locked after 5 attempts (countdown), loading.
- Desktop: two-column, left side decorative orb artwork with tagline, right side the login card.
- Navigation: successful login leads to Screen 3 (Dashboard Home).

SCREEN 3: Dashboard Home
- Greeting: "Good evening, Boss. I missed you." with date and Zara's current mood chip (Happy, Playful).
- Big central voice orb with "Tap to talk" and wake-word hint "Say: Hey Zara".
- Quick action cards (2x2 mobile, 4 across desktop): Open App, Take Screenshot, Play Music, Set Reminder.
- Laptop status card: Online, battery 82%, volume 40%, brightness 70%, mic ON.
- Today's reminders list (3 items, e.g. "Zuhr 12:30 PM", "Call Ahmed 4:00 PM", "Submit report 9:00 PM").
- Recent conversations (3 items with emotion tags).
- Desktop: left sidebar (Dashboard, Talk, Control, Files, Automations, Reminders, Memory, Emotions, Personality, Voice, Safety, Settings). Mobile: bottom tab bar.
- Navigation: orb opens Screen 4; quick actions open Screen 9; reminders open Screen 12; "View all" conversations opens Screen 5.

SCREEN 4: Live Voice Conversation
- Full-screen immersive view with large pulsing orb in center that reacts to speech, animated waveform beneath.
- Top: Zara status ("Listening...", "Speaking...") and live emotion chip (e.g. "Amused").
- Live transcript area: user bubble and Zara bubble, Urdu in RTL Nastaliq, with English translation toggle.
- Bottom controls: Mute mic, big Talk/Stop button, Interrupt, Text input fallback, End session.
- Side panel (desktop) / swipe-up sheet (mobile): current mood meter, actions Zara performed ("Opened Chrome", "Volume set to 30%").
- States: idle, listening, thinking (shimmer), speaking, mic muted, connection error with retry.
- Navigation: End session returns to Screen 3; History icon opens Screen 5.

SCREEN 5: Conversation History
- Search bar with filters: date, emotion, topic, laptop actions only.
- List of sessions grouped by day (Today, Yesterday, Last week), each showing title, snippet, duration, emotion tags, small waveform.
- Selecting a session opens detail view: full transcript, audio replay with scrubber, actions performed, buttons "Continue this chat", "Delete", "Export".
- Empty state: "No memories yet. Say hello to Zara."
- Desktop: list left, detail right (split view). Mobile: list then detail page.
- Navigation: "Continue this chat" opens Screen 4.
```

### Batch 2 — Screens 6 to 10

```
Design 5 screens for "Zara", a personal AI voice assistant web app. Create each screen in BOTH Mobile and Desktop versions. Keep exact same design system, navigation (sidebar/bottom tabs) and style as Batch 1.

[PASTE GLOBAL DESIGN DIRECTION FROM SECTION B HERE]

SCREEN 6: Emotions & Mood Center
- Hero card: Zara's current mood with expressive orb color change and label (e.g. "Playful 78%").
- Emotion palette grid (8 cards): Happy, Sad, Angry, Surprised, Shy, Laughing, Caring, Teasing. Each has an intensity slider (0-100) and a "Preview voice" play button.
- "Mirror my mood" toggle: Zara adapts to the owner's tone (comforting when sad, joking when happy).
- Mood timeline chart (last 7 days) of owner's detected mood and Zara's responses.
- Recent mood detections list with timestamps.
- Navigation: opens from sidebar/tab "Emotions"; "Preview voice" plays inline.

SCREEN 7: Personality Studio
- Persona header card: avatar orb, name "Zara", nickname for owner ("Boss"), editable.
- Trait sliders: Playfulness, Romance, Teasing, Caring, Seriousness, Humor, Shyness (0-100).
- Flirt level selector (Off, Light, Playful, Romantic) with note "Romantic and sweet, never explicit."
- Language style chips: Urdu, Roman Urdu, English mix. Formality toggle.
- Custom instructions textarea, and a "System prompt preview" collapsible code-style panel.
- Live preview chat box where owner types a message and sees a sample Zara reply in Urdu RTL.
- Buttons: Save, Reset to default, Test in voice (opens Screen 4).

SCREEN 8: Voice Studio
- Voice selector cards (4-5 female Urdu voices) with name, short description ("Warm and soft", "Bright and cheerful"), play sample button, selected state with gradient border.
- Sliders: Speed, Pitch, Warmth, Expressiveness, Pause length.
- Accent options: Standard Urdu, Punjabi-touch Urdu, Urdu-English mix.
- Wake word section: "Hey Zara" with sensitivity slider and test mic button.
- Big "Test voice" box: type text, press play, shows animated waveform.
- Provider info chip: "Gemini Live / ElevenLabs" with status dot.

SCREEN 9: Laptop Control Center
- Device status header: laptop name, OS, connection status (Connected), battery, Wi-Fi.
- Control tiles: Volume slider, Brightness slider, Mute, Wi-Fi, Bluetooth, Lock Screen, Sleep, Screenshot, Clipboard, Do Not Disturb.
- Media control card: now playing, play/pause/next, YouTube quick search.
- Running apps list with Close buttons, "Open app" input with voice mic button.
- Danger zone (red outline): Shutdown, Restart, Delete files - each requires a confirmation modal ("Are you sure?").
- Voice command hint chips: "Say: Volume 30 percent", "Say: Open Chrome".
- Navigation: "Find files" opens Screen 10; confirmation modals appear for danger actions.

SCREEN 10: File & App Finder
- Big search bar with mic button: "Find a file or app by name or voice".
- Tabs: Files, Apps, Recent, Favorites. Filter chips: Documents, Images, Videos, Downloads.
- Results list/grid with file icon, name, path, size, modified date; actions: Open, Reveal in folder, Rename, Favorite. Delete requires confirmation modal.
- Right preview panel (desktop) / bottom sheet (mobile) showing file details.
- States: loading, no results ("Zara couldn't find that. Try another name?"), permission needed.
```

### Batch 3 — Screens 11 to 15

```
Design 5 screens for "Zara", a personal AI voice assistant web app. Create each screen in BOTH Mobile and Desktop versions. Keep exact same design system, navigation and style as Batch 1 and 2.

[PASTE GLOBAL DESIGN DIRECTION FROM SECTION B HERE]

SCREEN 11: Automations & Routines
- Tabs: Custom Commands, Routines.
- Custom command cards: trigger phrase (e.g. "Good morning Zara") and action chain (Open Chrome, Play news, Read weather) with toggle on/off, Edit, Delete.
- Routines: time-based cards like "Morning routine 7:00 AM", "Study mode", "Sleep mode".
- "Create automation" button opens builder modal: Trigger (voice phrase / time / event), Actions (add step list, drag to reorder), Confirmation required toggle, Save.
- Empty state: "No routines yet. Teach Zara something new."

SCREEN 12: Reminders, Timers & Prayer Times
- Top: Prayer times card for the day (Fajr, Zuhr, Asr, Maghrib, Isha) with next prayer countdown and azaan reminder toggle.
- Tabs: Reminders, Timers, Alarms.
- Reminder list with title, time, repeat, voice-created badge, complete checkbox. "Add reminder" floating button opens modal (title, date/time, repeat, how Zara should remind: voice / notification).
- Active timer cards with circular countdown progress.
- Empty and completed states.

SCREEN 13: Memory Vault
- Intro text: "Things Zara remembers about you."
- Category filter chips: Likes, Dislikes, People, Important Dates, Habits, Notes.
- Memory cards with text (e.g. "Loves chai with less sugar", "Brother's birthday: 14 March"), source ("Learned from chat on Mon"), Edit and Delete icons.
- "Add memory" button, search bar, and "Forget everything" danger button with confirmation modal.
- Privacy toggle: "Let Zara learn automatically from conversations."
- Empty state: "Zara hasn't learned anything yet."

SCREEN 14: Safety, Permissions & Activity Log
- Master switches at top: Microphone ON/OFF (large toggle), "Only respond to my voice" (voice lock), Panic button "Stop everything".
- Permissions list with toggles: Files access, Apps control, Browser, System settings, Screen viewing, Send messages/email. Each with risk label (Low/Medium/High).
- "Ask before doing" rules: Delete files, Send email/message, Payments, Shutdown (checked by default).
- Activity log table (desktop) / card list (mobile): time, action, status (Done/Blocked/Asked), with filters and export.
- Alert card for blocked suspicious actions.

SCREEN 15: Settings
- Sections: Account (change PIN/password, biometric), Assistant (wake word, language, startup behavior), Connections (Gemini API key, ElevenLabs key, status badges, masked key fields with Show/Test buttons), Appearance (dark/light, accent color), Data (backup, export, delete all), About.
- Logout button, app version.
- Success toast and error states for API key test.
- Navigation: Logout returns to Screen 1.
```

---

## E. Istemal Ki Hidayat (Mere Liye)

**Batches ki tarteeb:** Batch 1 → Batch 2 → Batch 3.

1. Google Stitch kholein aur naya project banayen: `Zara UI`.
2. Batch 1 ka prompt copy karein. Jahan `[PASTE GLOBAL DESIGN DIRECTION...]` likha hai, wahan Section B ka poora block paste karein.
3. **Mobile aur Desktop dono banwane ke liye:** Stitch mein device type select karne ka option hota hai (Mobile / Web). Pehle **Mobile** select kar ke batch generate karein, phir **Desktop (Web)** select kar ke wohi prompt dobara dein. Stitch ka interface badalta rehta hai, agar option na mile to mujhe batayen.
4. **Screens ke naam** bilkul Section C ki table jaise rakhein (e.g. "Dashboard Home"), kyunke baad mein routes yahi naam use karenge.
5. **Consistency tips:**
   - Har batch mein Global Design Direction zaroor paste karein.
   - Agar kisi screen ka look alag lage to usi chat mein likhein: "Match the exact style, colors and sidebar of Dashboard Home."
   - Sab screens mein sidebar/bottom tabs ke items same rakhein.
6. Har batch ke baad check karein: colors, fonts, navigation aur Urdu RTL text sahi hain ya nahi. Issue ho to mujhse chhota fix prompt le lein.
7. Jab saari 15 screens (Mobile + Desktop) ban jayen, to Stitch se **UI code ka Zip export/download** karein (Export/Download code option se). Zip mujhe review ke liye dein.
8. Mere "sab theek hai" kehne ke baad Zip Google Drive mein `Zara_UI_Stitch.zip` naam se upload karein.

---

**Agla step:** Stitch se UI bana kar Zip mujhe dein, phir main review karunga aur uske baad 6 Project files banaunga.
