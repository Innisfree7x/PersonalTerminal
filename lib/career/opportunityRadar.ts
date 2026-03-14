import type {
  DachLocation,
  OpportunitySearchInput,
  OpportunitySearchItem,
  RadarBand,
  RadarTrack,
} from '@/lib/schemas/opportunity-radar.schema';

const TRACK_PRIORITY_ORDER: RadarTrack[] = ['M&A', 'TS', 'CorpFin', 'Audit'];

interface OpportunitySourceItem {
  sourceKey: string;
  sourceLabel: string;
  sourcePriority: number;
  externalId: string;
  title: string;
  company: string;
  city: string;
  country: DachLocation;
  track: RadarTrack;
  baseFit: number;
  reasonPool: string[];
  gapPool: string[];
  jobUrl?: string;
}

interface AggregatedOpportunity {
  id: string;
  title: string;
  company: string;
  city: string;
  country: DachLocation;
  track: RadarTrack;
  baseFit: number;
  reasonPool: string[];
  gapPool: string[];
  jobUrl: string | undefined;
  sourceLabels: string[];
  sourcePriorities: number[];
}

interface OpportunitySourceProvider {
  key: string;
  label: string;
  priority: number;
  search(query: string): Promise<OpportunitySourceItem[]>;
}

const SOURCE_ALPHA_DATA: OpportunitySourceItem[] = [
  {
    sourceKey: 'alpha_board',
    sourceLabel: 'Campus Board',
    sourcePriority: 3,
    externalId: 'alpha-1',
    title: 'Intern M&A Advisory',
    company: 'Rothenstein Partners',
    city: 'Frankfurt',
    country: 'DE',
    track: 'M&A',
    baseFit: 80,
    reasonPool: ['Strong M&A exposure', 'Lean deal team setup', 'Relevant valuation workflow'],
    gapPool: ['More live deal references', 'Interview case speed'],
    jobUrl: 'https://example.com/jobs/ma-intern-frankfurt',
  },
  {
    sourceKey: 'alpha_board',
    sourceLabel: 'Campus Board',
    sourcePriority: 3,
    externalId: 'alpha-2',
    title: 'Transaction Services Working Student',
    company: 'Nordbridge Advisory',
    city: 'Munich',
    country: 'DE',
    track: 'TS',
    baseFit: 73,
    reasonPool: ['Due diligence process fit', 'Solid TS progression', 'Strong reporting match'],
    gapPool: ['Industry-specific accounting depth', 'Data-room quality checks'],
    jobUrl: 'https://example.com/jobs/ts-working-student-munich',
  },
  {
    sourceKey: 'alpha_board',
    sourceLabel: 'Campus Board',
    sourcePriority: 3,
    externalId: 'alpha-3',
    title: 'Audit & Deals Internship',
    company: 'Eiger Assurance',
    city: 'Vienna',
    country: 'AT',
    track: 'Audit',
    baseFit: 59,
    reasonPool: ['Accessible DACH entry route', 'Strong process discipline', 'Good lateral move potential'],
    gapPool: ['Less direct M&A execution', 'Slower transaction tempo'],
    jobUrl: 'https://example.com/jobs/audit-deals-vienna',
  },
];

const SOURCE_BETA_DATA: OpportunitySourceItem[] = [
  {
    sourceKey: 'beta_feed',
    sourceLabel: 'Employer Feed',
    sourcePriority: 2,
    externalId: 'beta-1',
    title: 'Intern M&A Advisory',
    company: 'Rothenstein Partners',
    city: 'Frankfurt',
    country: 'DE',
    track: 'M&A',
    baseFit: 82,
    reasonPool: ['High ownership in intern role', 'Cross-border mandate exposure', 'Frequent model updates'],
    gapPool: ['Compressed deal timelines'],
    jobUrl: 'https://example.com/jobs/ma-intern-frankfurt-feed',
  },
  {
    sourceKey: 'beta_feed',
    sourceLabel: 'Employer Feed',
    sourcePriority: 2,
    externalId: 'beta-2',
    title: 'Corporate Finance Internship',
    company: 'Alpine Capital',
    city: 'Zurich',
    country: 'CH',
    track: 'CorpFin',
    baseFit: 67,
    reasonPool: ['Broader corporate finance exposure', 'Good strategic toolkit', 'High client touch frequency'],
    gapPool: ['LBO modeling depth', 'Narrative deck polish'],
    jobUrl: 'https://example.com/jobs/corpfin-intern-zurich',
  },
  {
    sourceKey: 'beta_feed',
    sourceLabel: 'Employer Feed',
    sourcePriority: 2,
    externalId: 'beta-3',
    title: 'TS Internship Financial Due Diligence',
    company: 'Kern Advisory',
    city: 'Hamburg',
    country: 'DE',
    track: 'TS',
    baseFit: 78,
    reasonPool: ['Direct TS workflow overlap', 'Diligence skill transfer', 'Good path toward M&A'],
    gapPool: ['Industry accounting edge cases', 'Speed under reporting pressure'],
    jobUrl: 'https://example.com/jobs/ts-fdd-hamburg',
  },
];

