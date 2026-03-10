import { z } from 'zod';

export const strategyDecisionStatusValues = ['draft', 'committed', 'archived'] as const;
export const strategyScoreModeValues = ['standard', 'deadline'] as const;

export const strategyDateSchema = z.preprocess(
  (arg) => {
    if (typeof arg === 'string' && arg.trim().length > 0) {
      const d = new Date(`${arg}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    if (arg instanceof Date) return arg.toISOString().split('T')[0];
    return arg;
  },
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
);

export const createStrategyDecisionSchema = z.object({
  title: z.string().min(1).max(180),
  context: z.string().max(2400).optional().nullable(),
  targetDate: strategyDateSchema.optional().nullable(),
  status: z.enum(strategyDecisionStatusValues).default('draft'),
});

export const updateStrategyDecisionSchema = createStrategyDecisionSchema.partial();

const optionScale = z.number().int().min(1).max(10);

export const createStrategyOptionSchema = z.object({
  decisionId: z.string().uuid(),
  title: z.string().min(1).max(160),
  summary: z.string().max(1600).optional().nullable(),
  impactPotential: optionScale.default(5),
  confidenceLevel: optionScale.default(5),
  strategicFit: optionScale.default(5),
  effortCost: optionScale.default(5),
  downsideRisk: optionScale.default(5),
  timeToValueWeeks: z.number().int().min(1).max(104).default(4),
});

export const updateStrategyOptionSchema = createStrategyOptionSchema
  .omit({ decisionId: true })
  .partial();

export const commitStrategyDecisionSchema = z.object({
  optionId: z.string().uuid(),
  scoreMode: z.enum(strategyScoreModeValues).default('standard'),
  taskDate: strategyDateSchema.optional(),
  note: z.string().max(400).optional().nullable(),
  taskTitle: z.string().max(220).optional().nullable(),
  timeEstimate: z.string().max(32).optional().nullable(),
  snoozeUntil: strategyDateSchema.optional().nullable(),
  followUpEnabled: z.boolean().optional().default(false),
  followUpDate: strategyDateSchema.optional().nullable(),
  followUpTitle: z.string().max(220).optional().nullable(),
});

export const scoreStrategyDecisionSchema = z.object({
  scoreMode: z.enum(strategyScoreModeValues).optional().default('standard'),
});

export type CreateStrategyDecisionInput = z.infer<typeof createStrategyDecisionSchema>;
export type UpdateStrategyDecisionInput = z.infer<typeof updateStrategyDecisionSchema>;
export type CreateStrategyOptionInput = z.infer<typeof createStrategyOptionSchema>;
export type UpdateStrategyOptionInput = z.infer<typeof updateStrategyOptionSchema>;
export type CommitStrategyDecisionInput = z.infer<typeof commitStrategyDecisionSchema>;
