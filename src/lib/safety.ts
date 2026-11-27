import type {
  ActivityLogEntry,
  AskBeforeRule,
  CommandCatalogItem,
  CommandSource,
  CommandStatus,
  CommandType,
  ConfirmationMethod,
  PermissionRule,
  RiskLevel,
  SafetyLevel,
} from '../types/db';

export const COMMAND_CATALOG: CommandCatalogItem[] = [
  { command_type: 'open_app', display_action: 'Apps.Open', permission_key: 'apps_control', default_risk: 'low', description: 'Launch a desktop application by name', param_schema: { name: 'string' } },
  { command_type: 'close_app', display_action: 'Apps.Close', permission_key: 'apps_control', default_risk: 'medium', description: 'Close a running application', param_schema: { name: 'string' } },
  { command_type: 'list_running_apps', display_action: 'Apps.List', permission_key: 'apps_control', default_risk: 'low', description: 'Query active desktop applications', param_schema: {} },
  { command_type: 'focus_mode_toggle', display_action: 'System.FocusMode', permission_key: 'system_settings', default_risk: 'low', description: 'Toggle Focus / Do Not Disturb mode', param_schema: { enabled: 'boolean' } },
  { command_type: 'set_volume', display_action: 'System.Volume', permission_key: 'system_settings', default_risk: 'low', description: 'Adjust master audio output volume (0-100)', param_schema: { percent: 'number' } },
  { command_type: 'mute_toggle', display_action: 'System.Mute', permission_key: 'system_settings', default_risk: 'low', description: 'Toggle system audio mute', param_schema: { muted: 'boolean' } },
  { command_type: 'set_brightness', display_action: 'System.Brightness', permission_key: 'system_settings', default_risk: 'low', description: 'Adjust screen brightness (0-100)', param_schema: { percent: 'number' } },
  { command_type: 'night_shift_toggle', display_action: 'System.NightShift', permission_key: 'system_settings', default_risk: 'low', description: 'Toggle warm display Night Shift', param_schema: { enabled: 'boolean' } },
  { command_type: 'lock_screen', display_action: 'System.Lock', permission_key: 'system_settings', default_risk: 'low', description: 'Lock the laptop display immediately', param_schema: {} },
  { command_type: 'get_telemetry', display_action: 'System.Telemetry', permission_key: 'system_settings', default_risk: 'low', description: 'Refresh battery, CPU, and network telemetry', param_schema: {} },
  { command_type: 'sleep', display_action: 'Power.Sleep', permission_key: 'power_control', default_risk: 'critical', description: 'Put laptop into sleep state', param_schema: {} },
  { command_type: 'restart', display_action: 'Power.Restart', permission_key: 'power_control', default_risk: 'critical', description: 'Restart the laptop', param_schema: {} },
  { command_type: 'shutdown', display_action: 'Power.Shutdown', permission_key: 'power_control', default_risk: 'critical', description: 'Shut down the laptop', param_schema: {} },
  { command_type: 'screenshot', display_action: 'Screen.Capture', permission_key: 'screen_observation', default_risk: 'medium', description: 'Capture desktop screen snapshot', param_schema: {} },
  { command_type: 'open_url', display_action: 'Browser.Open', permission_key: 'browser_automation', default_risk: 'low', description: 'Open URL in default browser', param_schema: { url: 'string' } },
  { command_type: 'media_control', display_action: 'Media.Control', permission_key: 'browser_automation', default_risk: 'low', description: 'Play, pause, next, or previous media track', param_schema: { action: 'string' } },
  { command_type: 'search_files', display_action: 'FileSystem.Search', permission_key: 'files_read_write', default_risk: 'low', description: 'Search files & apps on laptop', param_schema: { query: 'string' } },
  { command_type: 'open_file', display_action: 'FileSystem.Open', permission_key: 'files_read_write', default_risk: 'medium', description: 'Open file in default application', param_schema: { path: 'string' } },
  { command_type: 'reveal_file', display_action: 'FileSystem.Reveal', permission_key: 'files_read_write', default_risk: 'low', description: 'Reveal file in Finder / Explorer', param_schema: { path: 'string' } },
  { command_type: 'rename_file', display_action: 'FileSystem.Rename', permission_key: 'files_read_write', default_risk: 'medium', description: 'Rename an indexed file', param_schema: { path: 'string', new_name: 'string' } },
  { command_type: 'trash_file', display_action: 'FileSystem.Trash', permission_key: 'files_read_write', default_risk: 'high', description: 'Move file to system Trash / Recycle Bin', param_schema: { path: 'string', size_bytes: 'number' } },
  { command_type: 'run_terminal', display_action: 'Terminal.Execute', permission_key: 'terminal_shell', default_risk: 'high', description: 'Run a shell command in allowed workspace', param_schema: { command: 'string' } },
];

