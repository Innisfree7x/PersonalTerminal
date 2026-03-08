export type TrajectoryRiskStatus = 'on_track' | 'tight' | 'at_risk';

export interface DetectGoalStatusTransitionsInput {
  previousByGoal: Record<string, TrajectoryRiskStatus>;
  currentByGoal: Record<string, TrajectoryRiskStatus>;
  lastPulseByGoal: Record<string, number>;
  nowMs: number;
  cooldownMs: number;
}

export interface DetectGoalStatusTransitionsResult {
  changedGoalIds: string[];
  nextLastPulseByGoal: Record<string, number>;
}

export function detectGoalStatusTransitions(
  input: DetectGoalStatusTransitionsInput
): DetectGoalStatusTransitionsResult {
  const nextLastPulseByGoal = { ...input.lastPulseByGoal };
  const changedGoalIds: string[] = [];

  for (const [goalId, currentStatus] of Object.entries(input.currentByGoal)) {
    const previousStatus = input.previousByGoal[goalId];
    if (!previousStatus) continue;
    if (previousStatus === currentStatus) continue;

    const lastPulse = nextLastPulseByGoal[goalId] ?? Number.NEGATIVE_INFINITY;
    if (input.nowMs - lastPulse < input.cooldownMs) continue;

    changedGoalIds.push(goalId);
    nextLastPulseByGoal[goalId] = input.nowMs;
  }

  return {
    changedGoalIds,
    nextLastPulseByGoal,
  };
}
