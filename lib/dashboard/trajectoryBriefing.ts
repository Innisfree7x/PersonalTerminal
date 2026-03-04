export type TrajectoryRiskStatus = 'on_track' | 'tight' | 'at_risk';

export interface TrajectoryBriefOverview {
  goals: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: 'active' | 'done' | 'archived';
  }>;
  computed: {
    generatedBlocks: Array<{
      goalId: string;
      startDate: string;
      status: TrajectoryRiskStatus;
    }>;
  };
}

export interface TrajectoryMorningBriefing {
  title: string;
  daysUntil: number;
  status: TrajectoryRiskStatus;
  statusLabel: string;
}

export function buildTrajectoryMorningBriefing(
  overview: TrajectoryBriefOverview | undefined,
  nowDate: Date = new Date()
): TrajectoryMorningBriefing | null {
  const activeTrajectoryGoals = overview?.goals?.filter((goal) => goal.status === 'active') ?? [];
  const nextTrajectoryGoal = activeTrajectoryGoals
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const nextTrajectoryBlock = nextTrajectoryGoal
    ? overview?.computed?.generatedBlocks?.find((block) => block.goalId === nextTrajectoryGoal.id)
    : null;

  if (!nextTrajectoryGoal || !nextTrajectoryBlock) return null;

  const dueDate = new Date(`${nextTrajectoryGoal.dueDate}T00:00:00.000Z`);
  const daysUntil = Math.max(0, Math.ceil((dueDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24)));
  const statusLabel =
    nextTrajectoryBlock.status === 'on_track'
      ? 'on track'
      : nextTrajectoryBlock.status === 'tight'
        ? 'tight'
        : 'at risk';

  return {
    title: nextTrajectoryGoal.title,
    daysUntil,
    status: nextTrajectoryBlock.status,
    statusLabel,
  };
}
