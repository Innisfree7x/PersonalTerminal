import { addDays, format } from 'date-fns';
import type { OpportunitySearchItem } from '@/lib/schemas/opportunity-radar.schema';

export interface OpportunityPrepPlan {
  effortHours: number;
  bufferWeeks: number;
  dueDate: string;
  summary: string;
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
