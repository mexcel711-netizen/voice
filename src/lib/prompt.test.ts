import test from 'node:test';
import assert from 'node:assert/strict';
import { buildZaraSystemInstruction, HARD_SAFETY_SYSTEM_RULES } from './prompt';

test('buildZaraSystemInstruction includes owner nickname, hard safety rules, and memories', () => {
  const prompt = buildZaraSystemInstruction({
    persona: {
      assistant_name: 'Zara',
      owner_nickname: 'Boss',
      flirt_level: 'romantic',
      language_style: 'roman_urdu_mix',
      directive_tags: ['Late night coding'],
    },
    memories: [{ content: 'Loves Elaichi Chai at 5 PM', category: 'habits', is_pinned: true }],
    deviceSummary: null,
  });

  assert.ok(prompt.includes('Boss'));
  assert.ok(prompt.includes('NEVER generate sexually explicit'));
  assert.ok(prompt.includes(HARD_SAFETY_SYSTEM_RULES));
  assert.ok(prompt.includes('Loves Elaichi Chai at 5 PM'));
  assert.ok(prompt.includes('currently offline'));
});
