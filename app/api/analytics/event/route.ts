import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const marketingEventSchema = z.object({
  name: z.enum([
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
  ]),
  payload: z
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
    })
    .catchall(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional()
    .default({}),
});

/**
 * POST /api/analytics/event
 * Minimal validated endpoint for marketing conversion events.
 *
 * Phase 8: intentionally returns 202 without persistence.
 * This gives the frontend a stable contract and avoids blocking UX.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = marketingEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid analytics payload' }, { status: 400 });
    }

    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }
}
