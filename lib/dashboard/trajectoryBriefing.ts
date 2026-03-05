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
  goalId: string;
  title: string;
  daysUntil: number;
  status: TrajectoryRiskStatus;
  statusLabel: string;
  dueDate: string;
  startDate: string;
  startDateLabel: string;
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
  const startDate = new Date(`${nextTrajectoryBlock.startDate}T00:00:00.000Z`);
  const daysUntil = Math.max(0, Math.ceil((dueDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24)));
  const statusLabel =
    nextTrajectoryBlock.status === 'on_track'
      ? 'on track'
      : nextTrajectoryBlock.status === 'tight'
        ? 'tight'
        : 'at risk';

  return {
    goalId: nextTrajectoryGoal.id,
    title: nextTrajectoryGoal.title,
    daysUntil,
    status: nextTrajectoryBlock.status,
    statusLabel,
    dueDate: nextTrajectoryGoal.dueDate,
    startDate: nextTrajectoryBlock.startDate,
    startDateLabel: Number.isNaN(startDate.getTime())
      ? nextTrajectoryBlock.startDate
      : startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
}