const SOURCE_GAMMA_DATA: OpportunitySourceItem[] = [
  {
    sourceKey: 'gamma_network',
    sourceLabel: 'Network Openings',
    sourcePriority: 1,
    externalId: 'gamma-1',
    title: 'M&A Off-Cycle Intern',
    company: 'Helvetic Mergers',
    city: 'Zurich',
    country: 'CH',
    track: 'M&A',
    baseFit: 63,
    reasonPool: ['Execution-heavy off-cycle role', 'Small team learning velocity', 'Deal room ownership'],
    gapPool: ['Niche-sector depth', 'Formal process structure'],
    jobUrl: 'https://example.com/jobs/off-cycle-ma-zurich',
  },
  {
    sourceKey: 'gamma_network',
    sourceLabel: 'Network Openings',
    sourcePriority: 1,
    externalId: 'gamma-2',
    title: 'Audit & Deals Internship',
    company: 'Eiger Assurance',
    city: 'Vienna',
    country: 'AT',
    track: 'Audit',
    baseFit: 61,
    reasonPool: ['Entry with immediate deal-adjacent tasks', 'Solid process quality standards'],
    gapPool: ['Lower transaction intensity'],
    jobUrl: 'https://example.com/jobs/audit-deals-vienna-network',
  },
];

const STATIC_PROVIDERS: OpportunitySourceProvider[] = [
  {
    key: 'alpha_board',
    label: 'Campus Board',
    priority: 3,
    search: async (query) => filterByQuery(SOURCE_ALPHA_DATA, query),
  },
  {
    key: 'beta_feed',
    label: 'Employer Feed',
    priority: 2,
    search: async (query) => filterByQuery(SOURCE_BETA_DATA, query),
  },
  {
    key: 'gamma_network',
    label: 'Network Openings',
    priority: 1,
    search: async (query) => filterByQuery(SOURCE_GAMMA_DATA, query),
  },
];

function normalizeToken(input: string): string {
  return input.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim();
}

function dedupeKey(item: OpportunitySourceItem): string {
  return [item.company, item.title, item.city, item.country].map(normalizeToken).join('|');
}

function uniqueStrings(items: string[], limit: number): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))).slice(0, limit);
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function locationLabel(city: string, country: DachLocation): string {
  return `${city}, ${country}`;
}

function filterByQuery(items: OpportunitySourceItem[], query: string): OpportunitySourceItem[] {
  const trimmed = query.trim();
  if (!trimmed) return items;

  const tokens = normalizeToken(trimmed)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) return items;

  return items.filter((item) => {
    const haystack = normalizeToken(`${item.title} ${item.company} ${item.city} ${item.track}`);
    return tokens.every((token) => haystack.includes(token));
  });
}

