# 05_Backend_Schema.md — Zara Backend Schema (Supabase / PostgreSQL)

> **Planning document.** Isse database create nahi hota. AI Studio is ke mutabiq Supabase-ready code likhta hai; asal tables, RLS, functions aur buckets baad mein **ChatGPT + Supabase plugin** isi file ke mutabiq banayega.
> **Table, column, function aur enum values yahan se exact copy honi chahiyen** (01–04 aur 06 files aur frontend `src/types/db.ts` isi se match karein).

---

## 1. Overview

- **Single-owner system.** Sirf 2 login identities: `owner` (browser) aur `agent` (laptop par chalne wala Zara Local Agent). Signups **disabled**.
- Role Supabase Auth ke `app_metadata.role` mein hota hai (`owner` ya `agent`). `app_metadata` sirf server-side set hota hai, user khud badal nahi sakta.
- **Har table par RLS enabled.** `service_role` key kabhi frontend, agent ya GitHub repo mein nahi.
- Naming: `snake_case`, tables plural. Time columns `timestamptz`. IDs `uuid` (`gen_random_uuid()`), siwae `activity_log.id` (`bigint identity`).
- Extensions: `pgcrypto` (hashing/PIN), `pg_cron` (optional cleanup).

### Common Columns
Neeche jahan table ke naam ke saath **(C)** likha hai us mein ye columns hote hain:

| Column | Type | Default / Constraint |
|--------|------|----------------------|
| `id` | uuid | PK, `gen_random_uuid()` |
| `owner_id` | uuid | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE, default `public.current_owner_id()` |
| `created_at` | timestamptz | NOT NULL, `now()` |

**(U)** = table mein `updated_at timestamptz NOT NULL default now()` bhi hai (trigger `set_updated_at`).

---

## 2. Roles & Helper Functions

| Function | Returns | Logic |
|----------|---------|-------|
| `is_owner()` | boolean | `coalesce(auth.jwt()->'app_metadata'->>'role','') = 'owner'` |
| `is_agent()` | boolean | `coalesce(auth.jwt()->'app_metadata'->>'role','') = 'agent'` |
| `current_owner_id()` | uuid | `select id from public.owner_profile limit 1` (security definer) |
| `set_updated_at()` | trigger | `new.updated_at = now()` |

---

## 3. Tables

### 3.1 `owner_profile` (U)
PK `id` = `auth.users.id` (owner). Sirf 1 row.

| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `id` | uuid | PK, FK → `auth.users(id)` ON DELETE CASCADE | |
| `display_name` | text | NOT NULL, `'Boss'` | Top bar "Boss (Owner)" |
| `pin_hash` | text | NULL | bcrypt via `crypt(pin, gen_salt('bf'))`; frontend ko kabhi return nahi |
| `pin_set_at` | timestamptz | NULL | |
| `pin_failed_attempts` | smallint | NOT NULL, `0` | |
| `pin_locked_until` | timestamptz | NULL | 5 galat attempts par 15 min lock |
| `biometrics_enabled` | boolean | NOT NULL, `false` | UI-only (Later) |
| `voiceprint_status` | text | NOT NULL, `'not_set'` | CHECK in (`not_set`,`calibrated`) — Later |
| `voiceprint_calibrated_at` | timestamptz | NULL | Later |
| `created_at` | timestamptz | NOT NULL, `now()` | |

### 3.2 `assistant_settings` (U)
PK `owner_id`. Sirf 1 row.

| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `owner_id` | uuid | PK, FK → `auth.users(id)` | |
| `wake_phrase_mode` | text | NOT NULL, `'primary'` | CHECK in (`primary`,`swift`,`native_urdu`) |
| `wake_sensitivity` | smallint | NOT NULL, `82` | 0–100 |
| `language_mode` | text | NOT NULL, `'urdu_english'` | CHECK in (`urdu`,`english`,`urdu_english`) |
| `mic_device_id` | text | NULL | Browser `deviceId` |
| `mic_enabled` | boolean | NOT NULL, `true` | Master mic switch (Safety screen + sidebar "Mute Mic") |
| `voice_lock_enabled` | boolean | NOT NULL, `false` | Voiceprint — Later |
| `safety_level` | text | NOT NULL, `'prompt_on_risk'` | CHECK in (`relaxed`,`prompt_on_risk`,`restricted`) |
| `panic_active` | boolean | NOT NULL, `false` | Kill switch state |
| `live_model` | text | NOT NULL, `''` | Gemini Live model id (server-validated) |
| `sampling_temperature` | numeric(3,2) | NOT NULL, `0.70` | 0.00–1.00 |
| `tone_preset` | text | NOT NULL, `'natural_auto'` | CHECK in (`natural_auto`,`urdu_poetic`,`executive`) |
| `mirror_mode_enabled` | boolean | NOT NULL, `true` | Emotions screen "Mirror my mood" |
| `auto_learn_enabled` | boolean | NOT NULL, `true` | Memory auto-learning |
| `store_audio` | boolean | NOT NULL, `false` | Audio replay ke liye audio save karna |
| `auto_lock_minutes` | smallint | NOT NULL, `15` | App-lock timeout |
| `theme_mode` | text | NOT NULL, `'companion_night'` | CHECK in (`companion_night`) |
| `accent_tint` | text | NOT NULL, `'#E94B9A'` | hex |
| `urdu_font` | text | NOT NULL, `'Noto Nastaliq Urdu'` | |
| `created_at` | timestamptz | NOT NULL, `now()` | |

### 3.3 `provider_connections` (C)(U)
API keys **yahan store nahi hotin** (Cloudflare secrets mein). Sirf status.

| Column | Type | Constraint | Notes |
|--------|------|------------|-------|
| `provider` | text | NOT NULL, CHECK in (`gemini`,`elevenlabs`,`whisper_local`) | UNIQUE (`owner_id`,`provider`) |
| `status` | text | NOT NULL, `'unknown'` | CHECK in (`unknown`,`connected`,`error`,`disabled`) |
| `last_tested_at` | timestamptz | NULL | |
| `last_latency_ms` | integer | NULL | |
| `last_error` | text | NULL | |

### 3.4 `persona_profiles` (C)(U)
Personality Studio. Abhi 1 active row.

| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `assistant_name` | text | NOT NULL, `'Zara'` | |
| `owner_nickname` | text | NOT NULL, `'Boss'` | options: Boss, Jaan, Sartaj, Sir, custom |
| `formality` | text | NOT NULL, `'casual'` | CHECK in (`formal_polite`,`casual`,`mixed`) |
| `playfulness` | smallint | NOT NULL, `70` | 0–100 (sab traits 0–100 CHECK) |
| `romance` | smallint | NOT NULL, `60` | |
| `teasing` | smallint | NOT NULL, `60` | |
| `caring` | smallint | NOT NULL, `80` | |
| `seriousness` | smallint | NOT NULL, `30` | |
| `humor` | smallint | NOT NULL, `70` | |
| `shyness` | smallint | NOT NULL, `30` | |
| `flirt_level` | text | NOT NULL, `'playful'` | CHECK in (`off`,`light`,`playful`,`romantic`) — **kabhi explicit nahi** |
| `language_style` | text | NOT NULL, `'roman_urdu_mix'` | CHECK in (`urdu_script`,`roman_urdu_mix`,`english`) |
| `regional_dialect` | text | NOT NULL, `'standard'` | CHECK in (`standard`,`urban_hybrid`,`lahori`,`karachi`) |
| `custom_instructions` | text | NOT NULL, `''` | max 4000 chars |
| `directive_tags` | text[] | NOT NULL, `'{}'` | e.g. "Late night coding", "Tareef karo" |
| `is_active` | boolean | NOT NULL, `true` | partial UNIQUE index: ek hi active per owner |

### 3.5 `voice_profiles` (C)(U)
Voice Studio.

| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `code` | text | NOT NULL | `sovereign`,`noor`,`mehru`,`simran`; UNIQUE (`owner_id`,`code`) |
| `display_name` | text | NOT NULL | "Zara Sovereign" etc. |
| `description` | text | NOT NULL, `''` | |
| `provider` | text | NOT NULL, `'gemini'` | CHECK in (`gemini`,`elevenlabs`) |
| `provider_voice_id` | text | NOT NULL, `''` | Provider ki asal voice id (build ke baad set hogi) |
| `is_selected` | boolean | NOT NULL, `false` | partial UNIQUE: ek selected per owner |
| `speed` | numeric(3,2) | NOT NULL, `1.00` | 0.75–1.50 |
| `pitch_semitones` | numeric(3,1) | NOT NULL, `0` | -6 to +6 |
| `warmth` | smallint | NOT NULL, `80` | 0–100 |
| `expressiveness` | smallint | NOT NULL, `80` | 0–100 |
| `pause_seconds` | numeric(3,2) | NOT NULL, `0.40` | 0.10–1.00 |
| `accent_mode` | text | NOT NULL, `'standard'` | CHECK in (`standard`,`urban_hybrid`,`lahori`,`karachi`) |

### 3.6 `emotion_settings` (C)(U)
Emotions screen ke 8 cards. UNIQUE (`owner_id`,`emotion`).

| Column | Type | Constraint / Default |
|--------|------|----------------------|
| `emotion` | text | NOT NULL, CHECK in (`happy`,`sad`,`angry`,`surprised`,`shy`,`laughing`,`caring`,`teasing`) |
| `intensity` | smallint | NOT NULL, `50`, 0–100 |

### 3.7 `emotion_logs` (C)
| Column | Type | Constraint | Notes |
|--------|------|------------|-------|
| `session_id` | uuid | NULL, FK → `conversation_sessions(id)` ON DELETE SET NULL | |
| `detected_user_mood` | text | NULL | same 8 values + `neutral`, `tired`, `stressed` |
| `zara_emotion` | text | NOT NULL | same list as `emotion_settings.emotion` |
| `intensity` | smallint | NOT NULL, 0–100 | |
| `note` | text | NULL | |

### 3.8 `conversation_sessions` (C)(U)
| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `title` | text | NOT NULL, `'New conversation'` | AI se auto-title |
| `summary` | text | NULL | |
| `status` | text | NOT NULL, `'active'` | CHECK in (`active`,`ended`,`error`) |
| `started_at` | timestamptz | NOT NULL, `now()` | |
| `ended_at` | timestamptz | NULL | |
| `duration_seconds` | integer | NULL | |
| `primary_emotion` | text | NULL | |
| `emotion_tags` | text[] | NOT NULL, `'{}'` | |
| `has_laptop_actions` | boolean | NOT NULL, `false` | "Laptop Actions Only" filter |
| `language` | text | NOT NULL, `'urdu_english'` | |
| `audio_path` | text | NULL | Storage path (sirf `store_audio=true` par) |

### 3.9 `conversation_messages` (C)
| Column | Type | Constraint | Notes |
|--------|------|------------|-------|
| `session_id` | uuid | NOT NULL, FK → `conversation_sessions(id)` ON DELETE CASCADE | |
| `seq` | integer | NOT NULL | UNIQUE (`session_id`,`seq`) |
| `role` | text | NOT NULL, CHECK in (`user`,`assistant`,`system`,`tool`) | |
| `content_text` | text | NOT NULL | Original (Urdu script ya Roman Urdu) |
| `content_roman` | text | NULL | Roman Urdu preview |
| `content_en` | text | NULL | English translation |
| `emotion` | text | NULL | |
| `command_id` | uuid | NULL, FK → `laptop_commands(id)` ON DELETE SET NULL | tool message ke liye |
| `audio_path` | text | NULL | |

### 3.10 `memories` (C)(U)
| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `content` | text | NOT NULL | max 1000 chars |
| `category` | text | NOT NULL, `'personal'` | CHECK in (`personal`,`work_code`,`relationship`,`dates`,`habits`,`other`) |
| `memory_type` | text | NOT NULL, `'semantic'` | CHECK in (`episodic`,`semantic`) |
| `source` | text | NOT NULL, `'conversation'` | CHECK in (`conversation`,`manual`) |
| `source_session_id` | uuid | NULL, FK → `conversation_sessions(id)` ON DELETE SET NULL | |
| `importance` | smallint | NOT NULL, `3` | 1–5 |
| `is_pinned` | boolean | NOT NULL, `false` | |

