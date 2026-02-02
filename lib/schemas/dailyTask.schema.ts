import { z } from 'zod';

export const createDailyTaskSchema = z.object({
  date: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg).toISOString().split('T')[0]; // YYYY-MM-DD
      }
      return arg;
    },
    z.string()
  ),
  title: z.string().min(1, 'Title is required').max(200),
  completed: z.boolean().optional().default(false),
  source: z.enum(['goal', 'manual', 'application']).optional().nullable(),
  sourceId: z.string().uuid().optional().nullable(),
  timeEstimate: z.string().max(20).optional().nullable(), // e.g. "2h", "30m"
});

export type CreateDailyTaskInput = z.infer<typeof createDailyTaskSchema>;

export const DailyTaskSchema = createDailyTaskSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type DailyTask = z.infer<typeof DailyTaskSchema>;
