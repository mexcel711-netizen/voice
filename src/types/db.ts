// Exact match to 05_Backend_Schema.md tables, columns, and enums

export type WakePhraseMode = 'primary' | 'swift' | 'native_urdu';
export type LanguageMode = 'urdu' | 'english' | 'urdu_english';
export type SafetyLevel = 'relaxed' | 'prompt_on_risk' | 'restricted';
export type TonePreset = 'natural_auto' | 'urdu_poetic' | 'executive';
export type ProviderName = 'gemini' | 'elevenlabs' | 'whisper_local';
export type ProviderStatus = 'unknown' | 'connected' | 'error' | 'disabled';

export type FormalityMode = 'formal_polite' | 'casual' | 'mixed';
export type FlirtLevel = 'off' | 'light' | 'playful' | 'romantic';
export type LanguageStyle = 'urdu_script' | 'roman_urdu_mix' | 'english';
export type RegionalDialect = 'standard' | 'urban_hybrid' | 'lahori' | 'karachi';

export type VoiceCode = 'sovereign' | 'noor' | 'mehru' | 'simran';

export type EmotionName =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'shy'
  | 'laughing'
  | 'caring'
  | 'teasing';

export type DetectedUserMood = EmotionName | 'neutral' | 'tired' | 'stressed';

export type SessionStatus = 'active' | 'ended' | 'error';
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type MemoryCategory =
  | 'personal'
  | 'work_code'
  | 'relationship'
  | 'dates'
  | 'habits'
  | 'other';
export type MemoryType = 'episodic' | 'semantic';
export type MemorySource = 'conversation' | 'manual';

export type AutomationKind = 'voice_command' | 'routine' | 'hardware_trigger';
export type AutomationRunMode = 'live' | 'dry_run';
export type AutomationRunStatus = 'success' | 'failed' | 'blocked' | 'partial';

export type ReminderKind = 'reminder' | 'timer' | 'alarm';
export type RepeatRule = 'none' | 'daily' | 'weekdays' | 'weekly';
export type ReminderCategory = 'work_code' | 'personal_health' | 'other';
export type NotifyMode = 'voice' | 'notification' | 'both';

export type PrayerCalculationMethod =
  | 'karachi'
  | 'mwl'
  | 'isna'
  | 'egypt'
  | 'makkah';
export type AsrMethod = 'standard' | 'hanafi';

export type OsName = 'windows' | 'macos' | 'linux';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type CommandType =
  | 'open_app'
  | 'close_app'
  | 'list_running_apps'
  | 'focus_mode_toggle'
  | 'set_volume'
  | 'mute_toggle'
  | 'set_brightness'
  | 'night_shift_toggle'
  | 'lock_screen'
  | 'get_telemetry'
  | 'sleep'
  | 'restart'
  | 'shutdown'
  | 'screenshot'
  | 'open_url'
  | 'media_control'
  | 'search_files'
  | 'open_file'
  | 'reveal_file'
  | 'rename_file'
  | 'trash_file'
  | 'run_terminal';

export type PermissionKey =
  | 'files_read_write'
  | 'terminal_shell'
  | 'screen_observation'
  | 'browser_automation'
  | 'power_control'
  | 'apps_control'
  | 'system_settings'
  | 'messaging';

export type PermissionMode = 'allow' | 'voice_confirm' | 'pin_required' | 'deny';

export type AskBeforeRuleKey =
  | 'large_file_delete'
  | 'outgoing_messages'
  | 'dangerous_terminal'
  | 'secret_access';

export type ConfirmationMethod = 'none' | 'voice' | 'manual' | 'pin';
export type VerifiedByMethod = ConfirmationMethod | 'biometric';

export type CommandStatus =
  | 'queued'
  | 'awaiting_confirmation'
  | 'running'
  | 'done'
  | 'failed'
  | 'blocked'
  | 'cancelled';

export type CommandSource = 'voice' | 'ui' | 'automation';

export type ActivityStatus =
  | 'executed'
  | 'blocked'
  | 'awaiting_confirmation'
  | 'failed';