### 3.11 `automations` (C)(U)
| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `kind` | text | NOT NULL, CHECK in (`voice_command`,`routine`,`hardware_trigger`) | UI tabs ke 3 groups |
| `name` | text | NOT NULL | |
| `description` | text | NOT NULL, `''` | |
| `trigger_phrase` | text | NULL | voice_command ke liye |
| `schedule_time` | time | NULL | routine |
| `schedule_days` | smallint[] | NOT NULL, `'{}'` | 0=Sun…6=Sat |
| `trigger_event` | text | NULL | hardware_trigger, e.g. `battery_low`,`charger_connected`,`app_opened` |
| `steps` | jsonb | NOT NULL, `'[]'` | `[{"order":1,"command_type":"open_app","params":{"name":"Chrome"}}]` — `command_type` `command_catalog` se |
| `requires_confirmation` | boolean | NOT NULL, `false` | |
| `is_enabled` | boolean | NOT NULL, `true` | |
| `last_run_at` | timestamptz | NULL | |
| `run_count` | integer | NOT NULL, `0` | |

### 3.12 `automation_runs` (C)
| Column | Type | Constraint | Notes |
|--------|------|------------|-------|
| `automation_id` | uuid | NOT NULL, FK → `automations(id)` ON DELETE CASCADE | |
| `mode` | text | NOT NULL, `'live'` | CHECK in (`live`,`dry_run`) |
| `status` | text | NOT NULL | CHECK in (`success`,`failed`,`blocked`,`partial`) |
| `details` | jsonb | NOT NULL, `'{}'` | |
| `finished_at` | timestamptz | NULL | |

### 3.13 `reminders` (C)(U)
| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `kind` | text | NOT NULL, `'reminder'` | CHECK in (`reminder`,`timer`,`alarm`) |
| `title` | text | NOT NULL | |
| `notes` | text | NOT NULL, `''` | |
| `due_at` | timestamptz | NOT NULL | Timer ke liye end time |
| `duration_seconds` | integer | NULL | sirf `timer` |
| `repeat_rule` | text | NOT NULL, `'none'` | CHECK in (`none`,`daily`,`weekdays`,`weekly`) |
| `repeat_days` | smallint[] | NOT NULL, `'{}'` | |
| `category` | text | NOT NULL, `'personal_health'` | CHECK in (`work_code`,`personal_health`,`other`) |
| `notify_mode` | text | NOT NULL, `'both'` | CHECK in (`voice`,`notification`,`both`) |
| `voice_created` | boolean | NOT NULL, `false` | |
| `is_completed` | boolean | NOT NULL, `false` | |
| `completed_at` | timestamptz | NULL | |

### 3.14 `prayer_settings` (U)
PK `owner_id`. Sirf 1 row.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `owner_id` | uuid | PK | |
| `city` | text | NULL | Owner first run par chunta hai |
| `country` | text | NULL | |
| `latitude` | numeric(8,5) | NULL | |
| `longitude` | numeric(8,5) | NULL | |
| `timezone` | text | NULL | IANA |
| `calculation_method` | text | `'karachi'` | CHECK in (`karachi`,`mwl`,`isna`,`egypt`,`makkah`) |
| `asr_method` | text | `'standard'` | CHECK in (`standard`,`hanafi`) |
| `alert_fajr`, `alert_zuhr`, `alert_asr`, `alert_maghrib`, `alert_isha` | boolean | `true` | Per-prayer reminder |
| `azaan_audio_enabled` | boolean | `false` | |
| `created_at` | timestamptz | `now()` | |

### 3.15 `prayer_times_cache` (C)
UNIQUE (`owner_id`,`date`).

| Column | Type | Notes |
|--------|------|-------|
| `date` | date | NOT NULL |
| `fajr`, `sunrise`, `zuhr`, `asr`, `maghrib`, `isha` | time | NOT NULL (local time) |
| `source` | text | `'calculated'` ya `'api'` |
| `fetched_at` | timestamptz | `now()` |

