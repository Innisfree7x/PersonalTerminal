import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { getDashboardNextTasks } from '@/lib/dashboard/queries';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { buildTrajectoryMorningSnapshot } from '@/lib/trajectory/morningSnapshot';
import { getDashboardWeekEvents } from '@/lib/dashboard/weekEvents';

/**
 * GET /api/dashboard/next-tasks - Returns actionable next tasks
 */
export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/dashboard/next-tasks');
  const startedAt = trace.startedAt;
  const includeParam = request.nextUrl.searchParams.get('include') ?? '';
  const includeSet = new Set(
    includeParam
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  );
  const includeTrajectoryMorning = includeSet.has('trajectory_morning');
  const includeWeekEvents = includeSet.has('week_events');
  const emitFlowMetric = (payload: Parameters<typeof recordFlowMetric>[0]) => {
    void recordFlowMetric(payload).catch(() => {});
  };
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) {
    return withApiTraceHeaders(errorResponse, trace, { metricName: 'nexttasks' });
  }

  try {
    const [result, morningSnapshot, weekEventsResult] = await Promise.all([
      getDashboardNextTasks(user.id),
      includeTrajectoryMorning ? buildTrajectoryMorningSnapshot(user.id) : Promise.resolve(null),
      includeWeekEvents
        ? (async () => {
            const weekStartedAt = Date.now();
            const payload = await getDashboardWeekEvents(user.id, 0);
            return {
              payload,
              queryDurationMs: Date.now() - weekStartedAt,
            };
          })()
        : Promise.resolve(null),
    ]);

    const payload = {
      ...result,
      ...(includeTrajectoryMorning && morningSnapshot
        ? { trajectoryMorning: morningSnapshot.payload }
        : {}),
      ...(includeWeekEvents && weekEventsResult ? { weekEvents: weekEventsResult.payload } : {}),
    };

    const durationMs = Date.now() - startedAt;
    const serverTimingEntries = [`query_build;dur=${result.meta.queryDurationMs}`];
    if (morningSnapshot) {
      serverTimingEntries.push(`traj_build;dur=${morningSnapshot.meta.queryDurationMs}`);
    }
    if (weekEventsResult) {
      serverTimingEntries.push(`week_build;dur=${weekEventsResult.queryDurationMs}`);
    }

    emitFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs,
      userId: user.id,
      route: '/api/dashboard/next-tasks',
      requestId: trace.requestId,
      context: {
        queryDurationMs: result.meta.queryDurationMs,
        nextBestAlternatives: result.nextBestAlternatives.length,
        riskSignals: result.riskSignals.length,
        includeTrajectoryMorning,
        includeWeekEvents,
        ...(morningSnapshot
          ? {
              trajectoryGoalCount: morningSnapshot.meta.goalCount,
              trajectoryQueryDurationMs: morningSnapshot.meta.queryDurationMs,
            }
          : {}),
        ...(weekEventsResult
          ? {
              weekEventsTotal: weekEventsResult.payload.totalEvents,
              weekEventsQueryDurationMs: weekEventsResult.queryDurationMs,
            }
          : {}),
      },
    });

    const response = applyPrivateSWRPolicy(NextResponse.json(payload, {
      headers: {
        'Server-Timing': serverTimingEntries.join(', '),
      },
    }), {
      maxAgeSeconds: 15,
      staleWhileRevalidateSeconds: 45,
    });
    return withApiTraceHeaders(response, trace, { metricName: 'nexttasks' });
  } catch (error) {
    emitFlowMetric({
      flow: 'today_load',
      status: 'failure',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/dashboard/next-tasks',
      requestId: trace.requestId,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    });
    const response = handleRouteError(
      error,
      'Failed to fetch next tasks',
      'Error fetching next tasks'
    );
    return withApiTraceHeaders(response, trace, { metricName: 'nexttasks' });
  }
}
