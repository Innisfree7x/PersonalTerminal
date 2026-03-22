import type {
  OpportunitySearchItem,
  OpportunitySearchResponse,
  RadarTrack,
} from '@/lib/schemas/opportunity-radar.schema';
import type { OpportunityReadoutTone } from '@/lib/career/opportunityReadout';
import { getTargetFirmLens } from '@/lib/career/targetFirms';

export interface OpportunityCompanyLens {
  tone: OpportunityReadoutTone;
  title: string;
  summary: string;
  chips: Array<{ label: string; tone?: OpportunityReadoutTone }>;
  bullets: string[];
}

function buildGenericTone(item: OpportunitySearchItem): OpportunityReadoutTone {
  if (item.band === 'realistic') return 'success';
  if (item.band === 'target') return 'warning';
  return 'info';
}

export function buildOpportunityCompanyLens(
  item: OpportunitySearchItem,
  priorityTrack: RadarTrack,
  meta: OpportunitySearchResponse['meta'] | null
): OpportunityCompanyLens {
  const firmLens = getTargetFirmLens(item.company, priorityTrack);
  const cvFocusMismatch = meta?.cvTargetTracks?.length && !meta.cvTargetTracks.includes(item.track);

  if (firmLens) {
    const tone: OpportunityReadoutTone = firmLens.isTrackAligned ? 'success' : 'warning';

    return {
      tone,
      title: `${firmLens.label}: ${firmLens.segmentLabel}`,
      summary: `${item.company} ist in diesem Radar kein generischer Brand-Name, sondern ein ${firmLens.segmentLabel}-Signal. ${firmLens.qualityReason}.`,
      chips: [
        { label: firmLens.segmentLabel, tone },
        { label: firmLens.isTrackAligned ? 'Track aligned' : 'track-adjacent', tone },
        { label: item.targetFirm ? 'Target firm' : 'relevante Route', tone: 'info' },
      ],
      bullets: [
        `Operating style: ${firmLens.operatingStyle}.`,
        `Entry signal: ${firmLens.entrySignal}.`,
        cvFocusMismatch
          ? `Dein CV spielt aktuell eher auf ${meta?.cvTargetTracks?.join(' / ')}. Genau deshalb ist diese Rolle eher ein bewusster Move als ein Autopilot-Match.`
          : `Wenn du ${item.topGaps[0] ?? 'die Hauptlücke'} schließt, kippt diese Firma schneller in echte Bewerbungsreife als ein zufälliger Markt-Treffer.`,
      ],
    };
  }

  return {
    tone: buildGenericTone(item),
    title: `Company Lens: ${item.company}`,
    summary: `${item.company} ist hier kein reiner Marken-Play, sondern ein operativer ${item.track}-Lead mit ${item.sourceLabels.length} verwertbaren Markt-Signalen.`,
    chips: [
      { label: `${item.sourceLabels.length} Quellen`, tone: item.sourceLabels.length >= 2 ? 'success' : 'warning' },
      { label: item.band === 'realistic' ? 'direkter Move' : 'vorbereitender Move', tone: buildGenericTone(item) },
    ],
    bullets: [
      item.sourceLabels.length >= 2
        ? 'Mehrere voneinander getrennte Quellen reduzieren Noise und machen den Lead belastbarer.'
        : 'Nur eine Quelle heißt nicht schlecht, aber du solltest den Lead bewusster verifizieren.',
      item.band === 'realistic'
        ? 'Diese Rolle ist wertvoll, weil sie echtes Signal und realistische Umsetzbarkeit kombiniert.'
        : 'Diese Rolle ist eher eine Route, wenn du bewusst Skills oder Brand-Signal aufbauen willst.',
      cvFocusMismatch
        ? `Dein CV-Fokus liegt derzeit eher auf ${meta?.cvTargetTracks?.join(' / ')} als auf ${item.track}.`
        : `Der aktuelle CV-Fokus unterstützt ${item.track} bereits ausreichend, um diese Rolle sinnvoll einzuordnen.`,
    ],
  };
}
