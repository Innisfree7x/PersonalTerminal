import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';
import { getDashboardWeekEvents } from '@/lib/dashboard/weekEvents';

/**
 * GET /api/dashboard/week-events
 * Aggregates events for the current week (or specified week offset)
 * Combines Google Calendar events + user tasks
 *
 * Query params:
 * - offset: week offset from current week (default: 0, clamped to [-52, 52])
 *
 * Response:
 * - events: Array of {date, count, type}
 *   - type: 'none' | 'low' (1) | 'medium' (2) | 'high' (3+)
 */
export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/dashboard/week-events');
  const startedAt = trace.startedAt;
  const emitFlowMetric = (payload: Parameters<typeof recordFlowMetric>[0]) => {
    void recordFlowMetric(payload).catch(() => {});
  };

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return withApiTraceHeaders(errorResponse, trace, { metricName: 'week_events' });

  try {
    const { searchParams } = request.nextUrl;
    const weekOffsetRaw = Number.parseInt(searchParams.get('offset') ?? '0', 10);
    const weekOffset = Number.isFinite(weekOffsetRaw)
      ? Math.max(-52, Math.min(52, weekOffsetRaw))
      : 0;
    const weekPayload = await getDashboardWeekEvents(user.id, weekOffset);
    emitFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/dashboard/week-events',
      requestId: trace.requestId,
      context: {
        weekOffset,
        totalEvents: weekPayload.totalEvents,
      },
    });

    const response = applyPrivateSWRPolicy(
      NextResponse.json(weekPayload),
      {
        maxAgeSeconds: 30,
        staleWhileRevalidateSeconds: 90,
      }
    );
    return withApiTraceHeaders(response, trace, { metricName: 'week_events' });
  } catch (error) {
    emitFlowMetric({
      flow: 'today_load',
      status: 'failure',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/dashboard/week-events',
      requestId: trace.requestId,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    });
    const response = handleRouteError(error, 'Internal server error', 'Week events API error');
    return withApiTraceHeaders(response, trace, { metricName: 'week_events' });
  }
}
