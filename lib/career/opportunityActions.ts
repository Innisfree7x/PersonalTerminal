import { addDays, format } from 'date-fns';
import type { OpportunitySearchItem } from '@/lib/schemas/opportunity-radar.schema';

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

export function buildOpportunityTrajectoryHref(item: OpportunitySearchItem): string | null {
  const primaryGap = item.topGaps[0];
  if (!primaryGap) return null;

  const params = new URLSearchParams({
    prefillTitle: `${item.track} Prep: ${primaryGap}`,
    prefillCategory: 'internship',
    prefillDueDate: inferPrepDueDate(item),
    prefillEffortHours: String(inferPrepEffortHours(item)),
    prefillBufferWeeks: String(inferPrepBufferWeeks(item)),
    source: 'career_gap_bridge',
  });

  return `/trajectory?${params.toString()}`;
}
