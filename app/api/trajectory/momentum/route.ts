import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import {
  getOrCreateTrajectorySettings,
  listTrajectoryBlocks,
  listTrajectoryGoals,
} from '@/lib/supabase/trajectory';
import { fetchFocusAnalytics } from '@/lib/supabase/focusSessions';
import { computeTrajectoryPlan } from '@/lib/trajectory/planner';
import { computeMomentumScore } from '@/lib/trajectory/momentum';
import { toTrajectoryGoalPlanInput } from '@/lib/trajectory/types';
import { recordFlowMetric } from '@/lib/ops/flowMetrics';

export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/trajectory/momentum');
  const startedAt = trace.startedAt;
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return withApiTraceHeaders(errorResponse, trace, { metricName: 'traj_momentum' });

  try {
    const [settings, goals, blocks, focusSessions] = await Promise.all([
      getOrCreateTrajectorySettings(user.id),
      listTrajectoryGoals(user.id),
      listTrajectoryBlocks(user.id),
      fetchFocusAnalytics(user.id, 14),
    ]);

    const planGoals = goals
      .map((goal) => toTrajectoryGoalPlanInput(goal))
      .filter((g): g is NonNullable<typeof g> => g !== null);

    const computed = computeTrajectoryPlan({
      goals: planGoals,
      existingBlocks: blocks.map((block) => ({
        goalId: block.goalId,
        startDate: block.startDate,
        endDate: block.endDate,
        weeklyHours: block.weeklyHours,
        status: block.status,
      })),
      capacityHoursPerWeek: settings.hoursPerWeek,
    });

    const momentum = computeMomentumScore({
      plannedHoursPerWeek: settings.hoursPerWeek,
      activeGoals: goals.map((goal) => ({
        bufferWeeks: goal.bufferWeeks,
        status: goal.status,
      })),
      generatedBlocks: computed.generatedBlocks.map((block) => ({
        status: block.status,
      })),
      focusSessions: focusSessions.map((session) => ({
        startedAt: session.started_at,
        durationSeconds: session.duration_seconds,
        completed: session.completed,
        sessionType: session.session_type,
      })),
    });

    void recordFlowMetric({
      flow: 'today_load',
      status: 'success',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/trajectory/momentum',
      requestId: trace.requestId,
      context: {
        score: momentum.score,
        trend: momentum.trend,
      },
    }).catch(() => {});

    const response = applyPrivateSWRPolicy(
      NextResponse.json({
        generatedAt: new Date().toISOString(),
        momentum,
      }),
      {
        maxAgeSeconds: 20,
        staleWhileRevalidateSeconds: 60,
      }
    );
    return withApiTraceHeaders(response, trace, { metricName: 'traj_momentum' });
  } catch (error) {
    void recordFlowMetric({
      flow: 'today_load',
      status: 'failure',
      durationMs: Date.now() - startedAt,
      userId: user.id,
      route: '/api/trajectory/momentum',
      requestId: trace.requestId,
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    }).catch(() => {});
    const response = handleRouteError(
      error,
      'Failed to compute trajectory momentum',
      'Error computing trajectory momentum'
    );
    return withApiTraceHeaders(response, trace, { metricName: 'traj_momentum' });
  }
}
