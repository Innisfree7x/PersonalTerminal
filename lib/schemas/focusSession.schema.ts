import { z } from 'zod';

export const focusSessionCategoryValues = ['study', 'work', 'exercise', 'reading', 'other'] as const;
export type FocusSessionCategory = (typeof focusSessionCategoryValues)[number];

export const focusSessionTypeValues = ['focus', 'break'] as const;
export type FocusSessionType = (typeof focusSessionTypeValues)[number];

export const createFocusSessionSchema = z.object({
  sessionType: z.enum(focusSessionTypeValues).default('focus'),
  durationSeconds: z.number().int().positive(),
  plannedDurationSeconds: z.number().int().positive(),
  startedAt: z.preprocess(
    (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : arg),
    z.date()
  ),
  endedAt: z.preprocess(
    (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : arg),
    z.date()
  ),
  completed: z.boolean().default(false),
  label: z.string().max(100).optional().nullable(),
  category: z.enum(focusSessionCategoryValues).optional().nullable(),
});

export type CreateFocusSessionInput = z.infer<typeof createFocusSessionSchema>;

export interface FocusSession {
  id: string;
  sessionType: FocusSessionType;
  durationSeconds: number;
  plannedDurationSeconds: number;
  startedAt: Date;
  endedAt: Date;
  completed: boolean;
  label: string | null;
  category: FocusSessionCategory | null;
  createdAt: Date;
}
