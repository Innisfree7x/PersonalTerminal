import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { getDashboardNextTasks } from '@/lib/dashboard/queries';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';

/**
 * GET /api/dashboard/next-tasks - Returns actionable next tasks
 */
export async function GET(_request: NextRequest) {
  const trace = createApiTraceContext(_request, '/api/dashboard/next-tasks');
  const startedAt = trace.startedAt;
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) {
    return withApiTraceHeaders(errorResponse, trace, { metricName: 'nexttasks' });
  }

  try {
    const result = await getDashboardNextTasks(user.id);
    const durationMs = Date.now() - startedAt;
    await recordFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs,
      userId: user.id,
      route: '/api/dashboard/next-tasks',
      requestId: trace.requestId,
      context: {
        queryDurationMs: result.meta.queryDurationMs,
      },
    });

    const response = NextResponse.json(result, {
      headers: {
        'Server-Timing': `query_build;dur=${result.meta.queryDurationMs}`,
      },
    });
    return withApiTraceHeaders(response, trace, { metricName: 'nexttasks' });
  } catch (error) {
    await recordFlowMetric({
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
