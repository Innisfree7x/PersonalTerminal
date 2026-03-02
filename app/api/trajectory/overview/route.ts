import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import {
  getOrCreateTrajectorySettings,
  listTrajectoryBlocks,
  listTrajectoryGoals,
  listTrajectoryWindows,
} from '@/lib/supabase/trajectory';
import { computeTrajectoryPlan } from '@/lib/trajectory/planner';

export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

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

    return NextResponse.json({
      settings,
      goals,
      windows,
      blocks,
      computed,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch trajectory overview', 'Error fetching trajectory overview');
  }
}
