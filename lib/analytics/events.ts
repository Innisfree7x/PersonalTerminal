import { z } from 'zod';

export const ANALYTICS_EVENT_NAMES = [
  'landing_cta_clicked',
  'landing_cta_primary_clicked',
  'landing_cta_secondary_clicked',
  'pricing_plan_selected',
  'signup_started',
  'signup_completed',
  'waitlist_segment_selected',
  'hero_simulated',
  'onboarding_started',
  'onboarding_step_completed',
  'onboarding_completed',
  'trajectory_goal_created',
  'trajectory_capacity_set',
  'trajectory_status_shown',
  'trajectory_briefing_opened',
  'demo_seed_started',
  'demo_seed_removed',
  'first_task_created',
  'first_course_created',
  'day2_return',
  'focus_screen_open',
  'focus_custom_duration_used',
  'lucian_toggle_changed',
  'lucian_spell_cast',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

const trajectoryStatusSchema = z.enum(['on_track', 'tight', 'at_risk']);
const trajectoryCategorySchema = z.enum(['thesis', 'gmat', 'master_app', 'internship', 'other']);
const waitlistSegmentSchema = z.enum(['thesis', 'gmat', 'internship', 'master_app', 'other']);

export const analyticsPayloadSchema = z
  .object({
    source: z.string().max(100).optional(),
    plan: z.string().max(100).optional(),
    variant: z.string().max(100).optional(),
    step: z.number().int().min(0).max(20).optional(),
    courses_count: z.number().int().min(0).max(50).optional(),
    task_created: z.boolean().optional(),
    demo_seeded: z.boolean().optional(),
    ids_removed: z.number().int().min(0).max(5000).optional(),
    count: z.number().int().min(0).max(100).optional(),
    route: z.string().max(100).optional(),
    trajectory_goal_id: z.string().trim().min(1).max(120).optional(),
    status: trajectoryStatusSchema.optional(),
    duration_minutes: z.number().int().min(1).max(600).optional(),
    enabled: z.boolean().optional(),
    ability: z.enum(['q', 'w', 'e', 'r']).optional(),
  })
  .catchall(z.union([z.string(), z.number(), z.boolean(), z.null()]));

const eventSpecificPayloadSchemas: Partial<Record<AnalyticsEventName, z.ZodTypeAny>> = {
  onboarding_step_completed: z
    .object({
      step: z.number().int().min(1).max(20),
      skipped: z.boolean().optional(),
    })
    .passthrough(),
  onboarding_completed: z
    .object({
      trajectory_status: trajectoryStatusSchema.optional(),
      trajectory_goal_id: z.string().trim().min(1).max(120).optional(),
      destination: z.enum(['/trajectory', '/today']).optional(),
      demo_seeded: z.boolean().optional(),
      courses_count: z.number().int().min(0).max(50).optional(),
      task_created: z.boolean().optional(),
    })
    .passthrough(),
  trajectory_goal_created: z
    .object({
      category: trajectoryCategorySchema,
      priority: z.number().int().min(1).max(5),
    })
    .passthrough(),
  trajectory_capacity_set: z
    .object({
      hours_per_week: z.number().int().min(5).max(60),
      horizon_months: z.number().int().min(6).max(36),
    })
    .passthrough(),
  trajectory_status_shown: z
    .object({
      status: trajectoryStatusSchema,
    })
    .passthrough(),
  trajectory_briefing_opened: z
    .object({
      source: z.string().min(1).max(100),
      route: z.string().max(100),
      trajectory_goal_id: z.string().trim().min(1).max(120).optional(),
      status: trajectoryStatusSchema.optional(),
    })
    .passthrough(),
  waitlist_segment_selected: z
    .object({
      source: z.string().min(1).max(100),
      segment: waitlistSegmentSchema,
    })
    .passthrough(),
  hero_simulated: z
    .object({
      source: z.string().min(1).max(100),
      hours_per_week: z.number().int().min(5).max(60),
      effort_hours: z.number().int().min(1).max(5000),
      status: trajectoryStatusSchema,
    })
    .passthrough(),
  demo_seed_removed: z
    .object({
      ids_removed: z.number().int().min(0).max(5000),
    })
    .passthrough(),
};

export const analyticsEventSchema = z.object({
  name: z.enum(ANALYTICS_EVENT_NAMES),
  payload: analyticsPayloadSchema.optional().default({}),
}).superRefine((value, ctx) => {
  const schema = eventSpecificPayloadSchemas[value.name];
  if (!schema) return;

  const parsed = schema.safeParse(value.payload ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['payload', ...(issue?.path ?? [])],
      message: issue?.message ?? `Invalid payload for event "${value.name}"`,
    });
  }
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
