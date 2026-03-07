import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';
import { startOfWeek, addDays, format } from 'date-fns';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';

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

    const supabase = createClient();
    const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    if (!firstDay || !lastDay) {
      throw new Error('Failed to calculate week range');
    }

    const weekStartStr = format(firstDay, 'yyyy-MM-dd');
    const weekEndStr = format(lastDay, 'yyyy-MM-dd');

    const { data: tasks, error: tasksError } = await supabase
      .from('daily_tasks')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr);

    if (tasksError) {
      throw new Error(`Failed to fetch week events: ${tasksError.message}`);
    }

    const eventCounts: Record<string, number> = {};
    for (const day of weekDays) {
      eventCounts[format(day, 'yyyy-MM-dd')] = 0;
    }

    for (const task of tasks ?? []) {
      if (task.date in eventCounts) {
        const count = eventCounts[task.date];
        if (count !== undefined) eventCounts[task.date] = count + 1;
      }
    }

    const events = weekDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = eventCounts[dateStr] || 0;
      let type: 'none' | 'low' | 'medium' | 'high' = 'none';
      if (count === 1) type = 'low';
      else if (count === 2) type = 'medium';
      else if (count >= 3) type = 'high';

      return {
        date: day.toISOString(),
        count,
        type,
      };
    });

    const totalEvents = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);
    emitFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/dashboard/week-events',
      requestId: trace.requestId,
      context: {
        weekOffset,
        totalEvents,
      },
    });

    const response = applyPrivateSWRPolicy(
      NextResponse.json({
        events,
        weekStart: firstDay.toISOString(),
        weekEnd: lastDay.toISOString(),
        totalEvents,
      }),
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
