import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { getDashboardNextTasks } from '@/lib/dashboard/queries';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';

/**
 * GET /api/dashboard/next-tasks - Returns actionable next tasks
 */
export async function GET(_request: NextRequest) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const result = await getDashboardNextTasks(user.id);
    const durationMs = Date.now() - startedAt;
    await recordFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs,
      userId: user.id,
      route: '/api/dashboard/next-tasks',
      requestId,
      context: {
        queryDurationMs: result.meta.queryDurationMs,
      },
    });

    return NextResponse.json(result, {
      headers: {
        'Server-Timing': `nexttasks;dur=${durationMs}`,
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    await recordFlowMetric({
      flow: 'today_load',
      status: 'failure',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/dashboard/next-tasks',
      requestId,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    });
    return handleRouteError(error, 'Failed to fetch next tasks', 'Error fetching next tasks');
  }
}