export const DEFAULT_PERMISSION_RULES: Omit<PermissionRule, 'id' | 'owner_id' | 'created_at' | 'updated_at'>[] = [
  { permission_key: 'files_read_write', label: 'Local File System Read/Write', risk_level: 'medium', is_enabled: true, mode: 'allow', scope: { allowed_paths: ['~/Projects', '~/Documents', '~/Downloads', '~/Desktop'] } },
  { permission_key: 'terminal_shell', label: 'Terminal & Shell Execution', risk_level: 'high', is_enabled: true, mode: 'voice_confirm', scope: {} },
  { permission_key: 'screen_observation', label: 'Screen Observation', risk_level: 'medium', is_enabled: true, mode: 'allow', scope: {} },
  { permission_key: 'browser_automation', label: 'Browser Automation', risk_level: 'low', is_enabled: true, mode: 'allow', scope: {} },
  { permission_key: 'power_control', label: 'System Power Control', risk_level: 'critical', is_enabled: true, mode: 'pin_required', scope: {} },
  { permission_key: 'apps_control', label: 'Apps Control', risk_level: 'low', is_enabled: true, mode: 'allow', scope: {} },
  { permission_key: 'system_settings', label: 'System Settings', risk_level: 'low', is_enabled: true, mode: 'allow', scope: {} },
  { permission_key: 'messaging', label: 'Messaging (Coming later)', risk_level: 'high', is_enabled: false, mode: 'voice_confirm', scope: {} },
];

export const DEFAULT_ASK_BEFORE_RULES: Omit<AskBeforeRule, 'id' | 'owner_id' | 'created_at' | 'updated_at'>[] = [
  { rule_key: 'large_file_delete', label: 'Deleting or relocating files larger than 10MB', threshold: { size_mb: 10 }, required_method: 'pin', is_enforced: true },
  { rule_key: 'outgoing_messages', label: 'Dispatching outgoing emails, Slack or WhatsApp messages', threshold: {}, required_method: 'voice', is_enforced: true },
  { rule_key: 'dangerous_terminal', label: 'Terminal calls containing sudo, rm -rf, mkfs, format, or kill', threshold: { patterns: ['rm -rf', 'sudo rm', 'mkfs', 'format', 'sudo ', 'kill -9'] }, required_method: 'pin', is_enforced: true },
  { rule_key: 'secret_access', label: 'Inspecting private keys, passwords, or encrypted .env vaults', threshold: { patterns: ['.env', 'id_rsa', '.pem'] }, required_method: 'pin', is_enforced: true },
];

const RISK_ORDER: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
}

export interface ClassifyCommandInput {
  command_type: CommandType | string;
  params: Record<string, unknown>;
  source: CommandSource;
  panic_active: boolean;
  mic_enabled: boolean;
  safety_level: SafetyLevel;
  permission_rules: Array<Pick<PermissionRule, 'permission_key' | 'is_enabled' | 'mode' | 'scope'>>;
  ask_before_rules: Array<Pick<AskBeforeRule, 'rule_key' | 'threshold' | 'required_method' | 'is_enforced'>>;
}

export interface ClassifyCommandOutput {
  risk_level: RiskLevel;
  confirmation_method: ConfirmationMethod;
  status: Extract<CommandStatus, 'queued' | 'awaiting_confirmation' | 'blocked'>;
  blocked_reason: string | null;
  display_action: string;
}

/**
 * Pure mirror of 05_Backend_Schema.md `classify_laptop_command()` trigger rules
 * used for local preflight/dry-run testing and unit tests. Real enforcement happens in DB trigger.
 */
