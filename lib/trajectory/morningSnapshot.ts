import type { TrajectoryBriefOverview } from '@/lib/dashboard/trajectoryBriefing';
import type { MomentumScoreResult } from '@/lib/trajectory/momentum';
import {
  getOrCreateTrajectorySettings,
  listTrajectoryBlocks,
  listTrajectoryGoals,
} from '@/lib/supabase/trajectory';
import { fetchFocusAnalytics } from '@/lib/supabase/focusSessions';
import { computeTrajectoryPlan } from '@/lib/trajectory/planner';
import { computeMomentumScore } from '@/lib/trajectory/momentum';
import { toTrajectoryGoalPlanInput } from '@/lib/trajectory/types';
import { detectCrises, type CrisisReport } from '@/lib/trajectory/crisis';

export interface TrajectoryMorningSnapshotPayload {
  generatedAt: string;
  overview: TrajectoryBriefOverview;
  momentum: MomentumScoreResult;
  crisis: CrisisReport;
}

export interface TrajectoryMorningSnapshotResult {
  payload: TrajectoryMorningSnapshotPayload;
  meta: {
    queryDurationMs: number;
    goalCount: number;
    generatedBlocks: number;
  };
}

export async function buildTrajectoryMorningSnapshot(
  userId: string
): Promise<TrajectoryMorningSnapshotResult> {
  const startedAt = Date.now();
  const [settings, goals, blocks, focusSessions] = await Promise.all([
    getOrCreateTrajectorySettings(userId),
    listTrajectoryGoals(userId),
    listTrajectoryBlocks(userId),
    fetchFocusAnalytics(userId, 14),
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

  const crisis = detectCrises({ goals: planGoals });

  return {
    payload: {
      generatedAt: new Date().toISOString(),
      overview: {
        goals: goals
          .filter((goal): goal is typeof goal & { dueDate: string } => goal.dueDate !== null)
          .map((goal) => ({
            id: goal.id,
            title: goal.title,
            dueDate: goal.dueDate,
            status: goal.status,
          })),
        computed: {
          generatedBlocks: computed.generatedBlocks.map((block) => ({
            goalId: block.goalId,
            startDate: block.startDate,
            status: block.status,
          })),
        },
      },
      momentum,
      crisis,
    },
    meta: {
      queryDurationMs: Date.now() - startedAt,
      goalCount: goals.length,
      generatedBlocks: computed.generatedBlocks.length,
    },
  };
}
