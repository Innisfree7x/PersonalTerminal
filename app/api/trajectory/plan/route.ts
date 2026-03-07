import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { trajectoryPlanRequestSchema } from '@/lib/schemas/trajectory.schema';
import {
  getOrCreateTrajectorySettings,
  listTrajectoryBlocks,
  listTrajectoryGoals,
} from '@/lib/supabase/trajectory';
import { computeTrajectoryPlan } from '@/lib/trajectory/planner';

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = trajectoryPlanRequestSchema.parse(body);

    const [settings, goals, blocks] = await Promise.all([
      getOrCreateTrajectorySettings(user.id),
      listTrajectoryGoals(user.id),
      listTrajectoryBlocks(user.id),
    ]);

    const effectiveCapacity = parsed.simulationHoursPerWeek ?? settings.hoursPerWeek;

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
      capacityHoursPerWeek: effectiveCapacity,
    });

    return NextResponse.json({
      settings,
      simulation: {
        used: parsed.simulationHoursPerWeek !== undefined,
        effectiveCapacityHoursPerWeek: computed.effectiveCapacityHoursPerWeek,
      },
      computed,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to generate trajectory plan', 'Error generating trajectory plan');
  }
}
