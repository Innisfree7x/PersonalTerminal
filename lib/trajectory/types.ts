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
