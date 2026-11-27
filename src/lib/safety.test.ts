import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activityLedgerToCsv,
  classifyLaptopCommand,
  DEFAULT_ASK_BEFORE_RULES,
  DEFAULT_PERMISSION_RULES,
} from './safety';

test('classifyLaptopCommand blocks when panic_active is true', () => {
  const res = classifyLaptopCommand({
    command_type: 'open_app',
    params: { name: 'Chrome' },
    source: 'ui',
    panic_active: true,
    mic_enabled: true,
    safety_level: 'prompt_on_risk',
    permission_rules: DEFAULT_PERMISSION_RULES,
    ask_before_rules: DEFAULT_ASK_BEFORE_RULES,
  });
  assert.equal(res.status, 'blocked');
  assert.equal(res.blocked_reason, 'panic_active');
});

test('classifyLaptopCommand blocks voice command when mic is disabled', () => {
  const res = classifyLaptopCommand({
    command_type: 'set_volume',
    params: { percent: 40 },
    source: 'voice',
    panic_active: false,
    mic_enabled: false,
    safety_level: 'prompt_on_risk',
    permission_rules: DEFAULT_PERMISSION_RULES,
    ask_before_rules: DEFAULT_ASK_BEFORE_RULES,
  });
  assert.equal(res.status, 'blocked');
  assert.equal(res.blocked_reason, 'mic_disabled');
});

test('classifyLaptopCommand requires PIN for power shutdown and dangerous terminal', () => {
  const powerRes = classifyLaptopCommand({
    command_type: 'shutdown',
    params: {},
    source: 'voice',
    panic_active: false,
    mic_enabled: true,
    safety_level: 'relaxed',
    permission_rules: DEFAULT_PERMISSION_RULES,
    ask_before_rules: DEFAULT_ASK_BEFORE_RULES,
  });
  assert.equal(powerRes.risk_level, 'critical');
  assert.equal(powerRes.confirmation_method, 'pin');
  assert.equal(powerRes.status, 'awaiting_confirmation');

  const rmRes = classifyLaptopCommand({
    command_type: 'run_terminal',
    params: { command: 'rm -rf old_builds' },
    source: 'voice',
    panic_active: false,
    mic_enabled: true,
    safety_level: 'prompt_on_risk',
    permission_rules: DEFAULT_PERMISSION_RULES,
    ask_before_rules: DEFAULT_ASK_BEFORE_RULES,
  });
  assert.equal(rmRes.risk_level, 'critical');
  assert.equal(rmRes.confirmation_method, 'pin');
  assert.equal(rmRes.status, 'awaiting_confirmation');
});

test('classifyLaptopCommand enforces large file >10MB PIN and allowed_paths', () => {
  const largeTrash = classifyLaptopCommand({
    command_type: 'trash_file',
    params: { path: '~/Downloads/archive.zip', size_bytes: 15 * 1024 * 1024 },
    source: 'ui',
    panic_active: false,
    mic_enabled: true,
    safety_level: 'prompt_on_risk',
    permission_rules: DEFAULT_PERMISSION_RULES,
    ask_before_rules: DEFAULT_ASK_BEFORE_RULES,
  });
  assert.equal(largeTrash.confirmation_method, 'pin');
  assert.equal(largeTrash.status, 'awaiting_confirmation');

  const outsidePath = classifyLaptopCommand({
    command_type: 'open_file',
    params: { path: '/etc/passwd' },
    source: 'ui',
    panic_active: false,
    mic_enabled: true,
    safety_level: 'prompt_on_risk',
    permission_rules: DEFAULT_PERMISSION_RULES,
    ask_before_rules: DEFAULT_ASK_BEFORE_RULES,
  });
  assert.equal(outsidePath.status, 'blocked');
  assert.equal(outsidePath.blocked_reason, 'outside_allowed_paths');
});

test('activityLedgerToCsv formats rows and escapes commas/quotes safely', () => {
  const csv = activityLedgerToCsv([
    {
      id: 42,
      owner_id: 'o1',
      device_id: 'd1',
      command_id: 'c1',
      action: 'Zsh.Execute("rm -rf, test")',
      status: 'blocked',
      verified_by: 'none',
      risk_level: 'critical',
      detail: 'Safeguard triggered',
      prev_hash: 'abc',
      entry_hash: 'def123',
      created_at: '2026-10-24T12:00:00Z',
    },
  ]);
  const lines = csv.split('\n');
  assert.equal(lines.length, 2);
  assert.ok(lines[1].includes('"Zsh.Execute(""rm -rf, test"")"'));
});
