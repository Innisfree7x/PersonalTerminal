import { z } from 'zod';

export const GoalCategory = z.enum([
  'fitness',
  'career',
  'learning',
  'finance',
]);

export type GoalCategory = z.infer<typeof GoalCategory>;

const MetricsSchema = z.object({
  current: z.number(),
  target: z.number(),
  unit: z.string(),
});

export type Metrics = z.infer<typeof MetricsSchema>;

export const createGoalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be at most 100 characters'),
  description: z.string().optional(),
  targetDate: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg);
      }
      return arg;
    },
    z.date()
  ),
  category: GoalCategory,
  metrics: MetricsSchema.optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const GoalSchema = createGoalSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type Goal = z.infer<typeof GoalSchema>;
