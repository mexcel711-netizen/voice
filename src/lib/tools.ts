import { COMMAND_CATALOG } from './safety';

export const ZARA_FUNCTION_DECLARATIONS = [
  {
    name: 'laptop_command',
    description:
      'Queue a command for execution on Boss primary laptop via Zara Local Agent. Must use a valid command_type from command_catalog.',
    parameters: {
      type: 'OBJECT',
      properties: {
        command_type: {
          type: 'STRING',
          enum: COMMAND_CATALOG.map((c) => c.command_type),
          description: 'Catalog command identifier',
        },
        params: {
          type: 'OBJECT',
          description: 'Parameters specific to the command_type (e.g. { name: "Chrome" } or { percent: 30 })',
        },
      },
      required: ['command_type'],
    },
  },
  {
    name: 'report_emotion',
    description:
      'Report the detected mood of the user and Zara current emotional expression so UI mood chip & wave update in realtime.',
    parameters: {
      type: 'OBJECT',
      properties: {
        user_mood: {
          type: 'STRING',
          enum: ['happy', 'sad', 'angry', 'surprised', 'shy', 'laughing', 'caring', 'teasing', 'neutral', 'tired', 'stressed'],
        },
        zara_emotion: {
          type: 'STRING',
          enum: ['happy', 'sad', 'angry', 'surprised', 'shy', 'laughing', 'caring', 'teasing'],
        },
        intensity: {
          type: 'INTEGER',
          description: '0 to 100 intensity',
        },
      },
      required: ['zara_emotion', 'intensity'],
    },
  },
  {
    name: 'save_memory',
    description: 'Store an important fact or preference about Boss in the Memory Vault when auto-learn is enabled.',
    parameters: {
      type: 'OBJECT',
      properties: {
        content: { type: 'STRING', description: 'Concise factual memory (max 1000 chars)' },
        category: {
          type: 'STRING',
          enum: ['personal', 'work_code', 'relationship', 'dates', 'habits', 'other'],
        },
        memory_type: {
          type: 'STRING',
          enum: ['episodic', 'semantic'],
        },
        importance: {
          type: 'INTEGER',
          description: '1 to 5 importance level',
        },
      },
      required: ['content', 'category'],
    },
  },
  {
    name: 'create_reminder',
    description: 'Create a reminder, countdown timer, or alarm for Boss.',
    parameters: {
      type: 'OBJECT',
      properties: {
        kind: { type: 'STRING', enum: ['reminder', 'timer', 'alarm'] },
        title: { type: 'STRING' },
        due_at: { type: 'STRING', description: 'ISO 8601 timestamp' },
        repeat_rule: { type: 'STRING', enum: ['none', 'daily', 'weekdays', 'weekly'] },
        category: { type: 'STRING', enum: ['work_code', 'personal_health', 'other'] },
      },
      required: ['kind', 'title', 'due_at'],
    },
  },
  {
    name: 'get_schedule',
    description: 'Fetch upcoming reminders and today prayer times.',
    parameters: {
      type: 'OBJECT',
      properties: {
        range: { type: 'STRING', enum: ['today', 'tomorrow', 'week'] },
      },
      required: ['range'],
    },
  },
] as const;
