import type { TrajectoryGoalPlanInput } from '@/lib/trajectory/types';

export interface CrisisCollision {
  code:
    | 'FIXED_WINDOW_COLLISION'
    | 'FIXED_BLOCKS_PREP'
    | 'NO_FLEXIBLE_SLOT'
    | 'LEAD_TIME_TOO_SHORT';
  severity: 'critical';
  conflictingGoalIds: string[];
  window: { startDate: string; endDate: string };
  message: string;
}

export interface CrisisReport {
  collisions: CrisisCollision[];
  hasCrisis: boolean;
}

export interface DetectCrisesInput {
  goals: TrajectoryGoalPlanInput[];
  today?: string;
}

export function detectCrises(_input: DetectCrisesInput): CrisisReport {
  return { collisions: [], hasCrisis: false };
}
