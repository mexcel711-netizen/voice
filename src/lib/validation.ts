import { z } from 'zod';
import { COMMAND_CATALOG } from './safety';
import type { CommandType } from '../types/db';

export const masterLoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid owner email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const pinSchema = z
  .string()
  .regex(/^\d{6}$/, 'PIN must be exactly 6 numeric digits.');

export const reminderSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Reminder title is required.')
    .max(120, 'Title must be 120 characters or less.'),
  kind: z.enum(['reminder', 'timer', 'alarm']),
  due_at: z.string().min(1, 'Date and time is required.'),
  repeat_rule: z.enum(['none', 'daily', 'weekdays', 'weekly']),
  category: z.enum(['work_code', 'personal_health', 'other']),
  notify_mode: z.enum(['voice', 'notification', 'both']),
  notes: z.string().max(400).optional().default(''),
});

export const memorySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Memory text is required.')
    .max(1000, 'Memory cannot exceed 1000 characters.'),
  category: z.enum([
    'personal',
    'work_code',
    'relationship',
    'dates',
    'habits',
    'other',
  ]),
  memory_type: z.enum(['episodic', 'semantic']).default('semantic'),
  importance: z.number().int().min(1).max(5).default(3),
});

const VALID_COMMANDS = new Set<string>(COMMAND_CATALOG.map((c) => c.command_type));

export const automationSchema = z
  .object({
    kind: z.enum(['voice_command', 'routine', 'hardware_trigger']),
    name: z.string().trim().min(1, 'Routine name is required.').max(100),
    description: z.string().max(300).optional().default(''),
    trigger_phrase: z.string().nullable().optional(),
    schedule_time: z.string().nullable().optional(),
    trigger_event: z.string().nullable().optional(),
    steps: z
      .array(
        z.object({
          order: z.number().int().min(1),
          command_type: z.string().refine((val) => VALID_COMMANDS.has(val), {
            message: 'Unknown command_type — must exist in command catalog.',
          }),
          params: z.record(z.string(), z.unknown()).default({}),
        })
      )
      .min(1, 'Add at least 1 valid step to the automation.'),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'voice_command' && !data.trigger_phrase?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Trigger phrase is required for voice commands.',
        path: ['trigger_phrase'],
      });
    }
    if (data.kind === 'routine' && !data.schedule_time?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Schedule time is required for routines.',
        path: ['schedule_time'],
      });
    }
    if (data.kind === 'hardware_trigger' && !data.trigger_event?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hardware event trigger is required.',
        path: ['trigger_event'],
      });
    }
  });

export const personaInstructionsSchema = z
  .string()
  .max(4000, 'Custom instructions cannot exceed 4000 characters.');

export function validateFileRename(newName: string): { ok: boolean; error?: string } {
  const trimmed = newName.trim();
  if (!trimmed) return { ok: false, error: 'File name cannot be empty.' };
  if (/[/\\:]/.test(trimmed)) {
    return { ok: false, error: 'File name cannot contain /, \\, or : characters.' };
  }
  if (trimmed.length > 255) {
    return { ok: false, error: 'File name is too long (max 255 chars).' };
  }
  return { ok: true };
}

export function isValidCatalogCommand(commandType: string): commandType is CommandType {
  return VALID_COMMANDS.has(commandType);
}
