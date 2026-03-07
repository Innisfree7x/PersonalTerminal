import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { getDashboardStats } from '@/lib/dashboard/queries';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';

/**
 * GET /api/dashboard/stats - Fetch dashboard statistics
 */
export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/dashboard/stats');
  const startedAt = trace.startedAt;
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return withApiTraceHeaders(errorResponse, trace, { metricName: 'dash_stats' });

  try {
    const stats = await getDashboardStats(user.id);
    void recordFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/dashboard/stats',
      requestId: trace.requestId,
    }).catch(() => {});

    const response = applyPrivateSWRPolicy(NextResponse.json(stats), {
      maxAgeSeconds: 20,
      staleWhileRevalidateSeconds: 60,
    });
    return withApiTraceHeaders(response, trace, { metricName: 'dash_stats' });
  } catch (error) {
    void recordFlowMetric({
      flow: 'today_load',
      status: 'failure',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/dashboard/stats',
      requestId: trace.requestId,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    }).catch(() => {});
    const response = handleRouteError(error, 'Failed to fetch stats', 'Error fetching dashboard stats');
    return withApiTraceHeaders(response, trace, { metricName: 'dash_stats' });
  }
}
