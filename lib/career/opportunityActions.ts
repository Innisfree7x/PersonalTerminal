import { addDays, format } from 'date-fns';
import type { OpportunitySearchItem } from '@/lib/schemas/opportunity-radar.schema';

export interface OpportunityPrepPlan {
  effortHours: number;
  bufferWeeks: number;
  dueDate: string;
  summary: string;
}

interface OpportunityStrategyPreset {
  impactPotential: number;
  confidenceLevel: number;
  strategicFit: number;
  effortCost: number;
  downsideRisk: number;
  timeToValueWeeks: number;
}

function inferPrepEffortHours(item: OpportunitySearchItem): number {
  if (item.band === 'stretch') return 24;
  if (item.band === 'target') return 18;
  return 12;
}

function inferPrepBufferWeeks(item: OpportunitySearchItem): number {
  return item.band === 'stretch' ? 2 : 1;
}

function inferPrepDueDate(item: OpportunitySearchItem): string {
  const days =
    item.band === 'stretch'
      ? 42
      : item.band === 'target'
        ? 28
        : 21;

  return format(addDays(new Date(), days), 'yyyy-MM-dd');
}

export function buildOpportunityPrepPlan(item: OpportunitySearchItem): OpportunityPrepPlan {
  const effortHours = inferPrepEffortHours(item);
  const bufferWeeks = inferPrepBufferWeeks(item);
  const dueDate = inferPrepDueDate(item);
  const summary =
    item.band === 'realistic'
      ? `${effortHours}h Feinschliff, Bewerbung diese Woche.`
      : item.band === 'target'
        ? `${effortHours}h Prep mit ${bufferWeeks} Woche Puffer vor dem nächsten Review.`
        : `${effortHours}h gezielter Stretch-Prep mit ${bufferWeeks} Wochen Puffer vor Neubewertung.`;

  return {
    effortHours,
    bufferWeeks,
    dueDate,
    summary,
  };
}

export function buildOpportunityTrajectoryHref(item: OpportunitySearchItem): string | null {
  const primaryGap = item.topGaps[0];
  if (!primaryGap) return null;

  const prepPlan = buildOpportunityPrepPlan(item);
  const params = new URLSearchParams({
    prefillTitle: `${item.track} Prep: ${primaryGap}`,
    prefillCategory: 'internship',
    prefillDueDate: prepPlan.dueDate,
    prefillEffortHours: String(prepPlan.effortHours),
    prefillBufferWeeks: String(prepPlan.bufferWeeks),
    source: 'career_gap_bridge',
  });

  return `/trajectory?${params.toString()}`;
}

function getStrategyPreset(item: OpportunitySearchItem): OpportunityStrategyPreset {
  if (item.band === 'realistic') {
    return {
      impactPotential: 8,
      confidenceLevel: 8,
      strategicFit: 8,
      effortCost: 4,
      downsideRisk: 3,
      timeToValueWeeks: 3,
    };
  }

  if (item.band === 'target') {
    return {
      impactPotential: 8,
      confidenceLevel: 6,
      strategicFit: 7,
      effortCost: 6,
      downsideRisk: 5,
      timeToValueWeeks: 4,
    };
  }

  return {
    impactPotential: 7,
    confidenceLevel: 4,
    strategicFit: 6,
    effortCost: 8,
    downsideRisk: 7,
    timeToValueWeeks: 6,
  };
}

export function buildOpportunityStrategyHref(item: OpportunitySearchItem): string {
  const primaryGap = item.topGaps[0] ?? 'Signal-Schärfung im CV';
  const preset = getStrategyPreset(item);
  const prepPlan = buildOpportunityPrepPlan(item);

  const params = new URLSearchParams({
    source: 'career_strategy_bridge',
    prefillDecisionTitle: `${item.company} jetzt priorisieren?`,
    prefillDecisionContext: `${item.title} in ${item.city}, ${item.country}. Lead-Band: ${item.band}. Hauptlücke: ${primaryGap}.`,
    prefillTargetDate: prepPlan.dueDate,
    prefillOptionTitle: `${item.company} aktiv verfolgen`,
    prefillOptionSummary: `${item.title} · ${item.track} · ${primaryGap}`,
    prefillImpactPotential: String(preset.impactPotential),
    prefillConfidenceLevel: String(preset.confidenceLevel),
    prefillStrategicFit: String(preset.strategicFit),
    prefillEffortCost: String(preset.effortCost),
    prefillDownsideRisk: String(preset.downsideRisk),
    prefillTimeToValueWeeks: String(preset.timeToValueWeeks),
  });

  return `/strategy?${params.toString()}`;
}
