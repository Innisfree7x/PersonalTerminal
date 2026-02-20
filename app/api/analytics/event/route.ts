import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { analyticsEventSchema } from '@/lib/analytics/events';
import { dispatchAnalyticsEvent } from '@/lib/analytics/provider';

/**
 * POST /api/analytics/event
 * Validated endpoint for onboarding/activation funnel events.
 * Always non-blocking for UX: even provider failures return 202 once payload is valid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = analyticsEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid analytics payload' }, { status: 400 });
    }

    const user = await getCurrentUser();
    const providerResults = await dispatchAnalyticsEvent(parsed.data, { userId: user?.id ?? null });
    const hasProviderFailure = providerResults.some((result) => result.status === 'failed');

    return NextResponse.json(
      {
        accepted: true,
        providerResults,
        warnings: hasProviderFailure ? ['One or more analytics providers failed'] : [],
      },
      { status: 202 }
    );
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }
}
