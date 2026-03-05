import { z } from 'zod';

export const AI_COMMAND_MAX_CHARS = 280;
export const AI_COMMAND_TITLE_MAX_CHARS = 140;

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createTaskIntentSchema = z.object({
  kind: z.literal('create-task'),
  title: z.string().trim().min(1).max(AI_COMMAND_TITLE_MAX_CHARS),
  deadline: isoDateSchema.nullable(),
  deadlineLabel: z.string().trim().min(1).max(100).nullable(),
});

const planFocusIntentSchema = z.object({
  kind: z.literal('plan-focus'),
  durationMin: z.number().int().min(1).max(180),
});

const createGoalIntentSchema = z.object({
  kind: z.literal('create-goal'),
  title: z.string().trim().min(1).max(AI_COMMAND_TITLE_MAX_CHARS),
});

const openPageIntentSchema = z.object({
  kind: z.literal('open-page'),
  page: z.string().trim().min(1).max(32),
  path: z.string().trim().regex(/^\/[a-z0-9\-/_]*$/i),
});

export const commandIntentSchema = z.discriminatedUnion('kind', [
  createTaskIntentSchema,
  planFocusIntentSchema,
  createGoalIntentSchema,
  openPageIntentSchema,
]);

export type CommandIntent = z.infer<typeof commandIntentSchema>;

export const commandPreviewSchema = z.string().trim().min(1).max(200);

