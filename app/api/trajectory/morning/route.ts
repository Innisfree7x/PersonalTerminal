import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';
import { buildTrajectoryMorningSnapshot } from '@/lib/trajectory/morningSnapshot';

export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/trajectory/morning');
  const startedAt = trace.startedAt;
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) {
    return withApiTraceHeaders(errorResponse, trace, { metricName: 'traj_morning' });
  }

  try {
    const snapshot = await buildTrajectoryMorningSnapshot(user.id);

    const response = applyPrivateSWRPolicy(
      NextResponse.json(snapshot.payload),
      {
        maxAgeSeconds: 20,
        staleWhileRevalidateSeconds: 60,
      }
    );

    void recordFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/trajectory/morning',
      requestId: trace.requestId,
      context: {
        goalCount: snapshot.meta.goalCount,
        generatedBlocks: snapshot.meta.generatedBlocks,
        queryDurationMs: snapshot.meta.queryDurationMs,
      },
    }).catch(() => {});

    return withApiTraceHeaders(response, trace, { metricName: 'traj_morning' });
  } catch (error) {
    void recordFlowMetric({
      flow: 'today_load',
      status: 'failure',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/trajectory/morning',
      requestId: trace.requestId,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    }).catch(() => {});

    const response = handleRouteError(
      error,
      'Failed to build trajectory morning snapshot',
      'Error building trajectory morning snapshot'
    );
    return withApiTraceHeaders(response, trace, { metricName: 'traj_morning' });
  }
}