export type FileKind = 'file' | 'app';
export type FileCategory =
  | 'document'
  | 'code'
  | 'image'
  | 'download'
  | 'audio'
  | 'app'
  | 'other';

export interface OwnerProfile {
  id: string;
  display_name: string;
  pin_set_at: string | null;
  pin_failed_attempts: number;
  pin_locked_until: string | null;
  biometrics_enabled: boolean;
  voiceprint_status: 'not_set' | 'calibrated';
  voiceprint_calibrated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssistantSettings {
  owner_id: string;
  wake_phrase_mode: WakePhraseMode;
  wake_sensitivity: number;
  language_mode: LanguageMode;
  mic_device_id: string | null;
  mic_enabled: boolean;
  voice_lock_enabled: boolean;
  safety_level: SafetyLevel;
  panic_active: boolean;
  live_model: string;
  sampling_temperature: number;
  tone_preset: TonePreset;
  mirror_mode_enabled: boolean;
  auto_learn_enabled: boolean;
  store_audio: boolean;
  auto_lock_minutes: number;
  theme_mode: 'companion_night';
  accent_tint: string;
  urdu_font: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderConnection {
  id: string;
  owner_id: string;
  provider: ProviderName;
  status: ProviderStatus;
  last_tested_at: string | null;
  last_latency_ms: number | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonaProfile {
  id: string;
  owner_id: string;
  assistant_name: string;
  owner_nickname: string;
  formality: FormalityMode;
  playfulness: number;
  romance: number;
  teasing: number;
  caring: number;
  seriousness: number;
  humor: number;
  shyness: number;
  flirt_level: FlirtLevel;
  language_style: LanguageStyle;
  regional_dialect: RegionalDialect;
  custom_instructions: string;
  directive_tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceProfile {
  id: string;
  owner_id: string;
  code: VoiceCode;
  display_name: string;
  description: string;
  provider: 'gemini' | 'elevenlabs';
  provider_voice_id: string;
  is_selected: boolean;
  speed: number;
  pitch_semitones: number;
  warmth: number;
  expressiveness: number;
  pause_seconds: number;
  accent_mode: RegionalDialect;
  created_at: string;
  updated_at: string;
}

export interface EmotionSetting {
  id: string;
  owner_id: string;
  emotion: EmotionName;
  intensity: number;
  created_at: string;
  updated_at: string;
}

export interface EmotionLog {
  id: string;
  owner_id: string;
  session_id: string | null;
  detected_user_mood: DetectedUserMood | null;
  zara_emotion: EmotionName;
  intensity: number;
  note: string | null;
  created_at: string;
}

export interface ConversationSession {
  id: string;
  owner_id: string;
  title: string;
  summary: string | null;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  primary_emotion: EmotionName | null;
  emotion_tags: string[];
  has_laptop_actions: boolean;
  language: LanguageMode;
  audio_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  owner_id: string;
  session_id: string;
  seq: number;
  role: MessageRole;
  content_text: string;
  content_roman: string | null;
  content_en: string | null;
  emotion: EmotionName | null;
  command_id: string | null;
  audio_path: string | null;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  owner_id: string;
  content: string;
  category: MemoryCategory;
  memory_type: MemoryType;
  source: MemorySource;
  source_session_id: string | null;
  importance: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationStep {
  order: number;
  command_type: CommandType;
  params: Record<string, unknown>;
}

export interface Automation {
  id: string;
  owner_id: string;
  kind: AutomationKind;
  name: string;
  description: string;
  trigger_phrase: string | null;
  schedule_time: string | null;
  schedule_days: number[];
  trigger_event: string | null;
  steps: AutomationStep[];
  requires_confirmation: boolean;
  is_enabled: boolean;
  last_run_at: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: string;
  owner_id: string;
  automation_id: string;
  mode: AutomationRunMode;
  status: AutomationRunStatus;
  details: Record<string, unknown>;
  created_at: string;
  finished_at: string | null;
}

export interface Reminder {
  id: string;
  owner_id: string;
  kind: ReminderKind;
  title: string;
  notes: string;
  due_at: string;
  duration_seconds: number | null;
  repeat_rule: RepeatRule;
  repeat_days: number[];
  category: ReminderCategory;
  notify_mode: NotifyMode;
  voice_created: boolean;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrayerSettings {
  owner_id: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  calculation_method: PrayerCalculationMethod;
  asr_method: AsrMethod;
  alert_fajr: boolean;
  alert_zuhr: boolean;
  alert_asr: boolean;
  alert_maghrib: boolean;
  alert_isha: boolean;
  azaan_audio_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrayerTimesCache {
  id: string;
  owner_id: string;
  date: string;
  fajr: string;
  sunrise: string;
  zuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  source: 'calculated' | 'api';
  fetched_at: string;
  created_at: string;
}

export interface RunningAppInfo {
  name: string;
  pid?: number;
  cpu_percent?: number;
  memory_mb?: number;
}

export interface DeviceTelemetry {
  battery_percent?: number;
  is_charging?: boolean;
  cpu_percent?: number;
  temperature_c?: number;
  wifi_ssid?: string;
  wifi_mbps?: number;
  volume_percent?: number;
  is_muted?: boolean;
  brightness_percent?: number;
  night_shift_on?: boolean;
  focus_mode_on?: boolean;
  uptime_seconds?: number;
  mic_state?: string;
  running_apps?: RunningAppInfo[];
  last_screenshot_url?: string;
}

export interface LaptopDevice {
  id: string;
  owner_id: string;
  agent_user_id: string;
  device_name: string;
  os_name: OsName;
  os_version: string | null;
  model: string | null;
  agent_version: string | null;
  last_heartbeat_at: string | null;
  telemetry: DeviceTelemetry;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommandCatalogItem {
  command_type: CommandType;
  display_action: string;
  permission_key: PermissionKey;
  default_risk: RiskLevel;
  description: string;
  param_schema: Record<string, unknown>;
}

export interface LaptopCommand {
  id: string;
  owner_id: string;
  device_id: string;
  command_type: CommandType;
  params: Record<string, unknown>;
  source: CommandSource;
  session_id: string | null;
  automation_id: string | null;
  status: CommandStatus;
  risk_level: RiskLevel;
  confirmation_method: ConfirmationMethod;
  confirmed_by: VerifiedByMethod | null;
  confirmed_at: string | null;
  blocked_reason: string | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  dispatched_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface PermissionRule {
  id: string;
  owner_id: string;
  permission_key: PermissionKey;
  label: string;
  risk_level: RiskLevel;
  is_enabled: boolean;
  mode: PermissionMode;
  scope: { allowed_paths?: string[]; [key: string]: unknown };
  created_at: string;
  updated_at: string;
}

export interface AskBeforeRule {
  id: string;
  owner_id: string;
  rule_key: AskBeforeRuleKey;
  label: string;
  threshold: Record<string, unknown>;
  required_method: 'voice' | 'pin';
  is_enforced: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: number;
  owner_id: string;
  device_id: string | null;
  command_id: string | null;
  action: string;
  status: ActivityStatus;
  verified_by: VerifiedByMethod;
  risk_level: RiskLevel;
  detail: string | null;
  prev_hash: string | null;
  entry_hash: string;
  created_at: string;
}

export interface FileIndexEntry {
  id: string;
  owner_id: string;
  device_id: string;
  kind: FileKind;
  name: string;
  path: string;
  extension: string | null;
  category: FileCategory;
  size_bytes: number | null;
  modified_at: string | null;
  last_opened_at: string | null;
  app_version: string | null;
  checksum_sha256: string | null;
  is_starred: boolean;
  zara_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerifyPinResult {
  ok: boolean;
  attempts_left: number;
  locked_until: string | null;
}

export interface ResonanceWavePoint {
  day: string;
  avg_intensity: number;
  dominant_emotion: EmotionName;
}