### 3.16 `laptop_devices` (C)(U)
| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `agent_user_id` | uuid | NOT NULL, UNIQUE, FK → `auth.users(id)` | Agent ki Auth identity |
| `device_name` | text | NOT NULL | |
| `os_name` | text | NOT NULL | `windows`/`macos`/`linux` |
| `os_version` | text | NULL | |
| `model` | text | NULL | |
| `agent_version` | text | NULL | |
| `last_heartbeat_at` | timestamptz | NULL | Online = heartbeat < 60s purana |
| `telemetry` | jsonb | NOT NULL, `'{}'` | keys: `battery_percent`,`is_charging`,`cpu_percent`,`temperature_c`,`wifi_ssid`,`wifi_mbps`,`volume_percent`,`is_muted`,`brightness_percent`,`night_shift_on`,`uptime_seconds`,`mic_state`,`running_apps` |
| `is_primary` | boolean | NOT NULL, `true` | |

### 3.17 `command_catalog` (read-only seed table)
PK `command_type`. Koi `owner_id` nahi; owner/agent sirf SELECT.

| Column | Type | Notes |
|--------|------|-------|
| `command_type` | text | PK |
| `display_action` | text | Activity log label, e.g. `System.Brightness` |
| `permission_key` | text | FK-like → `permission_rules.permission_key` |
| `default_risk` | text | CHECK in (`low`,`medium`,`high`,`critical`) |
| `description` | text | |
| `param_schema` | jsonb | Params ka JSON Schema |

**Seed (MVP):**

| command_type | display_action | permission_key | default_risk |
|--------------|----------------|----------------|--------------|
| `open_app` | `Apps.Open` | `apps_control` | low |
| `close_app` | `Apps.Close` | `apps_control` | medium |
| `list_running_apps` | `Apps.List` | `apps_control` | low |
| `focus_mode_toggle` | `System.FocusMode` | `system_settings` | low |
| `set_volume` | `System.Volume` | `system_settings` | low |
| `mute_toggle` | `System.Mute` | `system_settings` | low |
| `set_brightness` | `System.Brightness` | `system_settings` | low |
| `night_shift_toggle` | `System.NightShift` | `system_settings` | low |
| `lock_screen` | `System.Lock` | `system_settings` | low |
| `get_telemetry` | `System.Telemetry` | `system_settings` | low |
| `sleep` | `Power.Sleep` | `power_control` | critical |
| `restart` | `Power.Restart` | `power_control` | critical |
| `shutdown` | `Power.Shutdown` | `power_control` | critical |
| `screenshot` | `Screen.Capture` | `screen_observation` | medium |
| `open_url` | `Browser.Open` | `browser_automation` | low |
| `media_control` | `Media.Control` | `browser_automation` | low |
| `search_files` | `FileSystem.Search` | `files_read_write` | low |
| `open_file` | `FileSystem.Open` | `files_read_write` | medium |
| `reveal_file` | `FileSystem.Reveal` | `files_read_write` | low |
| `rename_file` | `FileSystem.Rename` | `files_read_write` | medium |
| `trash_file` | `FileSystem.Trash` | `files_read_write` | high |
| `run_terminal` | `Terminal.Execute` | `terminal_shell` | high |

*(Later: `send_message`, `wifi_toggle`, `bluetooth_toggle`, `clipboard_read`, `clipboard_write`.)*

### 3.18 `laptop_commands` (C)
Website → Agent ka command queue.

| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `device_id` | uuid | NOT NULL, FK → `laptop_devices(id)` | |
| `command_type` | text | NOT NULL, FK → `command_catalog(command_type)` | |
| `params` | jsonb | NOT NULL, `'{}'` | |
| `source` | text | NOT NULL, `'ui'` | CHECK in (`voice`,`ui`,`automation`) |
| `session_id` | uuid | NULL, FK → `conversation_sessions(id)` ON DELETE SET NULL | |
| `automation_id` | uuid | NULL, FK → `automations(id)` ON DELETE SET NULL | |
| `status` | text | NOT NULL | CHECK in (`queued`,`awaiting_confirmation`,`running`,`done`,`failed`,`blocked`,`cancelled`) — trigger set karta hai |
| `risk_level` | text | NOT NULL | trigger set karta hai |
| `confirmation_method` | text | NOT NULL, `'none'` | CHECK in (`none`,`voice`,`manual`,`pin`) — **required** method |
| `confirmed_by` | text | NULL | `voice`/`manual`/`pin` |
| `confirmed_at` | timestamptz | NULL | |
| `blocked_reason` | text | NULL | |
| `result` | jsonb | NULL | |
| `error_message` | text | NULL | |
| `dispatched_at` | timestamptz | NULL | agent ne `running` kiya |
| `completed_at` | timestamptz | NULL | |

