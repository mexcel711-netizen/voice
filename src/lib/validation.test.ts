import test from 'node:test';
import assert from 'node:assert/strict';
import {
  automationSchema,
  memorySchema,
  pinSchema,
  reminderSchema,
  validateFileRename,
} from './validation';

test('pinSchema requires exactly 6 digits', () => {
  assert.equal(pinSchema.safeParse('123456').success, true);
  assert.equal(pinSchema.safeParse('12345').success, false);
  assert.equal(pinSchema.safeParse('12345a').success, false);
});

test('reminderSchema validates title length and fields', () => {
  assert.equal(
    reminderSchema.safeParse({
      title: 'Evening Chai Break',
      kind: 'reminder',
      due_at: '2026-11-27T17:30:00Z',
      repeat_rule: 'daily',
      category: 'personal_health',
      notify_mode: 'both',
    }).success,
    true
  );
  assert.equal(
    reminderSchema.safeParse({
      title: '',
      kind: 'reminder',
      due_at: '2026-11-27T17:30:00Z',
      repeat_rule: 'none',
      category: 'other',
      notify_mode: 'both',
    }).success,
    false
  );
});

test('memorySchema enforces non-empty content <= 1000 chars', () => {
  assert.equal(
    memorySchema.safeParse({
      content: 'Boss prefers chai after late coding sessions.',
      category: 'habits',
    }).success,
    true
  );
  assert.equal(
    memorySchema.safeParse({
      content: 'a'.repeat(1001),
      category: 'personal',
    }).success,
    false
  );
});

test('automationSchema rejects unknown command_type and missing triggers', () => {
  const valid = automationSchema.safeParse({
    kind: 'voice_command',
    name: 'Focus Protocol',
    trigger_phrase: 'Kaam shuru',
    steps: [{ order: 1, command_type: 'open_app', params: { name: 'VS Code' } }],
  });
  assert.equal(valid.success, true);

  const badCmd = automationSchema.safeParse({
    kind: 'voice_command',
    name: 'Bad Protocol',
    trigger_phrase: 'Kaam',
    steps: [{ order: 1, command_type: 'hack_nasa', params: {} }],
  });
  assert.equal(badCmd.success, false);
});

test('validateFileRename rejects /, \\, and : characters', () => {
  assert.equal(validateFileRename('Q1_Report_Final.pdf').ok, true);
  assert.equal(validateFileRename('bad/name.pdf').ok, false);
  assert.equal(validateFileRename('bad:name.pdf').ok, false);
  assert.equal(validateFileRename('bad\\name.pdf').ok, false);
});