function mergeIntoAggregate(store: Map<string, AggregatedOpportunity>, item: OpportunitySourceItem): void {
  const key = dedupeKey(item);
  const existing = store.get(key);

  if (!existing) {
    store.set(key, {
      id: `${item.sourceKey}:${item.externalId}`,
      title: item.title,
      company: item.company,
      city: item.city,
      country: item.country,
      track: item.track,
      baseFit: item.baseFit,
      reasonPool: item.reasonPool,
      gapPool: item.gapPool,
      jobUrl: item.jobUrl,
      sourceLabels: [item.sourceLabel],
      sourcePriorities: [item.sourcePriority],
    });
    return;
  }

  const strongestPriority = Math.max(...existing.sourcePriorities);
  const shouldReplacePrimaryFields = item.sourcePriority > strongestPriority;

  const merged: AggregatedOpportunity = {
    ...existing,
    ...(shouldReplacePrimaryFields
      ? {
          id: `${item.sourceKey}:${item.externalId}`,
          title: item.title,
          company: item.company,
          city: item.city,
          country: item.country,
          track: item.track,
          jobUrl: item.jobUrl ?? existing.jobUrl,
        }
      : {
          jobUrl: existing.jobUrl ?? item.jobUrl,
        }),
    baseFit: Math.round((existing.baseFit + item.baseFit) / 2),
    reasonPool: uniqueStrings([...existing.reasonPool, ...item.reasonPool], 8),
    gapPool: uniqueStrings([...existing.gapPool, ...item.gapPool], 8),
    sourceLabels: uniqueStrings([...existing.sourceLabels, item.sourceLabel], 4),
    sourcePriorities: [...existing.sourcePriorities, item.sourcePriority],
  };

  store.set(key, merged);
}

export function scoreToBand(score: number): RadarBand {
  if (score >= 72) return 'realistic';
  if (score >= 58) return 'target';
  return 'stretch';
}

function computeFitScore(opportunity: AggregatedOpportunity, input: OpportunitySearchInput): number {
  const priorityIndex = TRACK_PRIORITY_ORDER.indexOf(input.priorityTrack);
  const trackIndex = TRACK_PRIORITY_ORDER.indexOf(opportunity.track);
  const trackDistance = Math.abs(trackIndex - priorityIndex);
  const trackAdjustment = Math.max(0, 12 - trackDistance * 4);

  const queryAdjustment = input.query.trim().length > 0 ? 6 : 0;
  const locationAdjustment = input.locations.includes(opportunity.country) ? 6 : -14;

  return clampScore(opportunity.baseFit + trackAdjustment + queryAdjustment + locationAdjustment);
}

function buildReasons(opportunity: AggregatedOpportunity, input: OpportunitySearchInput): string[] {
  const trackReason =
    opportunity.track === input.priorityTrack
      ? `Direkter Track-Match zu ${input.priorityTrack}`
      : `Track-Nähe zu ${input.priorityTrack}`;
  const sourcesReason = `Mehrfach gefunden: ${opportunity.sourceLabels.join(' + ')}`;
  const locationReason = `Standort-Fit: ${locationLabel(opportunity.city, opportunity.country)}`;

  return [trackReason, sourcesReason, locationReason, ...opportunity.reasonPool].slice(0, 3);
}

function buildGaps(opportunity: AggregatedOpportunity, band: RadarBand): string[] {
  if (band === 'realistic') {
    return opportunity.gapPool.slice(0, 2);
  }
  if (band === 'target') {
    return uniqueStrings([...opportunity.gapPool, 'Case-Speed für Interviews nachschärfen'], 2);
  }
  return uniqueStrings(['Erfahrungstiefe im Vergleich zum Markt', ...opportunity.gapPool], 2);
}

export async function searchRadarOpportunities(input: OpportunitySearchInput): Promise<{ items: OpportunitySearchItem[]; sourcesQueried: number }> {
  const settled = await Promise.allSettled(STATIC_PROVIDERS.map((provider) => provider.search(input.query)));

  const aggregated = new Map<string, AggregatedOpportunity>();
  let sourcesQueried = 0;

  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    sourcesQueried += 1;
    const provider = STATIC_PROVIDERS[index];
    if (!provider) return;

    result.value.forEach((raw) => {
      mergeIntoAggregate(aggregated, {
        ...raw,
        sourceLabel: provider.label,
        sourcePriority: provider.priority,
      });
    });
  });

  const items = Array.from(aggregated.values())
    .filter((item) => input.locations.includes(item.country))
    .map((item) => {
      const fitScore = computeFitScore(item, input);
      const band = scoreToBand(fitScore);

      return {
        id: item.id,
        title: item.title,
        company: item.company,
        city: item.city,
        country: item.country,
        track: item.track,
        fitScore,
        band,
        topReasons: buildReasons(item, input),
        topGaps: buildGaps(item, band),
        sourceLabels: item.sourceLabels,
        ...(item.jobUrl ? { jobUrl: item.jobUrl } : {}),
      };
    })
    .filter((item) => input.bands.includes(item.band))
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, input.limit);

  return { items, sourcesQueried };
}
