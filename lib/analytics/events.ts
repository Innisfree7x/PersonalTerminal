import { z } from 'zod';

export const ANALYTICS_EVENT_NAMES = [
  'landing_cta_clicked',
  'landing_cta_primary_clicked',
  'landing_cta_secondary_clicked',
  'pricing_plan_selected',
  'signup_started',
  'signup_completed',
  'onboarding_started',
  'onboarding_step_completed',
  'onboarding_completed',
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
    duration_minutes: z.number().int().min(1).max(600).optional(),
    enabled: z.boolean().optional(),
    ability: z.enum(['q', 'w', 'e', 'r']).optional(),
  })
  .catchall(z.union([z.string(), z.number(), z.boolean(), z.null()]));

export const analyticsEventSchema = z.object({
  name: z.enum(ANALYTICS_EVENT_NAMES),
  payload: analyticsPayloadSchema.optional().default({}),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
