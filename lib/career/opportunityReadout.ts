import type {
  OpportunitySearchItem,
  OpportunitySearchResponse,
  RadarTrack,
} from '@/lib/schemas/opportunity-radar.schema';

export type OpportunityReadoutTone = 'success' | 'warning' | 'error' | 'info';

export interface OpportunityFitSignal {
  label: string;
  value: string;
  tone: OpportunityReadoutTone;
}

export interface OpportunityFitReadout {
  summary: string;
  confidenceLabel: string;
  confidenceTone: OpportunityReadoutTone;
  signals: OpportunityFitSignal[];
}

const ADJACENT_TRACKS: Record<RadarTrack, RadarTrack[]> = {
  'M&A': ['TS', 'CorpFin'],
  TS: ['M&A', 'Audit'],
  CorpFin: ['M&A', 'TS'],
  Audit: ['TS', 'CorpFin'],
};

export function toDisplayFitIndex(score: number): string {
  const capped = Math.min(89, Math.max(0, score));
  return (capped / 10).toFixed(1);
}

function buildTrackSignal(
  item: OpportunitySearchItem,
  priorityTrack: RadarTrack,
  meta: OpportunitySearchResponse['meta'] | null
): OpportunityFitSignal {
  if (item.track === priorityTrack) {
    return { label: 'Track-Fit', value: 'direkt', tone: 'success' };
  }

  if (meta?.cvTargetTracks?.includes(item.track)) {
    return { label: 'Track-Fit', value: 'CV-seitig plausibel', tone: 'info' };
  }

  if (ADJACENT_TRACKS[priorityTrack].includes(item.track)) {
    return { label: 'Track-Fit', value: 'adjazent', tone: 'warning' };
  }

  return { label: 'Track-Fit', value: 'abweichend', tone: 'error' };
}

function buildMarketSignal(item: OpportunitySearchItem): OpportunityFitSignal {
  if (item.sourceLabels.length >= 3) {
    return { label: 'Markt-Signal', value: `${item.sourceLabels.length} Quellen`, tone: 'success' };
  }

  if (item.sourceLabels.length === 2) {
    return { label: 'Markt-Signal', value: '2 Quellen', tone: 'success' };
  }

  if (item.sourceLabels.includes('Adzuna')) {
    return { label: 'Markt-Signal', value: 'Live-Markt', tone: 'info' };
  }

  return { label: 'Markt-Signal', value: item.sourceLabels[0] ?? '1 Quelle', tone: 'warning' };
}

function buildGapSignal(item: OpportunitySearchItem): OpportunityFitSignal {
  const noCriticalGap = item.topGaps.some((gap) => gap.toLowerCase().includes('keine kritischen'));

  if (noCriticalGap || item.band === 'realistic') {
    return {
      label: 'Gap-Druck',
      value: noCriticalGap ? 'niedrig' : 'beherrschbar',
      tone: 'success',
    };
  }

  if (item.band === 'target') {
    return { label: 'Gap-Druck', value: 'mittel', tone: 'warning' };
  }

  return { label: 'Gap-Druck', value: 'hoch', tone: 'error' };
}

export function buildOpportunityFitReadout(
  item: OpportunitySearchItem,
  priorityTrack: RadarTrack,
  meta: OpportunitySearchResponse['meta'] | null
): OpportunityFitReadout {
  const trackSignal = buildTrackSignal(item, priorityTrack, meta);
  const marketSignal = buildMarketSignal(item);
  const gapSignal = buildGapSignal(item);
  const signals = [trackSignal, marketSignal, gapSignal];

  const confidenceTone: OpportunityReadoutTone =
    item.band === 'realistic' ? 'success' : item.band === 'target' ? 'warning' : 'error';
  const confidenceLabel =
    item.band === 'realistic'
      ? 'hohe Umsetzbarkeit'
      : item.band === 'target'
        ? 'aktive Nachschärfung nötig'
        : 'bewusster Stretch';

  const summary =
    item.band === 'realistic'
      ? `${item.company} ist kein Blind Shot: ${trackSignal.value}, ${marketSignal.value.toLowerCase()} und ${gapSignal.value} Gap-Druck.`
      : item.band === 'target'
        ? `${item.company} ist erreichbar, aber nur wenn du die Hauptlücke aktiv schließt und den Track-Fit sauber ausspielst.`
        : `${item.company} ist aktuell eher Upside als sichere Option. Sinnvoll nur, wenn du bewusst Stretch mitnimmst.`;

  return {
    summary,
    confidenceLabel,
    confidenceTone,
    signals,
  };
}
