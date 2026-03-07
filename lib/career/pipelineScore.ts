export interface PipelineScoreInput {
  applied: number;
  interviews: number;
  offers: number;
}

export interface PipelineScoreResult {
  score: number;
  label: string;
}

export function computePipelineScore({ applied, interviews, offers }: PipelineScoreInput): PipelineScoreResult {
  const raw = applied * 10 + interviews * 25 + offers * 50;
  const score = Math.min(raw, 100);

  let label: string;
  if (score >= 80) {
    label = 'Starke Pipeline';
  } else if (score >= 60) {
    label = 'Gut aufgestellt';
  } else if (score >= 30) {
    label = 'Im Aufbau';
  } else {
    label = 'Noch wenig aktiv';
  }

  return { score, label };
}
