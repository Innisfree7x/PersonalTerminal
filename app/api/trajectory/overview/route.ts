import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import {
  getOrCreateTrajectorySettings,
  listTrajectoryBlocks,
  listTrajectoryGoals,
  listTrajectoryWindows,
} from '@/lib/supabase/trajectory';
import { computeTrajectoryPlan } from '@/lib/trajectory/planner';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';

export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/trajectory/overview');
  const startedAt = trace.startedAt;
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return withApiTraceHeaders(errorResponse, trace, { metricName: 'traj_overview' });

  try {
    const [settings, goals, windows, blocks] = await Promise.all([
      getOrCreateTrajectorySettings(user.id),
      listTrajectoryGoals(user.id),
      listTrajectoryWindows(user.id),
      listTrajectoryBlocks(user.id),
    ]);

    const computed = computeTrajectoryPlan({
      goals: goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        dueDate: goal.dueDate,
        effortHours: goal.effortHours,
        bufferWeeks: goal.bufferWeeks,
        status: goal.status,
      })),
      existingBlocks: blocks.map((block) => ({
        goalId: block.goalId,
        startDate: block.startDate,
        endDate: block.endDate,
        weeklyHours: block.weeklyHours,
        status: block.status,
      })),
      capacityHoursPerWeek: settings.hoursPerWeek,
    });

    void recordFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/trajectory/overview',
      requestId: trace.requestId,
      context: {
        goals: goals.length,
        windows: windows.length,
        blocks: blocks.length,
      },
    }).catch(() => {});

    const response = applyPrivateSWRPolicy(
      NextResponse.json({
        settings,
        goals,
        windows,
        blocks,
        computed,
      }),
      {
        maxAgeSeconds: 20,
        staleWhileRevalidateSeconds: 60,
      }
    );
    return withApiTraceHeaders(response, trace, { metricName: 'traj_overview' });
  } catch (error) {
    void recordFlowMetric({
      flow: 'today_load',
      status: 'failure',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/trajectory/overview',
      requestId: trace.requestId,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    }).catch(() => {});
    const response = handleRouteError(
      error,
      'Failed to fetch trajectory overview',
      'Error fetching trajectory overview'
    );
    return withApiTraceHeaders(response, trace, { metricName: 'traj_overview' });
  }
}
