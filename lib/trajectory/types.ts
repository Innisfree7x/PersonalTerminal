export type CommitmentMode = 'fixed' | 'flexible' | 'lead-time';

interface TrajectoryGoalBase {
  id: string;
  title: string;
  status: 'active' | 'done' | 'archived';
  effortHours: number;
  bufferWeeks: number;
}

export type TrajectoryGoalPlanInput =
  | (TrajectoryGoalBase & {
      commitmentMode: 'fixed';
      fixedStartDate: string;
      fixedEndDate: string;
    })
  | (TrajectoryGoalBase & {
      commitmentMode: 'flexible';
      dueDate: string;
    })
  | (TrajectoryGoalBase & {
      commitmentMode: 'lead-time';
      dueDate: string;
      leadTimeWeeks: number;
    });

export interface TrajectoryGoalRecordLike {
  id: string;
  title: string;
  status: 'active' | 'done' | 'archived';
  effortHours: number;
  bufferWeeks: number;
  dueDate: string | null;
  commitmentMode: CommitmentMode;
  fixedStartDate: string | null;
  fixedEndDate: string | null;
  leadTimeWeeks: number | null;
}

export function toTrajectoryGoalPlanInput(
  goal: TrajectoryGoalRecordLike
): TrajectoryGoalPlanInput | null {
  const base = {
    id: goal.id,
    title: goal.title,
    status: goal.status,
    effortHours: goal.effortHours,
    bufferWeeks: goal.bufferWeeks,
  };
  if (goal.commitmentMode === 'fixed') {
    if (!goal.fixedStartDate || !goal.fixedEndDate) return null;
    return {
      ...base,
      commitmentMode: 'fixed',
      fixedStartDate: goal.fixedStartDate,
      fixedEndDate: goal.fixedEndDate,
    };
  }
  if (goal.commitmentMode === 'lead-time') {
    if (!goal.dueDate || goal.leadTimeWeeks == null) return null;
    return {
      ...base,
      commitmentMode: 'lead-time',
      dueDate: goal.dueDate,
      leadTimeWeeks: goal.leadTimeWeeks,
    };
  }
  if (!goal.dueDate) return null;
  return {
    ...base,
    commitmentMode: 'flexible',
    dueDate: goal.dueDate,
  };
}
