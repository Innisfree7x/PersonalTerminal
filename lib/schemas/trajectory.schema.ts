import { z } from 'zod';

export const trajectoryGoalCategoryValues = ['thesis', 'gmat', 'master_app', 'internship', 'other'] as const;
export const trajectoryGoalStatusValues = ['active', 'done', 'archived'] as const;
export const trajectoryWindowTypeValues = ['internship', 'master_cycle', 'exam_period', 'other'] as const;
export const trajectoryWindowConfidenceValues = ['low', 'medium', 'high'] as const;
export const trajectoryBlockStatusValues = ['planned', 'in_progress', 'done', 'skipped'] as const;

export const trajectoryDateSchema = z.preprocess(
  (arg) => {
    if (typeof arg === 'string') {
      const d = new Date(`${arg}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
    if (arg instanceof Date) {
      return arg.toISOString().split('T')[0];
    }
    return arg;
  },
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
);

export const trajectorySettingsSchema = z.object({
  hoursPerWeek: z.number().int().min(1).max(60),
  horizonMonths: z.number().int().min(6).max(36).default(24),
});

export const commitmentModeValues = ['fixed', 'flexible', 'lead-time'] as const;

const trajectoryGoalBaseFields = {
  title: z.string().min(1).max(200),
  category: z.enum(trajectoryGoalCategoryValues),
  effortHours: z.number().int().min(1).max(2000),
  bufferWeeks: z.number().int().min(0).max(16).default(2),
  priority: z.number().int().min(1).max(5).default(3),
  status: z.enum(trajectoryGoalStatusValues).default('active'),
};

export const createTrajectoryGoalSchema = z
  .discriminatedUnion('commitmentMode', [
    z.object({
      ...trajectoryGoalBaseFields,
      commitmentMode: z.literal('fixed'),
      fixedStartDate: trajectoryDateSchema,
      fixedEndDate: trajectoryDateSchema,
      dueDate: trajectoryDateSchema.optional(),
    }),
    z.object({
      ...trajectoryGoalBaseFields,
      commitmentMode: z.literal('flexible'),
      dueDate: trajectoryDateSchema,
    }),
    z.object({
      ...trajectoryGoalBaseFields,
      commitmentMode: z.literal('lead-time'),
      dueDate: trajectoryDateSchema,
      leadTimeWeeks: z.number().int().min(1).max(104),
    }),
  ])
  .superRefine((value, ctx) => {
    if (
      value.commitmentMode === 'fixed' &&
      value.fixedEndDate < value.fixedStartDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fixedEndDate must be >= fixedStartDate',
        path: ['fixedEndDate'],
      });
    }
  });

export const updateTrajectoryGoalSchema = z.object({
  ...trajectoryGoalBaseFields,
  commitmentMode: z.enum(commitmentModeValues).optional(),
  dueDate: trajectoryDateSchema.optional(),
  fixedStartDate: trajectoryDateSchema.optional(),
  fixedEndDate: trajectoryDateSchema.optional(),
  leadTimeWeeks: z.number().int().min(1).max(104).optional(),
}).partial();

const trajectoryWindowBaseSchema = z.object({
  title: z.string().min(1).max(200),
  windowType: z.enum(trajectoryWindowTypeValues),
  startDate: trajectoryDateSchema,
  endDate: trajectoryDateSchema,
  confidence: z.enum(trajectoryWindowConfidenceValues).default('medium'),
  notes: z.string().max(2000).optional().nullable(),
});

export const createTrajectoryWindowSchema = trajectoryWindowBaseSchema.refine(
  (value) => value.endDate >= value.startDate,
  {
    message: 'endDate must be greater than or equal to startDate',
    path: ['endDate'],
  }
);

export const updateTrajectoryWindowSchema = trajectoryWindowBaseSchema.partial();

export const trajectoryPlanRequestSchema = z.object({
  simulationHoursPerWeek: z.number().int().min(1).max(60).optional(),
});

export const commitTrajectoryBlocksSchema = z.object({
  blocks: z
    .array(
      z
        .object({
          goalId: z.string().uuid(),
          title: z.string().min(1).max(200),
          startDate: trajectoryDateSchema,
          endDate: trajectoryDateSchema,
          weeklyHours: z.number().int().min(1).max(60),
          status: z.enum(trajectoryBlockStatusValues).default('planned'),
        })
        .refine((block) => block.endDate >= block.startDate, {
          message: 'endDate must be greater than or equal to startDate',
          path: ['endDate'],
        })
    )
    .min(1)
    .max(200),
});

export const createTrajectoryTaskPackageSchema = z.object({
  goalId: z.string().uuid(),
  startDate: trajectoryDateSchema,
  endDate: trajectoryDateSchema,
  taskCount: z.number().int().min(1).max(60).default(6),
});

export type TrajectorySettingsInput = z.infer<typeof trajectorySettingsSchema>;
export type CreateTrajectoryGoalInput = z.infer<typeof createTrajectoryGoalSchema>;
export type UpdateTrajectoryGoalInput = z.infer<typeof updateTrajectoryGoalSchema>;
export type CreateTrajectoryWindowInput = z.infer<typeof createTrajectoryWindowSchema>;
export type UpdateTrajectoryWindowInput = z.infer<typeof updateTrajectoryWindowSchema>;
export type TrajectoryPlanRequestInput = z.infer<typeof trajectoryPlanRequestSchema>;
export type CommitTrajectoryBlocksInput = z.infer<typeof commitTrajectoryBlocksSchema>;
export type CreateTrajectoryTaskPackageInput = z.infer<typeof createTrajectoryTaskPackageSchema>;
