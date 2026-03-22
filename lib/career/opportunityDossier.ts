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
import { buildOpportunityPrepPlan } from '@/lib/career/opportunityActions';
import { buildOpportunityCompanyLens, type OpportunityCompanyLens } from '@/lib/career/opportunityCompanyLens';

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
  companyLens: OpportunityCompanyLens;
  actionStack: Array<{ label: string; detail: string; tone: OpportunityReadoutTone }>;
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
  const companyLens = buildOpportunityCompanyLens(item, priorityTrack, meta);
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
    `Firmen-Lens: ${companyLens.summary}`,
  ];
  const prepPlan = buildOpportunityPrepPlan(item);

  if (item.nextAction) {
    bullets.push(`Operativer Move: ${item.nextAction}`);
  }

  if (meta?.cvTargetTracks?.length && !meta.cvTargetTracks.includes(item.track)) {
    bullets.push(`Dein CV spielt aktuell stärker auf ${meta.cvTargetTracks.join(' / ')} als auf ${item.track}.`);
  }

  const actionStack: OpportunityDossier['actionStack'] =
    item.band === 'realistic'
      ? [
          {
            label: 'Jetzt',
            detail: `Bewerbung diese Woche rausschicken und im CV genau ${item.topReasons[0] ?? 'deinen stärksten Fit'} spiegeln.`,
            tone: 'success',
          },
          {
            label: 'Vorher',
            detail: item.topGaps[0] ?? 'Letzten CV-Feinschliff machen.',
            tone: companyLens.tone === 'success' ? 'info' : companyLens.tone,
          },
          { label: 'Prep-Fenster', detail: prepPlan.summary, tone: 'info' },
        ]
      : item.band === 'target'
        ? [
            {
              label: 'Heute',
              detail: `Gap "${item.topGaps[0] ?? 'Hauptlücke'}" als Task committen und die Firma nicht nur beobachten.`,
              tone: 'warning',
            },
            {
              label: 'Diese Woche',
              detail: `${prepPlan.summary} Ziel ist, ${companyLens.chips[0]?.label ?? 'den Lead'} in Realistic zu drücken.`,
              tone: 'warning',
            },
            { label: 'Danach', detail: 'Nach dem Prep erneut scoren und erst dann committen.', tone: 'info' },
          ]
        : [
            { label: 'Jetzt', detail: 'Parallel realistische Rollen offenhalten.', tone: 'error' },
            {
              label: 'Stretch-Prep',
              detail: `${prepPlan.summary} Nutze die Firma als Lernsignal, nicht als einzige Wette.`,
              tone: 'warning',
            },
            { label: 'Review', detail: 'Erst nach neuer Bewertung an diese Rolle committen.', tone: 'info' },
          ];

  return {
    tone: fitReadout.confidenceTone,
    summary: fitReadout.summary,
    chips,
    metrics,
    bullets,
    companyLens,
    actionStack,
  };
}
