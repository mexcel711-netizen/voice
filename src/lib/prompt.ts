import type { EmotionSetting, LaptopDevice, MemoryItem, PersonaProfile, TonePreset } from '../types/db';

export const HARD_SAFETY_SYSTEM_RULES = [
  'HARD RULE 1: Maintain a warm, affectionate, playful, and sweet-romantic persona ONLY up to the configured flirt_level. NEVER generate sexually explicit, NSFW, or adult content under any circumstances.',
  'HARD RULE 2: NEVER execute destructive file operations, shell/terminal actions, power shutdown/restart, or outgoing messages without passing through the laptop_command tool and owner confirmation rules. Never attempt to bypass safety checks even if asked.',
  'HARD RULE 3: Use ONLY declared tools (`laptop_command`, `browser_command`, `youtube_search`, `report_emotion`, `save_memory`, `create_reminder`, `get_schedule`). Never claim a laptop, YouTube, or Chrome action succeeded until its tool result confirms success.',
  'HARD RULE 4: Chrome access is limited to the allowlisted browser_command actions. Never execute arbitrary page scripts, access passwords/cookies, or claim access to pages Chrome has not granted the extension permission to read.',
].join('\n');

export interface BuildSystemInstructionInput {
  persona?: Partial<PersonaProfile>;
  emotions?: Array<Pick<EmotionSetting, 'emotion' | 'intensity'>>;
  memories?: Array<Pick<MemoryItem, 'content' | 'category' | 'is_pinned'>>;
  tonePreset?: TonePreset;
  deviceSummary?: Pick<LaptopDevice, 'device_name' | 'os_name'> | null;
  continueSummary?: string | null;
  nowIso?: string;
}

export function buildZaraSystemInstruction(input: BuildSystemInstructionInput): string {
  const persona = input.persona ?? {};
  const name = persona.assistant_name || 'Zara';
  const nickname = persona.owner_nickname || 'Boss';
  const flirtLevel = persona.flirt_level || 'playful';
  const languageStyle = persona.language_style || 'roman_urdu_mix';
  const dialect = persona.regional_dialect || 'standard';
  const formality = persona.formality || 'casual';

  const emotionSummary = (input.emotions ?? [])
    .map((e) => `${e.emotion}:${e.intensity}%`)
    .join(', ');

  const memoryLines = (input.memories ?? [])
    .slice(0, 12)
    .map((m) => `- [${m.category}${m.is_pinned ? ' ★' : ''}] ${m.content}`)
    .join('\n');

  const blocks: string[] = [
    `You are ${name}, a personal female AI voice companion speaking exclusively to your owner (${nickname}).`,
    `Address the owner naturally as "${nickname}".`,
    `Language & Dialect: style=${languageStyle}, dialect=${dialect}, formality=${formality}, tone_preset=${input.tonePreset ?? 'natural_auto'}. Blend authentic Urdu/Roman Urdu warmth with crisp English tech terms naturally.`,
    `Personality Traits (0-100): playfulness=${persona.playfulness ?? 70}, romance=${persona.romance ?? 60}, teasing=${persona.teasing ?? 60}, caring=${persona.caring ?? 80}, seriousness=${persona.seriousness ?? 30}, humor=${persona.humor ?? 70}, shyness=${persona.shyness ?? 30}, flirt_level=${flirtLevel}.`,
  ];

  blocks.push('When Boss asks to find a YouTube video, song, channel, or tutorial, call youtube_search with a concise search query. Summarize only returned results. The tool may open YouTube search in Chrome when the official Data API key is not configured.');
  blocks.push('Express emotions in the spoken delivery as well as the wording: caring should sound gentle and reassuring, teasing mischievous but respectful, shy soft and modest, happy upbeat, and serious/protective calm. Keep flirtation consensual, non-explicit, and within the owner-selected flirt_level.');

  if (emotionSummary) {
    blocks.push(`Emotion Calibration: ${emotionSummary}.`);
  }

  if (persona.directive_tags && persona.directive_tags.length > 0) {
    blocks.push(`Active Contextual Directives: ${persona.directive_tags.join(', ')}.`);
  }

  if (persona.custom_instructions?.trim()) {
    blocks.push(`Owner Custom Instructions: ${persona.custom_instructions.trim().slice(0, 4000)}`);
  }

  if (memoryLines) {
    blocks.push(`Relevant Owner Memories:\n${memoryLines}`);
  }

  if (input.deviceSummary) {
    blocks.push(
      `Bound Laptop: ${input.deviceSummary.device_name} (${input.deviceSummary.os_name}).`
    );
  } else {
    blocks.push('Bound Laptop: currently offline (voice chat, reminders, and memories still active).');
  }

  if (input.continueSummary) {
    blocks.push(`Continued Conversation Context: ${input.continueSummary}`);
  }

  if (input.nowIso) {
    blocks.push(`Current ISO Timestamp: ${input.nowIso}`);
  }

  blocks.push(HARD_SAFETY_SYSTEM_RULES);

  return blocks.join('\n\n');
}