**Status flow:** insert → (trigger) `queued` / `awaiting_confirmation` / `blocked` → agent claim `running` → `done` / `failed`. Owner `cancelled` kar sakta hai.

### 3.19 `permission_rules` (C)(U)
UNIQUE (`owner_id`,`permission_key`).

| Column | Type | Constraint / Default | Notes |
|--------|------|----------------------|-------|
| `permission_key` | text | NOT NULL, CHECK in (`files_read_write`,`terminal_shell`,`screen_observation`,`browser_automation`,`power_control`,`apps_control`,`system_settings`,`messaging`) | |
| `label` | text | NOT NULL | UI label |
| `risk_level` | text | NOT NULL | low/medium/high/critical |
| `is_enabled` | boolean | NOT NULL | `false` ho to command `blocked` |
| `mode` | text | NOT NULL | CHECK in (`allow`,`voice_confirm`,`pin_required`,`deny`) |
| `scope` | jsonb | NOT NULL, `'{}'` | e.g. `{"allowed_paths":["~/Projects","~/Documents"]}` |

**Seed defaults:**

| permission_key | label | risk | enabled | mode |
|----------------|-------|------|---------|------|
| `files_read_write` | Local File System Read/Write | medium | true | allow |
| `terminal_shell` | Terminal & Shell Execution | high | true | voice_confirm |
| `screen_observation` | Screen Observation | medium | true | allow |
| `browser_automation` | Browser Automation | low | true | allow |
| `power_control` | System Power Control | critical | true | pin_required |
| `apps_control` | Apps Control | low | true | allow |
| `system_settings` | System Settings | low | true | allow |
| `messaging` | Messaging (Later) | high | false | voice_confirm |

### 3.20 `ask_before_rules` (C)(U)
UNIQUE (`owner_id`,`rule_key`).

| Column | Type | Notes |
|--------|------|-------|
| `rule_key` | text | CHECK in (`large_file_delete`,`outgoing_messages`,`dangerous_terminal`,`secret_access`) |
| `label` | text | UI text |
| `threshold` | jsonb | `large_file_delete`: `{"size_mb":10}`; `dangerous_terminal`: `{"patterns":["rm -rf","sudo rm","mkfs","format"]}`; `secret_access`: `{"patterns":[".env","id_rsa","*.pem"]}` |
| `required_method` | text | CHECK in (`voice`,`pin`) — default `pin` |
| `is_enforced` | boolean | default `true` |

### 3.21 `activity_log` (append-only ledger)
| Column | Type | Constraint | Notes |
|--------|------|------------|-------|
| `id` | bigint | PK, `generated always as identity` | |
| `owner_id` | uuid | NOT NULL | |
| `device_id` | uuid | NULL, FK → `laptop_devices(id)` | |
| `command_id` | uuid | NULL, FK → `laptop_commands(id)` ON DELETE SET NULL | |
| `action` | text | NOT NULL | `display_action(params summary)`, e.g. `System.Brightness(40%)` |
| `status` | text | NOT NULL | CHECK in (`executed`,`blocked`,`awaiting_confirmation`,`failed`) |
| `verified_by` | text | NOT NULL, `'none'` | CHECK in (`none`,`voice`,`manual`,`pin`,`biometric`) |
| `risk_level` | text | NOT NULL | |
| `detail` | text | NULL | |
| `prev_hash` | text | NULL | |
| `entry_hash` | text | NOT NULL | `encode(digest(prev_hash||id||action||status||created_at,'sha256'),'hex')` |
| `created_at` | timestamptz | NOT NULL, `now()` | |

Koi UPDATE/DELETE policy nahi (append-only). Insert sirf trigger functions se.

