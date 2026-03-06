import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import {
  getOrCreateTrajectorySettings,
  listTrajectoryBlocks,
  listTrajectoryGoals,
} from '@/lib/supabase/trajectory';
import { fetchFocusAnalytics } from '@/lib/supabase/focusSessions';
import { computeTrajectoryPlan } from '@/lib/trajectory/planner';
import { computeMomentumScore } from '@/lib/trajectory/momentum';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const [settings, goals, blocks, focusSessions] = await Promise.all([
      getOrCreateTrajectorySettings(user.id),
      listTrajectoryGoals(user.id),
      listTrajectoryBlocks(user.id),
      fetchFocusAnalytics(user.id, 14),
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

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        momentum,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=0, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    return handleRouteError(error, 'Failed to compute trajectory momentum', 'Error computing trajectory momentum');
  }
}
