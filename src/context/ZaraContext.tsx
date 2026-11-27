import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_ASK_BEFORE_RULES,
  DEFAULT_PERMISSION_RULES,
  classifyLaptopCommand,
} from '../lib/safety';
import { calculatePrayerTimesForDate, CITY_PRESETS } from '../lib/prayer';
import { pinSchema } from '../lib/validation';
import { apiService } from '../services/api.service';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabase';
import { useToast, type ConfirmModalState } from './ToastContext';
import { ConfirmModal } from '../components/safety/ConfirmModal';
import type {
  ActivityLogEntry,
  AskBeforeRule,
  AskBeforeRuleKey,
  AssistantSettings,
  Automation,
  AutomationRun,
  CommandSource,
  CommandType,
  ConversationMessage,
  ConversationSession,
  EmotionLog,
  EmotionName,
  EmotionSetting,
  FileIndexEntry,
  LaptopCommand,
  LaptopDevice,
  MemoryItem,
  OwnerProfile,
  PermissionKey,
  PermissionRule,
  PersonaProfile,
  PrayerSettings,
  ProviderConnection,
  ProviderName,
  Reminder,
  VerifyPinResult,
  VoiceCode,
  VoiceProfile,
} from '../types/db';

const nowIso = () => new Date().toISOString();
const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `zara-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const LOCAL_OWNER_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_SETTINGS: AssistantSettings = {
  owner_id: LOCAL_OWNER_ID,
  wake_phrase_mode: 'primary',
  wake_sensitivity: 82,
  language_mode: 'urdu_english',
  mic_device_id: null,
  mic_enabled: true,
  voice_lock_enabled: false,
  safety_level: 'prompt_on_risk',
  panic_active: false,
  live_model: 'gemini-3.8-live',
  sampling_temperature: 0.7,
  tone_preset: 'natural_auto',
  mirror_mode_enabled: true,
  auto_learn_enabled: true,
  store_audio: false,
  auto_lock_minutes: 15,
  theme_mode: 'companion_night',
  accent_tint: '#E94B9A',
  urdu_font: 'Noto Nastaliq Urdu',
  created_at: nowIso(),
  updated_at: nowIso(),
};

const DEFAULT_PERSONA: PersonaProfile = {
  id: 'persona-default',
  owner_id: LOCAL_OWNER_ID,
  assistant_name: 'Zara',
  owner_nickname: 'Boss',
  formality: 'casual',
  playfulness: 70,
  romance: 60,
  teasing: 60,
  caring: 80,
  seriousness: 30,
  humor: 70,
  shyness: 30,
  flirt_level: 'playful',
  language_style: 'roman_urdu_mix',
  regional_dialect: 'standard',
  custom_instructions: '',
  directive_tags: ['Late night coding', 'Sweet & attentive'],
  is_active: true,
  created_at: nowIso(),
  updated_at: nowIso(),
};

const DEFAULT_VOICES: VoiceProfile[] = [
  {
    id: 'voice-sovereign',
    owner_id: LOCAL_OWNER_ID,
    code: 'sovereign',
    display_name: 'Zara Sovereign',
    description: 'Premium, soothing Urdu companion voice with natural conversational warmth.',
    provider: 'elevenlabs',
    provider_voice_id: 'o85TqPN3F4P7dWae2paA',
    is_selected: true,
    speed: 1.05,
    pitch_semitones: -1,
    warmth: 88,
    expressiveness: 92,
    pause_seconds: 0.4,
    accent_mode: 'standard',
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: 'voice-noor',
    owner_id: LOCAL_OWNER_ID,
    code: 'noor',
    display_name: 'Zara Noor',
    description: 'Bright, cheerful morning companion with crisp bilingual diction.',
    provider: 'gemini',
    provider_voice_id: 'Kore',
    is_selected: false,
    speed: 1.08,
    pitch_semitones: 1,
    warmth: 78,
    expressiveness: 86,
    pause_seconds: 0.35,
    accent_mode: 'urban_hybrid',
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: 'voice-mehru',
    owner_id: LOCAL_OWNER_ID,
    code: 'mehru',
    display_name: 'Zara Mehru',
    description: 'Deep, lyrical, classical Urdu poetic resonance.',
    provider: 'elevenlabs',
    provider_voice_id: '',
    is_selected: false,
    speed: 0.96,
    pitch_semitones: -2,
    warmth: 94,
    expressiveness: 90,
    pause_seconds: 0.5,
    accent_mode: 'lahori',
    created_at: nowIso(),
    updated_at: nowIso(),
  },
  {
    id: 'voice-simran',
    owner_id: LOCAL_OWNER_ID,
    code: 'simran',
    display_name: 'Zara Simran',
    description: 'Modern bilingual Urdu-English conversational rhythm.',
    provider: 'gemini',
    provider_voice_id: 'Leda',
    is_selected: false,
    speed: 1.02,
    pitch_semitones: 0,
    warmth: 82,
    expressiveness: 84,
    pause_seconds: 0.38,
    accent_mode: 'karachi',
    created_at: nowIso(),
    updated_at: nowIso(),
  },
];

const DEFAULT_EMOTIONS: EmotionSetting[] = (
  ['happy', 'sad', 'angry', 'surprised', 'shy', 'laughing', 'caring', 'teasing'] as EmotionName[]
).map((emotion) => ({
  id: `emotion-${emotion}`,
  owner_id: LOCAL_OWNER_ID,
  emotion,
  intensity: emotion === 'caring' ? 80 : emotion === 'happy' || emotion === 'teasing' ? 70 : 50,
  created_at: nowIso(),
  updated_at: nowIso(),
}));

const DEFAULT_PROVIDERS: ProviderConnection[] = [
  { id: 'prov-gemini', owner_id: LOCAL_OWNER_ID, provider: 'gemini', status: 'unknown', last_tested_at: null, last_latency_ms: null, last_error: null, created_at: nowIso(), updated_at: nowIso() },
  { id: 'prov-eleven', owner_id: LOCAL_OWNER_ID, provider: 'elevenlabs', status: 'unknown', last_tested_at: null, last_latency_ms: null, last_error: null, created_at: nowIso(), updated_at: nowIso() },
  { id: 'prov-whisper', owner_id: LOCAL_OWNER_ID, provider: 'whisper_local', status: 'disabled', last_tested_at: null, last_latency_ms: null, last_error: 'Coming later', created_at: nowIso(), updated_at: nowIso() },
];

const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  owner_id: LOCAL_OWNER_ID,
  city: null,
  country: null,
  latitude: null,
  longitude: null,
  timezone: null,
  calculation_method: 'karachi',
  asr_method: 'hanafi',
  alert_fajr: true,
  alert_zuhr: true,
  alert_asr: true,
  alert_maghrib: true,
  alert_isha: true,
  azaan_audio_enabled: false,
  created_at: nowIso(),
  updated_at: nowIso(),
};

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(16, '0');
}

export interface ZaraContextValue {
  supabaseConfigured: boolean;
  loading: boolean;
  authAuthenticated: boolean;
  isOwner: boolean;
  isUnlocked: boolean;
  hasPinSet: boolean;
  ownerProfile: OwnerProfile;
  settings: AssistantSettings;
  providers: ProviderConnection[];
  persona: PersonaProfile;
  voices: VoiceProfile[];
  emotionSettings: EmotionSetting[];
  emotionLogs: EmotionLog[];
  sessions: ConversationSession[];
  messagesBySession: Record<string, ConversationMessage[]>;
  memories: MemoryItem[];
  automations: Automation[];
  automationRuns: AutomationRun[];
  reminders: Reminder[];
  prayerSettings: PrayerSettings;
  device: LaptopDevice | null;
  deviceOnline: boolean;
  commands: LaptopCommand[];
  permissionRules: PermissionRule[];
  askBeforeRules: AskBeforeRule[];
  activityLog: ActivityLogEntry[];
  filesIndex: FileIndexEntry[];

  // Auth & Lock actions
  signInWithMasterPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  verifyPin: (pin: string) => Promise<VerifyPinResult>;
  setPin: (newPin: string, currentPin?: string) => Promise<{ ok: boolean; error?: string }>;
  lockScreen: () => void;
  logout: () => Promise<void>;
  autostartUnlock: () => void;

  // Confirmation modal
  openConfirmModal: (modal: Omit<ConfirmModalState, 'isOpen'>) => void;

  // Settings & Safety actions
  updateSettings: (patch: Partial<AssistantSettings>) => Promise<void>;
  testProvider: (provider: ProviderName) => Promise<void>;
  panicStop: () => Promise<void>;
  panicResume: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  updatePermissionRule: (key: PermissionKey, patch: Partial<PermissionRule>) => Promise<void>;
  updateAskBeforeRule: (key: AskBeforeRuleKey, patch: Partial<AskBeforeRule>) => Promise<void>;

  // Personality / Voice / Emotions
  updatePersona: (patch: Partial<PersonaProfile>) => Promise<void>;
  resetPersonaDefaults: () => Promise<void>;
  selectVoice: (code: VoiceCode) => Promise<void>;
  updateVoiceProfile: (code: VoiceCode, patch: Partial<VoiceProfile>) => Promise<void>;
  updateEmotionIntensity: (emotion: EmotionName, intensity: number) => Promise<void>;
  logEmotion: (log: Omit<EmotionLog, 'id' | 'owner_id' | 'created_at'>) => Promise<void>;

  // Laptop Commands & Files
  dispatchCommand: (
    commandType: CommandType,
    params?: Record<string, unknown>,
    source?: CommandSource,
    sessionId?: string | null,
    automationId?: string | null
  ) => Promise<LaptopCommand | null>;
  confirmCommand: (commandId: string, method: 'voice' | 'manual' | 'pin', pin?: string) => Promise<void>;
  cancelCommand: (commandId: string) => Promise<void>;
  starFile: (fileId: string, isStarred: boolean) => Promise<void>;
  resetDataWorkspace: (pin: string) => Promise<{ ok: boolean; error?: string }>;

  // Conversations
  createSession: (title?: string, continueSummary?: string | null) => Promise<ConversationSession>;
  appendMessage: (
    sessionId: string,
    msg: Omit<ConversationMessage, 'id' | 'owner_id' | 'session_id' | 'seq' | 'created_at'>
  ) => Promise<ConversationMessage>;
  endSession: (sessionId: string, summary?: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Memories
  addMemory: (input: Pick<MemoryItem, 'content' | 'category' | 'memory_type' | 'importance'> & { source?: 'conversation' | 'manual'; source_session_id?: string | null }) => Promise<MemoryItem>;
  updateMemory: (id: string, patch: Partial<MemoryItem>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  purgeAllMemories: (pin: string) => Promise<{ ok: boolean; error?: string }>;

  // Automations
  createAutomation: (input: Omit<Automation, 'id' | 'owner_id' | 'last_run_at' | 'run_count' | 'created_at' | 'updated_at'>) => Promise<Automation>;
  updateAutomation: (id: string, patch: Partial<Automation>) => Promise<void>;
  deleteAutomation: (id: string) => Promise<void>;
  runAutomation: (id: string, dryRun?: boolean) => Promise<AutomationRun>;

  // Reminders & Prayer
  createReminder: (input: Omit<Reminder, 'id' | 'owner_id' | 'is_completed' | 'completed_at' | 'created_at' | 'updated_at'>) => Promise<Reminder>;
  toggleReminderComplete: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  savePrayerSettings: (patch: Partial<PrayerSettings>) => Promise<void>;
}

const ZaraContext = createContext<ZaraContextValue | null>(null);

export function useZara() {
  const ctx = useContext(ZaraContext);
  if (!ctx) throw new Error('useZara must be used within ZaraProvider');
  return ctx;
}

export function ZaraProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const configured = isSupabaseConfigured();

  const [loading, setLoading] = useState(configured);
  const [authAuthenticated, setAuthAuthenticated] = useState(!configured);
  const [isOwner, setIsOwner] = useState(!configured);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('zara_unlocked') === '1';
    }
    return false;
  });

  // First-run local workspace PIN hash (stored only in memory — never hardcoded)
  const localPinHashRef = useRef<string | null>(null);

  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>({
    id: LOCAL_OWNER_ID,
    display_name: 'Boss',
    pin_set_at: null,
    pin_failed_attempts: 0,
    pin_locked_until: null,
    biometrics_enabled: false,
    voiceprint_status: 'not_set',
    voiceprint_calibrated_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  });

  const [settings, setSettings] = useState<AssistantSettings>(DEFAULT_SETTINGS);
  const [providers, setProviders] = useState<ProviderConnection[]>(DEFAULT_PROVIDERS);
  const [persona, setPersona] = useState<PersonaProfile>(DEFAULT_PERSONA);
  const [voices, setVoices] = useState<VoiceProfile[]>(DEFAULT_VOICES);
  const [emotionSettings, setEmotionSettings] = useState<EmotionSetting[]>(DEFAULT_EMOTIONS);
  const [emotionLogs, setEmotionLogs] = useState<EmotionLog[]>([]);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ConversationMessage[]>>({});
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings>(DEFAULT_PRAYER_SETTINGS);
  const [device, setDevice] = useState<LaptopDevice | null>(null);
  const [commands, setCommands] = useState<LaptopCommand[]>([]);
  const [permissionRules, setPermissionRules] = useState<PermissionRule[]>(() =>
    DEFAULT_PERMISSION_RULES.map((r) => ({
      ...r,
      id: `perm-${r.permission_key}`,
      owner_id: LOCAL_OWNER_ID,
      created_at: nowIso(),
      updated_at: nowIso(),
    }))
  );
  const [askBeforeRules, setAskBeforeRules] = useState<AskBeforeRule[]>(() =>
    DEFAULT_ASK_BEFORE_RULES.map((r) => ({
      ...r,
      id: `ask-${r.rule_key}`,
      owner_id: LOCAL_OWNER_ID,
      created_at: nowIso(),
      updated_at: nowIso(),
    }))
  );
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [filesIndex, setFilesIndex] = useState<FileIndexEntry[]>([]);

  const [confirmState, setConfirmState] = useState<ConfirmModalState | null>(null);

  const openConfirmModal = useCallback((modal: Omit<ConfirmModalState, 'isOpen'>) => {
    setConfirmState({ ...modal, isOpen: true });
  }, []);

  // Load real Supabase state if configured
  const loadSupabaseData = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData.session?.user;
      const role = (user?.app_metadata as { role?: string } | undefined)?.role;
      setAuthAuthenticated(Boolean(user));
      setIsOwner(role === 'owner');
      if (!user || role !== 'owner') {
        setLoading(false);
        return;
      }

      const [
        profileRes,
        settingsRes,
        provRes,
        personaRes,
        voicesRes,
        emSetRes,
        emLogsRes,
        sessionsRes,
        memRes,
        autoRes,
        remRes,
        prayerRes,
        devRes,
        cmdRes,
        permRes,
        askRes,
        logRes,
        filesRes,
      ] = await Promise.all([
        client.from('owner_profile').select('id,display_name,pin_set_at,pin_failed_attempts,pin_locked_until,biometrics_enabled,voiceprint_status,voiceprint_calibrated_at,created_at,updated_at').maybeSingle(),
        client.from('assistant_settings').select('*').maybeSingle(),
        client.from('provider_connections').select('*'),
        client.from('persona_profiles').select('*').eq('is_active', true).maybeSingle(),
        client.from('voice_profiles').select('*'),
        client.from('emotion_settings').select('*'),
        client.from('emotion_logs').select('*').order('created_at', { ascending: false }).limit(20),
        client.from('conversation_sessions').select('*').order('started_at', { ascending: false }).limit(50),
        client.from('memories').select('*').order('created_at', { ascending: false }),
        client.from('automations').select('*').order('created_at', { ascending: false }),
        client.from('reminders').select('*').order('due_at', { ascending: true }),
        client.from('prayer_settings').select('*').maybeSingle(),
        client.from('laptop_devices').select('*').eq('is_primary', true).maybeSingle(),
        client.from('laptop_commands').select('*').order('created_at', { ascending: false }).limit(30),
        client.from('permission_rules').select('*'),
        client.from('ask_before_rules').select('*'),
        client.from('activity_log').select('*').order('created_at', { ascending: false }).limit(100),
        client.from('files_index').select('*').order('modified_at', { ascending: false }).limit(200),
      ]);

      if (profileRes.data) setOwnerProfile(profileRes.data as OwnerProfile);
      if (settingsRes.data) setSettings(settingsRes.data as AssistantSettings);
      if (provRes.data?.length) setProviders(provRes.data as ProviderConnection[]);
      if (personaRes.data) setPersona(personaRes.data as PersonaProfile);
      if (voicesRes.data?.length) setVoices(voicesRes.data as VoiceProfile[]);
      if (emSetRes.data?.length) setEmotionSettings(emSetRes.data as EmotionSetting[]);
      if (emLogsRes.data) setEmotionLogs(emLogsRes.data as EmotionLog[]);
      if (sessionsRes.data) setSessions(sessionsRes.data as ConversationSession[]);
      if (memRes.data) setMemories(memRes.data as MemoryItem[]);
      if (autoRes.data) setAutomations(autoRes.data as Automation[]);
      if (remRes.data) setReminders(remRes.data as Reminder[]);
      if (prayerRes.data) setPrayerSettings(prayerRes.data as PrayerSettings);
      if (devRes.data) setDevice(devRes.data as LaptopDevice);
      if (cmdRes.data) setCommands(cmdRes.data as LaptopCommand[]);
      if (permRes.data?.length) setPermissionRules(permRes.data as PermissionRule[]);
      if (askRes.data?.length) setAskBeforeRules(askRes.data as AskBeforeRule[]);
      if (logRes.data) setActivityLog(logRes.data as ActivityLogEntry[]);
      if (filesRes.data) setFilesIndex(filesRes.data as FileIndexEntry[]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (configured) {
      void loadSupabaseData();
    }
  }, [configured, loadSupabaseData]);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !authAuthenticated || !isOwner) return;

    const channel = client
      .channel('zara-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'laptop_commands' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCommands((prev) => [payload.new as LaptopCommand, ...prev.slice(0, 49)]);
        } else if (payload.eventType === 'UPDATE') {
          setCommands((prev) =>
            prev.map((c) => (c.id === (payload.new as LaptopCommand).id ? (payload.new as LaptopCommand) : c))
          );
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'laptop_devices' }, (payload) => {
        if (payload.new && (payload.new as LaptopDevice).is_primary) {
          setDevice(payload.new as LaptopDevice);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload) => {
        setActivityLog((prev) => [payload.new as ActivityLogEntry, ...prev.slice(0, 99)]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setReminders((prev) => [...prev, payload.new as Reminder]);
        } else if (payload.eventType === 'UPDATE') {
          setReminders((prev) =>
            prev.map((r) => (r.id === (payload.new as Reminder).id ? (payload.new as Reminder) : r))
          );
        } else if (payload.eventType === 'DELETE') {
          setReminders((prev) => prev.filter((r) => r.id !== (payload.old as { id: string }).id));
        }
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [authAuthenticated, isOwner]);

  // Apply accent tint CSS var
  useEffect(() => {
    if (typeof document !== 'undefined' && settings.accent_tint) {
      document.documentElement.style.setProperty('--zara-accent', settings.accent_tint);
    }
  }, [settings.accent_tint]);

  // Idle auto-lock timer
  const lockScreen = useCallback(() => {
    sessionStorage.removeItem('zara_unlocked');
    setIsUnlocked(false);
  }, []);

  useEffect(() => {
    if (!isUnlocked || settings.auto_lock_minutes <= 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lockScreen();
        showToast('Idle timeout reached — session locked.', 'info');
      }, settings.auto_lock_minutes * 60 * 1000);
    };
    resetTimer();
    const events = ['mousedown', 'keydown', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isUnlocked, settings.auto_lock_minutes, lockScreen, showToast]);

  // In-app reminder scheduler
  const firedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isUnlocked) return;
    const interval = setInterval(() => {
      const now = Date.now();
      reminders.forEach((rem) => {
        if (rem.is_completed || firedIdsRef.current.has(rem.id)) return;
        const dueMs = new Date(rem.due_at).getTime();
        if (!Number.isNaN(dueMs) && dueMs <= now && now - dueMs < 120_000) {
          firedIdsRef.current.add(rem.id);
          showToast(`Reminder: ${rem.title}`, 'info');
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification('Zara Reminder', { body: rem.title });
            } catch {
              // ignore blocked notification
            }
          }
        }
      });
    }, 15_000);
    return () => clearInterval(interval);
  }, [isUnlocked, reminders, showToast]);

  const deviceOnline = useMemo(() => {
    if (!device?.last_heartbeat_at) return false;
    return Date.now() - new Date(device.last_heartbeat_at).getTime() < 60_000;
  }, [device]);

  const appendLedger = useCallback(
    async (entry: Omit<ActivityLogEntry, 'id' | 'owner_id' | 'prev_hash' | 'entry_hash' | 'created_at'>) => {
      const created = nowIso();
      setActivityLog((prev) => {
        const prevHash = prev[0]?.entry_hash ?? '0000000000000000';
        const nextId = (prev[0]?.id ?? 0) + 1;
        const tempRow: ActivityLogEntry = {
          ...entry,
          id: nextId,
          owner_id: ownerProfile.id,
          prev_hash: prevHash,
          entry_hash: `pending-${nextId}`,
          created_at: created,
        };
        void sha256Hex(`${prevHash}|${nextId}|${entry.action}|${entry.status}|${created}`).then((hash) => {
          setActivityLog((curr) =>
            curr.map((row) => (row.id === nextId ? { ...row, entry_hash: hash } : row))
          );
        });
        return [tempRow, ...prev];
      });
    },
    [ownerProfile.id]
  );

  // Auth handlers
  const signInWithMasterPassword = useCallback(
    async (email: string, password: string) => {
      const client = getSupabaseClient();
      if (!client) {
        return {
          ok: false,
          error: 'Supabase configure nahi hai. Local workspace PIN unlock use karein.',
        };
      }
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        return { ok: false, error: error.message };
      }
      const role = (data.user?.app_metadata as { role?: string } | undefined)?.role;
      if (role !== 'owner') {
        await client.auth.signOut();
        return { ok: false, error: 'Unauthorized account: single-owner access only.' };
      }
      const { error: bootstrapError } = await client.rpc('bootstrap_owner', {
        p_owner_id: data.user.id,
      });
      if (bootstrapError) {
        await client.auth.signOut();
        return { ok: false, error: `Workspace setup failed: ${bootstrapError.message}` };
      }
      setAuthAuthenticated(true);
      setIsOwner(true);
      await loadSupabaseData();
      return { ok: true };
    },
    [loadSupabaseData]
  );

  const verifyPin = useCallback(
    async (pin: string): Promise<VerifyPinResult> => {
      const valid = pinSchema.safeParse(pin);
      if (!valid.success) {
        return { ok: false, attempts_left: Math.max(0, 5 - ownerProfile.pin_failed_attempts), locked_until: ownerProfile.pin_locked_until };
      }

      if (ownerProfile.pin_locked_until && new Date(ownerProfile.pin_locked_until).getTime() > Date.now()) {
        return { ok: false, attempts_left: 0, locked_until: ownerProfile.pin_locked_until };
      }

      const client = getSupabaseClient();
      if (client) {
        const { data, error } = await client.rpc('verify_pin', { p_pin: pin });
        if (error) throw new Error(error.message);
        const res = data as VerifyPinResult;
        if (res.ok) {
          sessionStorage.setItem('zara_unlocked', '1');
          setIsUnlocked(true);
          setOwnerProfile((p) => ({ ...p, pin_failed_attempts: 0, pin_locked_until: null }));
        } else {
          setOwnerProfile((p) => ({
            ...p,
            pin_failed_attempts: 5 - res.attempts_left,
            pin_locked_until: res.locked_until,
          }));
        }
        return res;
      }

      // Unconfigured local workspace mode: verify against user-chosen first-run PIN hash
      if (!localPinHashRef.current) {
        return { ok: false, attempts_left: 5, locked_until: null };
      }
      const candidate = await sha256Hex(`zara-pin:${pin}`);
      if (candidate === localPinHashRef.current) {
        sessionStorage.setItem('zara_unlocked', '1');
        setIsUnlocked(true);
        setOwnerProfile((p) => ({ ...p, pin_failed_attempts: 0, pin_locked_until: null }));
        return { ok: true, attempts_left: 5, locked_until: null };
      }

      const nextFailed = ownerProfile.pin_failed_attempts + 1;
      const lockedUntil =
        nextFailed >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      setOwnerProfile((p) => ({
        ...p,
        pin_failed_attempts: nextFailed,
        pin_locked_until: lockedUntil,
      }));
      return { ok: false, attempts_left: Math.max(0, 5 - nextFailed), locked_until: lockedUntil };
    },
    [ownerProfile.pin_failed_attempts, ownerProfile.pin_locked_until]
  );

  const setPin = useCallback(
    async (newPin: string, currentPin?: string) => {
      const valid = pinSchema.safeParse(newPin);
      if (!valid.success) {
        return { ok: false, error: valid.error.issues[0]?.message || 'PIN must be 6 digits.' };
      }
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.rpc('set_pin', {
          p_new_pin: newPin,
          p_current_pin: currentPin ?? null,
        });
        if (error) return { ok: false, error: error.message };
        setOwnerProfile((p) => ({ ...p, pin_set_at: nowIso() }));
        sessionStorage.setItem('zara_unlocked', '1');
        setIsUnlocked(true);
        return { ok: true };
      }

      if (localPinHashRef.current && currentPin) {
        const currHash = await sha256Hex(`zara-pin:${currentPin}`);
        if (currHash !== localPinHashRef.current) {
          return { ok: false, error: 'Current PIN is incorrect.' };
        }
      }
      localPinHashRef.current = await sha256Hex(`zara-pin:${newPin}`);
      setOwnerProfile((p) => ({
        ...p,
        pin_set_at: nowIso(),
        pin_failed_attempts: 0,
        pin_locked_until: null,
      }));
      sessionStorage.setItem('zara_unlocked', '1');
      setIsUnlocked(true);
      return { ok: true };
    },
    []
  );

  const logout = useCallback(async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
      setAuthAuthenticated(false);
      setIsOwner(false);
    }
    sessionStorage.clear();
    setIsUnlocked(false);
  }, []);

  const autostartUnlock = useCallback(() => {
    sessionStorage.setItem('zara_unlocked', '1');
    setIsUnlocked(true);
  }, []);

  // Settings & Safety
  const updateSettings = useCallback(async (patch: Partial<AssistantSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch, updated_at: nowIso() }));
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from('assistant_settings').update(patch).eq('owner_id', settings.owner_id);
      if (error) showToast(error.message, 'error');
    }
  }, [settings.owner_id, showToast]);

  const testProvider = useCallback(
    async (provider: ProviderName) => {
      try {
        const res = await apiService.testProvider({ provider });
        const testedAt = nowIso();
        setProviders((prev) =>
          prev.map((p) =>
            p.provider === provider
              ? {
                  ...p,
                  status: res.status,
                  last_latency_ms: res.latencyMs,
                  last_tested_at: testedAt,
                  last_error: res.ok ? null : res.message,
                  updated_at: testedAt,
                }
              : p
          )
        );
        const client = getSupabaseClient();
        if (client) {
          await client
            .from('provider_connections')
            .update({
              status: res.status,
              last_latency_ms: res.latencyMs,
              last_tested_at: testedAt,
              last_error: res.ok ? null : res.message,
            })
            .eq('provider', provider);
        }
        showToast(res.message, res.ok ? 'success' : 'warning');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Provider ping failed.', 'error');
      }
    },
    [showToast]
  );

  const panicStop = useCallback(async () => {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.rpc('panic_stop');
      if (error) {
        showToast(error.message, 'error');
        return;
      }
    }
    setSettings((prev) => ({ ...prev, panic_active: true, mic_enabled: false, updated_at: nowIso() }));
    setCommands((prev) =>
      prev.map((c) =>
        c.status === 'queued' || c.status === 'awaiting_confirmation'
          ? { ...c, status: 'cancelled' }
          : c
      )
    );
    await appendLedger({
      device_id: device?.id ?? null,
      command_id: null,
      action: 'Safety.PanicKillSwitch()',
      status: 'executed',
      verified_by: 'manual',
      risk_level: 'critical',
      detail: 'Emergency panic stop engaged — mic muted and active command queue cancelled.',
    });
    showToast('Panic mode ON — mic aur commands band kar diye gaye.', 'error');
  }, [appendLedger, device?.id, showToast]);

  const panicResume = useCallback(
    async (pin: string) => {
      const check = await verifyPin(pin);
      if (!check.ok && ownerProfile.pin_set_at) {
        return { ok: false, error: `Wrong PIN (${check.attempts_left} attempts left)` };
      }
      if (!ownerProfile.pin_set_at) {
        const parsed = pinSchema.safeParse(pin);
        if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
      }
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.rpc('panic_resume', { p_pin: pin });
        if (error) return { ok: false, error: error.message };
      }
      setSettings((prev) => ({ ...prev, panic_active: false, updated_at: nowIso() }));
      await appendLedger({
        device_id: device?.id ?? null,
        command_id: null,
        action: 'Safety.PanicResume()',
        status: 'executed',
        verified_by: 'pin',
        risk_level: 'high',
        detail: 'Panic lock cleared after owner PIN verification.',
      });
      showToast('System resumed. Enable mic when ready.', 'success');
      return { ok: true };
    },
    [appendLedger, device?.id, ownerProfile.pin_set_at, showToast, verifyPin]
  );

  const updatePermissionRule = useCallback(
    async (key: PermissionKey, patch: Partial<PermissionRule>) => {
      setPermissionRules((prev) =>
        prev.map((r) => (r.permission_key === key ? { ...r, ...patch, updated_at: nowIso() } : r))
      );
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from('permission_rules').update(patch).eq('permission_key', key);
        if (error) showToast(error.message, 'error');
      }
    },
    [showToast]
  );

  const updateAskBeforeRule = useCallback(
    async (key: AskBeforeRuleKey, patch: Partial<AskBeforeRule>) => {
      setAskBeforeRules((prev) =>
        prev.map((r) => (r.rule_key === key ? { ...r, ...patch, updated_at: nowIso() } : r))
      );
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from('ask_before_rules').update(patch).eq('rule_key', key);
        if (error) showToast(error.message, 'error');
      }
    },
    [showToast]
  );

  // Personality / Voice / Emotions
  const updatePersona = useCallback(
    async (patch: Partial<PersonaProfile>) => {
      setPersona((prev) => ({ ...prev, ...patch, updated_at: nowIso() }));
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from('persona_profiles').update(patch).eq('id', persona.id);
        if (error) showToast(error.message, 'error');
      }
    },
    [persona.id, showToast]
  );

  const resetPersonaDefaults = useCallback(async () => {
    await updatePersona({
      ...DEFAULT_PERSONA,
      id: persona.id,
      owner_id: persona.owner_id,
    });
    showToast('Persona profile reset to default.', 'info');
  }, [persona.id, persona.owner_id, showToast, updatePersona]);

  const selectVoice = useCallback(
    async (code: VoiceCode) => {
      setVoices((prev) => prev.map((v) => ({ ...v, is_selected: v.code === code })));
      const client = getSupabaseClient();
      if (client) {
        await client.from('voice_profiles').update({ is_selected: false }).neq('code', code);
        await client.from('voice_profiles').update({ is_selected: true }).eq('code', code);
      }
    },
    []
  );

  const updateVoiceProfile = useCallback(
    async (code: VoiceCode, patch: Partial<VoiceProfile>) => {
      setVoices((prev) =>
        prev.map((v) => (v.code === code ? { ...v, ...patch, updated_at: nowIso() } : v))
      );
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from('voice_profiles').update(patch).eq('code', code);
        if (error) showToast(error.message, 'error');
      }
    },
    [showToast]
  );

  const updateEmotionIntensity = useCallback(
    async (emotion: EmotionName, intensity: number) => {
      setEmotionSettings((prev) =>
        prev.map((e) => (e.emotion === emotion ? { ...e, intensity, updated_at: nowIso() } : e))
      );
      const client = getSupabaseClient();
      if (client) {
        await client.from('emotion_settings').update({ intensity }).eq('emotion', emotion);
      }
    },
    []
  );

  const logEmotion = useCallback(
    async (log: Omit<EmotionLog, 'id' | 'owner_id' | 'created_at'>) => {
      const item: EmotionLog = {
        ...log,
        id: uuid(),
        owner_id: ownerProfile.id,
        created_at: nowIso(),
      };
      setEmotionLogs((prev) => [item, ...prev.slice(0, 49)]);
      const client = getSupabaseClient();
      if (client) {
        await client.from('emotion_logs').insert(log);
      }
    },
    [ownerProfile.id]
  );

  // Laptop commands
  const confirmCommand = useCallback(
    async (commandId: string, method: 'voice' | 'manual' | 'pin', pin?: string) => {
      if (method === 'pin') {
        if (!pin) throw new Error('6-digit PIN required.');
        if (ownerProfile.pin_set_at) {
          const v = await verifyPin(pin);
          if (!v.ok) throw new Error(`Wrong PIN (${v.attempts_left} attempts left)`);
        } else {
          const parsed = pinSchema.safeParse(pin);
          if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
        }
      }

      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.rpc('confirm_laptop_command', {
          p_command_id: commandId,
          p_method: method,
          p_pin: pin ?? null,
        });
        if (error) throw new Error(error.message);
      }

      const ts = nowIso();
      setCommands((prev) =>
        prev.map((c) =>
          c.id === commandId
            ? { ...c, status: 'queued', confirmed_by: method, confirmed_at: ts }
            : c
        )
      );
      const cmd = commands.find((c) => c.id === commandId);
      await appendLedger({
        device_id: device?.id ?? null,
        command_id: commandId,
        action: `${cmd?.command_type ?? 'Command'}(confirmed)`,
        status: 'executed',
        verified_by: method,
        risk_level: cmd?.risk_level ?? 'medium',
        detail: `Confirmed via ${method}. Queued for Local Agent.`,
      });
      showToast('Command confirmed and queued for Local Agent.', 'success');
    },
    [appendLedger, commands, device?.id, ownerProfile.pin_set_at, showToast, verifyPin]
  );

  const cancelCommand = useCallback(
    async (commandId: string) => {
      const client = getSupabaseClient();
      if (client) {
        await client.rpc('cancel_laptop_command', { p_command_id: commandId });
      }
      setCommands((prev) =>
        prev.map((c) => (c.id === commandId ? { ...c, status: 'cancelled' } : c))
      );
      const cmd = commands.find((c) => c.id === commandId);
      await appendLedger({
        device_id: device?.id ?? null,
        command_id: commandId,
        action: `${cmd?.command_type ?? 'Command'}(cancelled)`,
        status: 'blocked',
        verified_by: 'manual',
        risk_level: cmd?.risk_level ?? 'low',
        detail: 'Command rejected or cancelled by owner.',
      });
      showToast('Command cancelled.', 'info');
    },
    [appendLedger, commands, device?.id, showToast]
  );

  const dispatchCommand = useCallback(
    async (
      commandType: CommandType,
      params: Record<string, unknown> = {},
      source: CommandSource = 'ui',
      sessionId: string | null = null,
      automationId: string | null = null
    ): Promise<LaptopCommand | null> => {
      const classified = classifyLaptopCommand({
        command_type: commandType,
        params,
        source,
        panic_active: settings.panic_active,
        mic_enabled: settings.mic_enabled,
        safety_level: settings.safety_level,
        permission_rules: permissionRules,
        ask_before_rules: askBeforeRules,
      });

      const cmdId = uuid();
      const targetDeviceId = device?.id ?? 'device-offline';
      const cmdRow: LaptopCommand = {
        id: cmdId,
        owner_id: ownerProfile.id,
        device_id: targetDeviceId,
        command_type: commandType,
        params,
        source,
        session_id: sessionId,
        automation_id: automationId,
        status: classified.status,
        risk_level: classified.risk_level,
        confirmation_method: classified.confirmation_method,
        confirmed_by: null,
        confirmed_at: null,
        blocked_reason: classified.blocked_reason,
        result: null,
        error_message: null,
        dispatched_at: null,
        completed_at: null,
        created_at: nowIso(),
      };

      const client = getSupabaseClient();
      if (client && device?.id) {
        const { data, error } = await client
          .from('laptop_commands')
          .insert({
            device_id: device.id,
            command_type: commandType,
            params,
            source,
            session_id: sessionId,
            automation_id: automationId,
          })
          .select('*')
          .single();
        if (error) {
          showToast(error.message, 'error');
          return null;
        }
        const inserted = data as LaptopCommand;
        setCommands((prev) => [inserted, ...prev.slice(0, 49)]);
        if (inserted.status === 'awaiting_confirmation') {
          openConfirmModal({
            title: 'Confirm Laptop Command',
            description: `Zara wants to run "${inserted.command_type}". Approve to send to Local Agent.`,
            method: inserted.confirmation_method === 'none' ? 'manual' : inserted.confirmation_method,
            riskLevel: inserted.risk_level,
            commandSummary: `${inserted.command_type}(${JSON.stringify(inserted.params)})`,
            onConfirm: async (pin) => {
              const m =
                inserted.confirmation_method === 'pin'
                  ? 'pin'
                  : inserted.confirmation_method === 'voice'
                  ? 'voice'
                  : 'manual';
              await confirmCommand(inserted.id, m, pin);
            },
            onCancel: () => {
              void cancelCommand(inserted.id);
            },
          });
        } else if (inserted.status === 'blocked') {
          showToast(`Blocked: ${inserted.blocked_reason || 'Safety rule'}`, 'error');
        } else {
          showToast(`Queued: ${inserted.command_type}`, 'success');
        }
        return inserted;
      }

      // Offline / unconfigured path
      setCommands((prev) => [cmdRow, ...prev.slice(0, 49)]);
      await appendLedger({
        device_id: device?.id ?? null,
        command_id: cmdId,
        action: `${classified.display_action}(${Object.values(params).join(', ')})`,
        status:
          classified.status === 'blocked'
            ? 'blocked'
            : classified.status === 'awaiting_confirmation'
            ? 'awaiting_confirmation'
            : 'executed',
        verified_by: 'none',
        risk_level: classified.risk_level,
        detail:
          classified.blocked_reason ??
          (deviceOnline ? 'Queued for agent' : 'Laptop offline — queued locally until Zara Agent connects.'),
      });

      if (classified.status === 'blocked') {
        showToast(`Blocked: ${classified.blocked_reason}`, 'error');
      } else if (classified.status === 'awaiting_confirmation') {
        openConfirmModal({
          title: 'Confirm Sensitive Command',
          description: `Safety protocol requires verification before queuing "${classified.display_action}".`,
          method: classified.confirmation_method === 'none' ? 'manual' : classified.confirmation_method,
          riskLevel: classified.risk_level,
          commandSummary: `${classified.display_action}(${JSON.stringify(params)})`,
          onConfirm: async (pin) => {
            const m =
              classified.confirmation_method === 'pin'
                ? 'pin'
                : classified.confirmation_method === 'voice'
                ? 'voice'
                : 'manual';
            await confirmCommand(cmdId, m, pin);
          },
          onCancel: () => {
            void cancelCommand(cmdId);
          },
        });
      } else {
        showToast(
          deviceOnline
            ? `Queued: ${classified.display_action}`
            : `Laptop offline — ${classified.display_action} requires Zara Local Agent.`,
          deviceOnline ? 'success' : 'warning'
        );
      }

      return cmdRow;
    },
    [
      appendLedger,
      askBeforeRules,
      cancelCommand,
      confirmCommand,
      device?.id,
      deviceOnline,
      openConfirmModal,
      ownerProfile.id,
      permissionRules,
      settings.mic_enabled,
      settings.panic_active,
      settings.safety_level,
      showToast,
    ]
  );

  const starFile = useCallback(async (fileId: string, isStarred: boolean) => {
    setFilesIndex((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, is_starred: isStarred } : f))
    );
    const client = getSupabaseClient();
    if (client) {
      await client.from('files_index').update({ is_starred: isStarred }).eq('id', fileId);
    }
  }, []);

  // Conversations
  const createSession = useCallback(
    async (title = 'New conversation', continueSummary?: string | null) => {
      const s: ConversationSession = {
        id: uuid(),
        owner_id: ownerProfile.id,
        title,
        summary: continueSummary ?? null,
        status: 'active',
        started_at: nowIso(),
        ended_at: null,
        duration_seconds: null,
        primary_emotion: null,
        emotion_tags: [],
        has_laptop_actions: false,
        language: settings.language_mode,
        audio_path: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      const client = getSupabaseClient();
      if (client) {
        const { data } = await client
          .from('conversation_sessions')
          .insert({
            title: s.title,
            summary: s.summary,
            status: 'active',
            language: s.language,
          })
          .select('*')
          .single();
        if (data) {
          const inserted = data as ConversationSession;
          setSessions((prev) => [inserted, ...prev]);
          return inserted;
        }
      }
      setSessions((prev) => [s, ...prev]);
      return s;
    },
    [ownerProfile.id, settings.language_mode]
  );

  const appendMessage = useCallback(
    async (
      sessionId: string,
      msg: Omit<ConversationMessage, 'id' | 'owner_id' | 'session_id' | 'seq' | 'created_at'>
    ) => {
      const existing = messagesBySession[sessionId] ?? [];
      const seq = existing.length + 1;
      const row: ConversationMessage = {
        ...msg,
        id: uuid(),
        owner_id: ownerProfile.id,
        session_id: sessionId,
        seq,
        created_at: nowIso(),
      };
      setMessagesBySession((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] ?? []), row],
      }));
      if (msg.emotion) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  primary_emotion: msg.emotion ?? s.primary_emotion,
                  emotion_tags: s.emotion_tags.includes(msg.emotion!)
                    ? s.emotion_tags
                    : [...s.emotion_tags, msg.emotion!],
                  has_laptop_actions: s.has_laptop_actions || msg.role === 'tool',
                }
              : s
          )
        );
      }
      const client = getSupabaseClient();
      if (client) {
        await client.from('conversation_messages').insert({
          session_id: sessionId,
          seq,
          role: msg.role,
          content_text: msg.content_text,
          content_roman: msg.content_roman,
          content_en: msg.content_en,
          emotion: msg.emotion,
          command_id: msg.command_id,
        });
      }
      return row;
    },
    [messagesBySession, ownerProfile.id]
  );

  const endSession = useCallback(async (sessionId: string, summary?: string) => {
    const endIso = nowIso();
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const duration = Math.max(
          1,
          Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000)
        );
        return {
          ...s,
          status: 'ended',
          ended_at: endIso,
          duration_seconds: duration,
          summary: summary ?? s.summary,
          updated_at: endIso,
        };
      })
    );
    const client = getSupabaseClient();
    if (client) {
      await client
        .from('conversation_sessions')
        .update({ status: 'ended', ended_at: endIso, summary })
        .eq('id', sessionId);
    }
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      const client = getSupabaseClient();
      if (client) {
        await client.from('conversation_sessions').delete().eq('id', sessionId);
      }
      showToast('Conversation removed.', 'info');
    },
    [showToast]
  );

  // Memories
  const addMemory = useCallback(
    async (
      input: Pick<MemoryItem, 'content' | 'category' | 'memory_type' | 'importance'> & {
        source?: 'conversation' | 'manual';
        source_session_id?: string | null;
      }
    ) => {
      const mem: MemoryItem = {
        id: uuid(),
        owner_id: ownerProfile.id,
        content: input.content,
        category: input.category,
        memory_type: input.memory_type,
        source: input.source ?? 'manual',
        source_session_id: input.source_session_id ?? null,
        importance: input.importance,
        is_pinned: false,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      const client = getSupabaseClient();
      if (client) {
        const { data } = await client
          .from('memories')
          .insert({
            content: mem.content,
            category: mem.category,
            memory_type: mem.memory_type,
            source: mem.source,
            source_session_id: mem.source_session_id,
            importance: mem.importance,
          })
          .select('*')
          .single();
        if (data) {
          const inserted = data as MemoryItem;
          setMemories((prev) => [inserted, ...prev]);
          return inserted;
        }
      }
      setMemories((prev) => [mem, ...prev]);
      return mem;
    },
    [ownerProfile.id]
  );

  const updateMemory = useCallback(async (id: string, patch: Partial<MemoryItem>) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch, updated_at: nowIso() } : m))
    );
    const client = getSupabaseClient();
    if (client) {
      await client.from('memories').update(patch).eq('id', id);
    }
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    const client = getSupabaseClient();
    if (client) {
      await client.from('memories').delete().eq('id', id);
    }
  }, []);

  const purgeAllMemories = useCallback(
    async (pin: string) => {
      if (ownerProfile.pin_set_at) {
        const res = await verifyPin(pin);
        if (!res.ok) return { ok: false, error: `Wrong PIN (${res.attempts_left} attempts left)` };
      } else {
        const parsed = pinSchema.safeParse(pin);
        if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
      }
      const client = getSupabaseClient();
      if (client) {
        await client.from('memories').delete().neq('id', '');
      }
      setMemories([]);
      return { ok: true };
    },
    [ownerProfile.pin_set_at, verifyPin]
  );

  // Automations
  const createAutomation = useCallback(
    async (
      input: Omit<
        Automation,
        'id' | 'owner_id' | 'last_run_at' | 'run_count' | 'created_at' | 'updated_at'
      >
    ) => {
      const row: Automation = {
        ...input,
        id: uuid(),
        owner_id: ownerProfile.id,
        last_run_at: null,
        run_count: 0,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      const client = getSupabaseClient();
      if (client) {
        const { data } = await client.from('automations').insert(input).select('*').single();
        if (data) {
          const inserted = data as Automation;
          setAutomations((prev) => [inserted, ...prev]);
          return inserted;
        }
      }
      setAutomations((prev) => [row, ...prev]);
      return row;
    },
    [ownerProfile.id]
  );

  const updateAutomation = useCallback(async (id: string, patch: Partial<Automation>) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch, updated_at: nowIso() } : a))
    );
    const client = getSupabaseClient();
    if (client) {
      await client.from('automations').update(patch).eq('id', id);
    }
  }, []);

  const deleteAutomation = useCallback(async (id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    const client = getSupabaseClient();
    if (client) {
      await client.from('automations').delete().eq('id', id);
    }
  }, []);

  const runAutomation = useCallback(
    async (id: string, dryRun = false): Promise<AutomationRun> => {
      const auto = automations.find((a) => a.id === id);
      const stepResults = (auto?.steps ?? []).map((step) => {
        const classified = classifyLaptopCommand({
          command_type: step.command_type,
          params: step.params,
          source: 'automation',
          panic_active: settings.panic_active,
          mic_enabled: settings.mic_enabled,
          safety_level: settings.safety_level,
          permission_rules: permissionRules,
          ask_before_rules: askBeforeRules,
        });
        return { step, classified };
      });

      const anyBlocked = stepResults.some((r) => r.classified.status === 'blocked');
      if (!dryRun && auto) {
        for (const r of stepResults) {
          await dispatchCommand(r.step.command_type, r.step.params, 'automation', null, auto.id);
        }
        await updateAutomation(id, {
          last_run_at: nowIso(),
          run_count: auto.run_count + 1,
        });
      }

      const run: AutomationRun = {
        id: uuid(),
        owner_id: ownerProfile.id,
        automation_id: id,
        mode: dryRun ? 'dry_run' : 'live',
        status: anyBlocked ? 'partial' : 'success',
        details: { steps: stepResults },
        created_at: nowIso(),
        finished_at: nowIso(),
      };
      setAutomationRuns((prev) => [run, ...prev.slice(0, 29)]);
      return run;
    },
    [
      askBeforeRules,
      automations,
      dispatchCommand,
      ownerProfile.id,
      permissionRules,
      settings.mic_enabled,
      settings.panic_active,
      settings.safety_level,
      updateAutomation,
    ]
  );

  // Reminders & Prayer
  const createReminder = useCallback(
    async (
      input: Omit<
        Reminder,
        'id' | 'owner_id' | 'is_completed' | 'completed_at' | 'created_at' | 'updated_at'
      >
    ) => {
      const row: Reminder = {
        ...input,
        id: uuid(),
        owner_id: ownerProfile.id,
        is_completed: false,
        completed_at: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      const client = getSupabaseClient();
      if (client) {
        const { data } = await client.from('reminders').insert(input).select('*').single();
        if (data) {
          const inserted = data as Reminder;
          setReminders((prev) => [...prev, inserted]);
          return inserted;
        }
      }
      setReminders((prev) => [...prev, row]);
      return row;
    },
    [ownerProfile.id]
  );

  const toggleReminderComplete = useCallback(
    async (id: string) => {
      const existing = reminders.find((r) => r.id === id);
      if (!existing) return;
      const next = !existing.is_completed;
      const completedAt = next ? nowIso() : null;
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_completed: next, completed_at: completedAt } : r
        )
      );
      const client = getSupabaseClient();
      if (client) {
        await client
          .from('reminders')
          .update({ is_completed: next, completed_at: completedAt })
          .eq('id', id);
      }
    },
    [reminders]
  );

  const deleteReminder = useCallback(async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    const client = getSupabaseClient();
    if (client) {
      await client.from('reminders').delete().eq('id', id);
    }
  }, []);

  const savePrayerSettings = useCallback(
    async (patch: Partial<PrayerSettings>) => {
      const merged: PrayerSettings = {
        ...prayerSettings,
        ...patch,
        updated_at: nowIso(),
      };
      // If city matches a preset and coordinates weren't supplied, auto-populate
      if (patch.city && (!patch.latitude || !patch.longitude)) {
        const preset = CITY_PRESETS.find((c) => c.city.toLowerCase() === patch.city?.toLowerCase());
        if (preset) {
          merged.country = preset.country;
          merged.latitude = preset.latitude;
          merged.longitude = preset.longitude;
          merged.timezone = preset.timezone;
        }
      }
      setPrayerSettings(merged);
      const client = getSupabaseClient();
      if (client) {
        await client.from('prayer_settings').upsert(merged);
        if (merged.latitude != null && merged.longitude != null) {
          const calc = calculatePrayerTimesForDate(
            merged.latitude,
            merged.longitude,
            new Date(),
            merged.calculation_method,
            merged.asr_method
          );
          const toHm = (d: Date) =>
            `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
          await client.from('prayer_times_cache').upsert({
            owner_id: ownerProfile.id,
            date: calc.date,
            fajr: toHm(calc.fajr),
            sunrise: toHm(calc.sunrise),
            zuhr: toHm(calc.zuhr),
            asr: toHm(calc.asr),
            maghrib: toHm(calc.maghrib),
            isha: toHm(calc.isha),
            source: 'calculated',
            fetched_at: nowIso(),
          });
        }
      }
    },
    [ownerProfile.id, prayerSettings]
  );

  const resetDataWorkspace = useCallback(
    async (pin: string) => {
      if (ownerProfile.pin_set_at) {
        const res = await verifyPin(pin);
        if (!res.ok) return { ok: false, error: `Wrong PIN (${res.attempts_left} attempts left)` };
      } else {
        const parsed = pinSchema.safeParse(pin);
        if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
      }
      const client = getSupabaseClient();
      if (client) {
        await Promise.all([
          client.from('memories').delete().neq('id', ''),
          client.from('conversation_sessions').delete().neq('id', ''),
          client.from('reminders').delete().neq('id', ''),
          client.from('automations').delete().neq('id', ''),
          client.from('emotion_logs').delete().neq('id', ''),
        ]);
      }
      setMemories([]);
      setSessions([]);
      setMessagesBySession({});
      setReminders([]);
      setAutomations([]);
      setEmotionLogs([]);
      return { ok: true };
    },
    [ownerProfile.pin_set_at, verifyPin]
  );

  const value: ZaraContextValue = {
    supabaseConfigured: configured,
    loading,
    authAuthenticated,
    isOwner,
    isUnlocked,
    hasPinSet: configured ? Boolean(ownerProfile.pin_set_at) : Boolean(localPinHashRef.current),
    ownerProfile,
    settings,
    providers,
    persona,
    voices,
    emotionSettings,
    emotionLogs,
    sessions,
    messagesBySession,
    memories,
    automations,
    automationRuns,
    reminders,
    prayerSettings,
    device,
    deviceOnline,
    commands,
    permissionRules,
    askBeforeRules,
    activityLog,
    filesIndex,

    signInWithMasterPassword,
    verifyPin,
    setPin,
    lockScreen,
    logout,
    autostartUnlock,
    openConfirmModal,

    updateSettings,
    testProvider,
    panicStop,
    panicResume,
    updatePermissionRule,
    updateAskBeforeRule,

    updatePersona,
    resetPersonaDefaults,
    selectVoice,
    updateVoiceProfile,
    updateEmotionIntensity,
    logEmotion,

    dispatchCommand,
    confirmCommand,
    cancelCommand,
    starFile,
    resetDataWorkspace,

    createSession,
    appendMessage,
    endSession,
    deleteSession,

    addMemory,
    updateMemory,
    deleteMemory,
    purgeAllMemories,

    createAutomation,
    updateAutomation,
    deleteAutomation,
    runAutomation,

    createReminder,
    toggleReminderComplete,
    deleteReminder,
    savePrayerSettings,
  };

  return (
    <ZaraContext.Provider value={value}>
      {children}
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </ZaraContext.Provider>
  );
}