### 3.22 `files_index` (C)(U)
Agent laptop se file/app index sync karta hai. UNIQUE (`device_id`,`path`).

| Column | Type | Constraint | Notes |
|--------|------|------------|-------|
| `device_id` | uuid | NOT NULL, FK → `laptop_devices(id)` ON DELETE CASCADE | |
| `kind` | text | NOT NULL, CHECK in (`file`,`app`) | |
| `name` | text | NOT NULL | |
| `path` | text | NOT NULL | |
| `extension` | text | NULL | |
| `category` | text | NOT NULL | CHECK in (`document`,`code`,`image`,`download`,`audio`,`app`,`other`) |
| `size_bytes` | bigint | NULL | |
| `modified_at` | timestamptz | NULL | |
| `last_opened_at` | timestamptz | NULL | |
| `app_version` | text | NULL | |
| `checksum_sha256` | text | NULL | |
| `is_starred` | boolean | NOT NULL, `false` | "Starred / Vault" |
| `zara_note` | text | NULL | |

---

## 4. Functions, Triggers & RPCs

| Name | Type | Kaam |
|------|------|------|
| `set_updated_at()` | trigger (BEFORE UPDATE) | Sab (U) tables par |
| `bootstrap_owner(p_owner_id uuid)` | RPC (security definer, ek hi baar) | `owner_profile`, `assistant_settings`, `persona_profiles`, 4 `voice_profiles`, 8 `emotion_settings`, 8 `permission_rules`, 4 `ask_before_rules`, `prayer_settings`, 3 `provider_connections` seed karta hai |
| `verify_pin(p_pin text)` | RPC → jsonb `{ok, attempts_left, locked_until}` | `pin_hash` check; galat par `pin_failed_attempts+1`; 5 par `pin_locked_until = now()+15min` |
| `set_pin(p_new_pin text, p_current_pin text default null)` | RPC | 6 digits validate; pehli dafa current_pin nahi chahiye |
| `classify_laptop_command()` | trigger (BEFORE INSERT on `laptop_commands`) | `command_catalog` + `permission_rules` + `ask_before_rules` + `assistant_settings` dekh kar `risk_level`, `confirmation_method`, `status` set karta hai (neeche rules) |
| `confirm_laptop_command(p_command_id uuid, p_method text, p_pin text default null)` | RPC | `awaiting_confirmation` → `queued`. `confirmation_method='pin'` ho to PIN verify zaroori |
| `cancel_laptop_command(p_command_id uuid)` | RPC | `queued`/`awaiting_confirmation` → `cancelled` |
| `log_command_event()` | trigger (AFTER INSERT / UPDATE OF status on `laptop_commands`, security definer) | `activity_log` mein row |
| `chain_activity_log()` | trigger (BEFORE INSERT on `activity_log`) | `prev_hash` / `entry_hash` |
| `panic_stop()` | RPC | `panic_active=true`, `mic_enabled=false`, queued/awaiting commands `cancelled`, ledger entry |
| `panic_resume(p_pin text)` | RPC | PIN ke baad `panic_active=false` |
| `get_resonance_wave(p_days int default 7)` | RPC → table(`day` date, `avg_intensity` numeric, `dominant_emotion` text) | `emotion_logs` se Emotions chart |

### `classify_laptop_command()` Rules (order mein)
1. Agar `assistant_settings.panic_active = true` → `status='blocked'`, `blocked_reason='panic_active'`.
2. Agar `source='voice'` aur `mic_enabled=false` → `blocked`, `'mic_disabled'`.
3. `permission_rules` row (catalog ki `permission_key`): `is_enabled=false` ya `mode='deny'` → `blocked`, `'permission_denied'`.
4. `risk_level` = catalog `default_risk`; neeche escalate ho sakta hai:
   - `trash_file`/`rename_file` + `params.size_bytes > size_mb*1MB` (`large_file_delete`) → `high`, method `pin`.
   - `run_terminal` + `params.command` mein `dangerous_terminal.patterns` → `critical`, method `pin`.
   - Kisi bhi command ke `params.path` mein `secret_access.patterns` → `high`, method `pin`.
   - `scope.allowed_paths` ke bahar `params.path` → `blocked`, `'outside_allowed_paths'`.
