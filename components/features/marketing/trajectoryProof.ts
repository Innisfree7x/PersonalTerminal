import type { TrajectoryRiskStatus } from '@/lib/trajectory/risk-model';

export function formatTrajectoryProofDateLabel(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function buildTrajectoryProofInsight(
  status: TrajectoryRiskStatus,
  capacityHoursPerWeek: number,
  prepStartLabel: string
) {
  if (status === 'on_track') {
    return `Mit ${capacityHoursPerWeek}h pro Woche bleibt dein Buffer intakt. Spätester sinnvoller Start: ${prepStartLabel}.`;
  }

  if (status === 'tight') {
    return `Ab ${prepStartLabel} wird es eng. Ein weiterer Parallelblock oder weniger Wochenkapazität kippt den Plan schnell.`;
  }

  return 'Der Start liegt bereits zu spät. Scope senken, früher anfangen oder zuerst einen anderen Block auflösen.';
}

export function getTrajectoryProofStatusTone(status: TrajectoryRiskStatus) {
  if (status === 'on_track') return 'text-emerald-400';
  if (status === 'tight') return 'text-primary';
  return 'text-red-400';
}
