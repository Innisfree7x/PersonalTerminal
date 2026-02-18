import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const marketingEventSchema = z.object({
  name: z.enum([
    'landing_cta_primary_clicked',
    'landing_cta_secondary_clicked',
    'pricing_plan_selected',
    'signup_started',
    'signup_completed',
  ]),
  payload: z
    .object({
      source: z.string().max(100).optional(),
      plan: z.string().max(100).optional(),
      variant: z.string().max(100).optional(),
    })
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
