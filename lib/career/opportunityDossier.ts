import type {
  OpportunitySearchItem,
  OpportunitySearchResponse,
  RadarTrack,
} from '@/lib/schemas/opportunity-radar.schema';
import {
  buildOpportunityFitReadout,
  type OpportunityReadoutTone,
  toDisplayFitIndex,
} from '@/lib/career/opportunityReadout';

export interface OpportunityDossierMetric {
  label: string;
  value: string;
  tone: OpportunityReadoutTone;
}

export interface OpportunityDossier {
  tone: OpportunityReadoutTone;
  summary: string;
  chips: Array<{ label: string; tone?: OpportunityReadoutTone }>;
  metrics: OpportunityDossierMetric[];
  bullets: string[];
}

function bandLabel(item: OpportunitySearchItem): string {
  if (item.band === 'realistic') return 'Realistic';
  if (item.band === 'target') return 'Target';
  return 'Stretch';
}

export function buildOpportunityDossier(
  item: OpportunitySearchItem,
  priorityTrack: RadarTrack,
  meta: OpportunitySearchResponse['meta'] | null
): OpportunityDossier {
  const fitReadout = buildOpportunityFitReadout(item, priorityTrack, meta);
  const [trackSignal, marketSignal, gapSignal] = fitReadout.signals;
  const chips: OpportunityDossier['chips'] = [
    { label: `${toDisplayFitIndex(item.fitScore)}/10 relativer Fit`, tone: 'info' },
    { label: bandLabel(item), tone: fitReadout.confidenceTone },
    { label: fitReadout.confidenceLabel, tone: fitReadout.confidenceTone },
  ];

  if (item.targetFirm) {
    chips.push({ label: 'Target Firm', tone: 'success' });
  }

  const metrics: OpportunityDossierMetric[] = [
    { label: 'Track-Fit', value: trackSignal?.value ?? 'offen', tone: trackSignal?.tone ?? 'info' },
    { label: 'Markt-Signal', value: marketSignal?.value ?? 'offen', tone: marketSignal?.tone ?? 'info' },
    { label: 'Gap-Druck', value: gapSignal?.value ?? 'offen', tone: gapSignal?.tone ?? 'info' },
    { label: 'Quellen', value: `${item.sourceLabels.length}`, tone: item.sourceLabels.length >= 2 ? 'success' : 'warning' },
  ];

  const bullets = [
    `Primärer Vorteil: ${item.topReasons[0] ?? 'Track und Markt-Signal greifen sauber ineinander.'}`,
    `Größte Lücke: ${item.topGaps[0] ?? 'Keine kritische Lücke erkannt.'}`,
  ];

  if (item.nextAction) {
    bullets.push(`Operativer Move: ${item.nextAction}`);
  }

  if (meta?.cvTargetTracks?.length && !meta.cvTargetTracks.includes(item.track)) {
    bullets.push(`Dein CV spielt aktuell stärker auf ${meta.cvTargetTracks.join(' / ')} als auf ${item.track}.`);
  }

  return {
    tone: fitReadout.confidenceTone,
    summary: fitReadout.summary,
    chips,
    metrics,
    bullets,
  };
}