export function classifyLaptopCommand(input: ClassifyCommandInput): ClassifyCommandOutput {
  const catalog = COMMAND_CATALOG.find((c) => c.command_type === input.command_type);
  if (!catalog) {
    return {
      risk_level: 'high',
      confirmation_method: 'none',
      status: 'blocked',
      blocked_reason: 'unknown_command_type',
      display_action: String(input.command_type),
    };
  }

  if (input.panic_active) {
    return {
      risk_level: catalog.default_risk,
      confirmation_method: 'none',
      status: 'blocked',
      blocked_reason: 'panic_active',
      display_action: catalog.display_action,
    };
  }

  if (input.source === 'voice' && !input.mic_enabled) {
    return {
      risk_level: catalog.default_risk,
      confirmation_method: 'none',
      status: 'blocked',
      blocked_reason: 'mic_disabled',
      display_action: catalog.display_action,
    };
  }

  const rule = input.permission_rules.find((r) => r.permission_key === catalog.permission_key);
  if (!rule || !rule.is_enabled || rule.mode === 'deny') {
    return {
      risk_level: catalog.default_risk,
      confirmation_method: 'none',
      status: 'blocked',
      blocked_reason: 'permission_denied',
      display_action: catalog.display_action,
    };
  }

  let riskLevel: RiskLevel = catalog.default_risk;
  let forcePin = false;

  const targetPath = typeof input.params?.path === 'string' ? input.params.path : '';
  const sizeBytes = typeof input.params?.size_bytes === 'number' ? input.params.size_bytes : 0;
  const terminalCmd = typeof input.params?.command === 'string' ? input.params.command.toLowerCase() : '';

  // Check allowed_paths boundary when a file path is given
  const allowedPaths = Array.isArray(rule.scope?.allowed_paths)
    ? (rule.scope.allowed_paths as string[])
    : [];
  if (targetPath && allowedPaths.length > 0) {
    const normalizedPath = targetPath.replace(/\\/g, '/');
    const inAllowed = allowedPaths.some((prefix) =>
      normalizedPath.startsWith(prefix.replace(/\\/g, '/'))
    );
    if (!inAllowed) {
      return {
        risk_level: 'high',
        confirmation_method: 'none',
        status: 'blocked',
        blocked_reason: 'outside_allowed_paths',
        display_action: catalog.display_action,
      };
    }
  }

  const largeFileRule = input.ask_before_rules.find((r) => r.rule_key === 'large_file_delete');
  if (
    largeFileRule?.is_enforced &&
    (input.command_type === 'trash_file' || input.command_type === 'rename_file')
  ) {
    const limitMb = Number(largeFileRule.threshold?.size_mb ?? 10);
    if (sizeBytes > limitMb * 1024 * 1024) {
      riskLevel = maxRisk(riskLevel, 'high');
      forcePin = true;
    }
  }

  const dangerousTermRule = input.ask_before_rules.find((r) => r.rule_key === 'dangerous_terminal');
  if (dangerousTermRule?.is_enforced && input.command_type === 'run_terminal') {
    const patterns = Array.isArray(dangerousTermRule.threshold?.patterns)
      ? (dangerousTermRule.threshold.patterns as string[])
      : ['rm -rf', 'sudo rm', 'mkfs', 'format'];
    if (patterns.some((p) => terminalCmd.includes(p.toLowerCase()))) {
      riskLevel = 'critical';
      forcePin = true;
    }
  }

  const secretRule = input.ask_before_rules.find((r) => r.rule_key === 'secret_access');
  if (secretRule?.is_enforced && (targetPath || terminalCmd)) {
    const patterns = Array.isArray(secretRule.threshold?.patterns)
      ? (secretRule.threshold.patterns as string[])
      : ['.env', 'id_rsa', '.pem'];
    const combined = `${targetPath.toLowerCase()} ${terminalCmd}`;
    if (
      patterns.some((p) => {
        const clean = p.replace('*', '').toLowerCase();
        return clean.length > 0 && combined.includes(clean);
      })
    ) {
      riskLevel = maxRisk(riskLevel, 'high');
      forcePin = true;
    }
  }

  let method: ConfirmationMethod = 'none';
  if (forcePin || rule.mode === 'pin_required' || riskLevel === 'critical') {
    method = 'pin';
  } else if (rule.mode === 'voice_confirm') {
    method = 'voice';
  }

  // safety_level escalations
  if (method === 'none') {
    if (input.safety_level === 'restricted' && RISK_ORDER[riskLevel] >= RISK_ORDER.medium) {
      method = 'manual';
    } else if (input.safety_level === 'prompt_on_risk' && RISK_ORDER[riskLevel] >= RISK_ORDER.high) {
      method = 'manual';
    }
  }

  const status = method === 'none' ? 'queued' : 'awaiting_confirmation';

  return {
    risk_level: riskLevel,
    confirmation_method: method,
    status,
    blocked_reason: null,
    display_action: catalog.display_action,
  };
}

export function activityLedgerToCsv(entries: ActivityLogEntry[]): string {
  const header = [
    'id',
    'created_at',
    'action',
    'status',
    'risk_level',
    'verified_by',
    'detail',
    'prev_hash',
    'entry_hash',
  ];
  const escape = (val: unknown): string => {
    const s = String(val ?? '');
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const rows = entries.map((e) =>
    [
      e.id,
      e.created_at,
      e.action,
      e.status,
      e.risk_level,
      e.verified_by,
      e.detail ?? '',
      e.prev_hash ?? '',
      e.entry_hash,
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}