5. `confirmation_method`: `pin_required` mode → `pin`; `voice_confirm` → `voice`; warna `none`.
6. `safety_level`: `restricted` → medium+ ko kam az kam `manual` confirm; `prompt_on_risk` → high+ ko confirm; `relaxed` → sirf critical/`pin` rules.
7. Final `status`: confirm chahiye to `awaiting_confirmation`, warna `queued`.
8. `owner_id` aur `device_id` validate (`is_primary` device).

---

## 5. Row Level Security (RLS)

| Table | owner (`is_owner()`) | agent (`is_agent()`) |
|-------|----------------------|----------------------|
| `owner_profile` | SELECT/UPDATE (`pin_hash`,`pin_failed_attempts`,`pin_locked_until` columns ke liye UPDATE nahi — sirf RPC) | — |
| `assistant_settings` | SELECT/UPDATE (`owner_id = auth.uid()` ya `current_owner_id()`) | SELECT |
| `provider_connections`, `persona_profiles`, `voice_profiles`, `emotion_settings`, `emotion_logs`, `conversation_sessions`, `conversation_messages`, `memories`, `automation_runs`, `prayer_settings`, `prayer_times_cache` | ALL (`owner_id = current_owner_id()`) | — |
| `reminders` | ALL | SELECT, UPDATE (`is_completed`,`completed_at`) |
| `automations` | ALL | SELECT |
| `laptop_devices` | SELECT, UPDATE (`device_name`,`is_primary`) | SELECT/UPDATE own row (`agent_user_id = auth.uid()`): `telemetry`,`last_heartbeat_at`,`agent_version`,`os_version` |
| `laptop_commands` | SELECT, INSERT, (UPDATE via RPC only) | SELECT & UPDATE jahan `device_id` apni device ho: `status`,`result`,`error_message`,`dispatched_at`,`completed_at` — status sirf `queued→running→done/failed` |
| `command_catalog` | SELECT | SELECT |
| `permission_rules`, `ask_before_rules` | ALL | SELECT |
| `activity_log` | SELECT | SELECT |
| `files_index` | SELECT, UPDATE (`is_starred`) | INSERT/UPDATE/DELETE apni device ke rows |

- Anonymous (`anon`) ko **koi** table access nahi.
- Views use karne hon to `security_invoker = true`.

## 6. Storage Buckets

| Bucket | Public | Use | Policy |
|--------|--------|-----|--------|
| `conversation-audio` | false | Voice replay (sirf `store_audio=true`) | owner ALL |
| `exports` | false | Memory/History export files (optional) | owner ALL |

## 7. Realtime

Realtime publication mein: `laptop_commands`, `laptop_devices`, `activity_log`, `reminders`. Frontend subscribe karta hai: command status, device telemetry, naya log entry. Agent subscribe karta hai: `laptop_commands` (device_id filter, `status='queued'`).

## 8. Indexes

- `conversation_sessions (owner_id, started_at desc)`; `conversation_messages (session_id, seq)`
- `emotion_logs (owner_id, created_at desc)`
- `memories (owner_id, category)`, GIN text search on `content`
- `reminders (owner_id, is_completed, due_at)`
- `laptop_commands (device_id, status, created_at)`
- `activity_log (owner_id, created_at desc)`, `(owner_id, status)`
- `files_index (device_id, kind, category)`, GIN trigram on `name` (`pg_trgm`)
- Partial UNIQUE: `persona_profiles (owner_id) where is_active`; `voice_profiles (owner_id) where is_selected`

## 9. One-Time Setup (ChatGPT + Supabase)
1. Supabase project banayein; **Auth → signups disabled**.
2. 2 users banayen: owner (email+password) aur agent (email+password); `app_metadata.role` set karein (`owner` / `agent`).
3. Is file ke mutabiq tables, functions, triggers, RLS, buckets, realtime banayein.
4. `select bootstrap_owner('<owner-uuid>')` chalayen; `command_catalog` seed karein.
5. Agent ki pehli run par `laptop_devices` mein device register hogi (`agent_user_id` = agent uid).
