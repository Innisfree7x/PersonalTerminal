import { z } from 'zod';
import type {
  DachLocation,
  OpportunitySearchContext,
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
  description?: string;
  qualityBoost?: number;
  qualityReason?: string;
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
  description: string;
  qualityBoost: number;
  qualityReason?: string;
}

interface OpportunitySourceProvider {
  key: string;
  label: string;
  priority: number;
  search(query: string, input: OpportunitySearchInput): Promise<OpportunitySourceItem[]>;
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
    description: 'Intern role in M&A with valuation and execution support.',
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
    description: 'Working student role in due diligence and transaction support.',
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
    description: 'Audit and deals internship with transaction-adjacent projects.',
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
    description: 'Direct exposure to cross-border M&A deals and modeling updates.',
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
    description: 'Corporate finance internship with client presentation work.',
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
    description: 'FDD internship focused on transaction services and reporting.',
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
    description: 'Off-cycle intern in lean M&A team with execution tasks.',
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
    description: 'Entry role with process-heavy deal adjacent execution.',
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

const ADZUNA_COUNTRY_MAP: Record<DachLocation, string> = {
  DE: 'de',
  AT: 'at',
  CH: 'ch',
};

const NOISE_ROLE_PATTERNS = [
  'marketing',
  'vertrieb',
  'sales',
  'customer support',
  'it support',
  'software',
  'developer',
  'engineering',
  'logistik',
  'warehouse',
  'nursing',
  'teacher',
  'retail',
];

const TRACK_ROLE_KEYWORDS: Record<RadarTrack, string[]> = {
  'M&A': ['m&a', 'merger', 'acquisition', 'investment banking', 'corporate finance', 'transaction', 'deals'],
  TS: ['transaction services', 'due diligence', 'fdd', 'financial due diligence', 'deal advisory'],
  CorpFin: ['corporate finance', 'valuation', 'capital markets', 'm&a financing'],
  Audit: ['audit', 'assurance', 'wirtschaftspruefung', 'ifrs'],
};

const TARGET_FIRM_SIGNALS: Array<{ pattern: RegExp; boost: number; reason: string }> = [
  {
    pattern: /\b(deloitte|ey|kpmg|pwc|bdo|forvis|mazars|roedl|rodl|baker\s*tilly)\b/i,
    boost: 10,
    reason: 'Tier-1 Prüfungs-/Deals-Track',
  },
  {
    pattern: /\b(dz\s*bank|berenberg|unicredit|hauck|oddo|santander|deutsche\s*bank|j\.?p\.?\s*morgan|goldman)\b/i,
    boost: 9,
    reason: 'Investment-Banking Umfeld',
  },
  {
    pattern: /\b(dc\s*advisory|alantra|lincoln|rothschild|lazard|rothenstein|parkview|progressiv|value\s*trust|wts)\b/i,
    boost: 8,
    reason: 'M&A Advisory Fokus',
  },
  {
    pattern: /\b(rsm|ebner\s*stolz|flick\s*gocke|dhpg|ecovis|grant\s*thornton)\b/i,
    boost: 6,
    reason: 'Starker Mid-Market Track',
  },
];

const LLM_OUTPUT_SCHEMA = z.object({
  reasons: z.array(z.string().min(1)).min(1).max(3),
  gaps: z.array(z.string().min(1)).min(1).max(2),
});

const LLM_EXPLANATION_CACHE = new Map<string, { reasons: string[]; gaps: string[]; expiresAt: number }>();
const LLM_CACHE_TTL_MS = 1000 * 60 * 60;

function normalizeToken(input: string): string {
  return input.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim();
}

function isLikelyNoiseRole(text: string): boolean {
  return NOISE_ROLE_PATTERNS.some((pattern) => text.includes(pattern));
}

function trackKeywordMatchCount(track: RadarTrack, text: string): number {
  const keywords = TRACK_ROLE_KEYWORDS[track];
  return keywords.reduce((count, keyword) => (text.includes(keyword) ? count + 1 : count), 0);
}

function computeCompanyQualitySignal(company: string): { boost: number; reason?: string } {
  for (const signal of TARGET_FIRM_SIGNALS) {
    if (signal.pattern.test(company)) {
      return { boost: signal.boost, reason: signal.reason };
    }
  }
  return { boost: 0 };
}

function buildAdzunaWhat(input: OpportunitySearchInput): string {
  if (input.query.trim()) return input.query.trim();
  if (input.priorityTrack === 'M&A') return 'm&a internship corporate finance intern';
  if (input.priorityTrack === 'TS') return 'transaction services due diligence internship';
  if (input.priorityTrack === 'Audit') return 'audit internship assurance intern';
  return 'corporate finance valuation internship';
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

const RANK_TIER_BONUS: Record<NonNullable<OpportunitySearchContext['cvProfile']>['rankTier'], number> = {
  top: 4,
  strong: 2,
  developing: 0,
  early: -2,
};

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
      description: item.description ?? '',
      qualityBoost: item.qualityBoost ?? 0,
      ...(item.qualityReason ? { qualityReason: item.qualityReason } : {}),
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
          description: item.description ?? existing.description,
        }
      : {
          jobUrl: existing.jobUrl ?? item.jobUrl,
          description: existing.description || item.description || '',
        }),
    baseFit: Math.round((existing.baseFit + item.baseFit) / 2),
    reasonPool: uniqueStrings([...existing.reasonPool, ...item.reasonPool], 8),
    gapPool: uniqueStrings([...existing.gapPool, ...item.gapPool], 8),
    sourceLabels: uniqueStrings([...existing.sourceLabels, item.sourceLabel], 4),
    sourcePriorities: [...existing.sourcePriorities, item.sourcePriority],
    qualityBoost: Math.max(existing.qualityBoost, item.qualityBoost ?? 0),
    ...(existing.qualityReason || item.qualityReason
      ? { qualityReason: existing.qualityReason ?? item.qualityReason }
      : {}),
  };

  store.set(key, merged);
}

export function scoreToBand(score: number): RadarBand {
  if (score >= 72) return 'realistic';
  if (score >= 58) return 'target';
  return 'stretch';
}

function computeFitScore(
  opportunity: AggregatedOpportunity,
  input: OpportunitySearchInput,
  context?: OpportunitySearchContext
): number {
  const priorityIndex = TRACK_PRIORITY_ORDER.indexOf(input.priorityTrack);
  const trackIndex = TRACK_PRIORITY_ORDER.indexOf(opportunity.track);
  const trackDistance = Math.abs(trackIndex - priorityIndex);
  const trackAdjustment = Math.max(0, 12 - trackDistance * 4);

  const queryAdjustment = input.query.trim().length > 0 ? 6 : 0;
  const locationAdjustment = input.locations.includes(opportunity.country) ? 6 : -14;
  const cvProfile = context?.cvProfile;

  let cvAdjustment = 0;
  if (cvProfile) {
    cvAdjustment += RANK_TIER_BONUS[cvProfile.rankTier] ?? 0;
    if (cvProfile.targetTracks.includes(opportunity.track)) {
      cvAdjustment += 4;
    }

    const skills = cvProfile.skills.map((s) => normalizeToken(s));
    const text = normalizeToken(`${opportunity.title} ${opportunity.description}`);
    const overlapCount = skills.filter((skill) => skill.length >= 3 && text.includes(skill)).length;
    cvAdjustment += Math.min(4, overlapCount);
  }

  const qualityAdjustment = opportunity.qualityBoost;
  return clampScore(opportunity.baseFit + trackAdjustment + queryAdjustment + locationAdjustment + cvAdjustment + qualityAdjustment);
}

function buildReasons(opportunity: AggregatedOpportunity, input: OpportunitySearchInput): string[] {
  const trackReason =
    opportunity.track === input.priorityTrack
      ? `Direkter Track-Match zu ${input.priorityTrack}`
      : `Track-Nähe zu ${input.priorityTrack}`;
  const sourcesReason = `Mehrfach gefunden: ${opportunity.sourceLabels.join(' + ')}`;
  const locationReason = `Standort-Fit: ${locationLabel(opportunity.city, opportunity.country)}`;

  const qualityReason = opportunity.qualityReason ? [opportunity.qualityReason] : [];
  return [trackReason, ...qualityReason, sourcesReason, locationReason, ...opportunity.reasonPool].slice(0, 3);
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

function inferTrack(text: string): RadarTrack {
  const t = normalizeToken(text);
  if (/(audit|wirtschaftsprüfung|ifrs|assurance)/.test(t)) return 'Audit';
  if (/(transaction services|due diligence|fdd|ts )/.test(t)) return 'TS';
  if (/(corporate finance|corpfin|capital markets|m&a financing)/.test(t)) return 'CorpFin';
  return 'M&A';
}

function inferBaseFit(track: RadarTrack, text: string): number {
  const t = normalizeToken(text);
  let score = 55;
  if (/(intern|internship|praktikum|werkstudent|working student)/.test(t)) score += 8;
  if (/(m&a|merger|acquisition|deal)/.test(t) && track === 'M&A') score += 10;
  if (/(due diligence|fdd|transaction services)/.test(t) && track === 'TS') score += 10;
  if (/(corporate finance|valuation)/.test(t) && track === 'CorpFin') score += 9;
  if (/(audit|ifrs|assurance)/.test(t) && track === 'Audit') score += 9;
  return clampScore(score);
}

function inferReasonPool(track: RadarTrack, city: string, country: DachLocation): string[] {
  return [
    `Track-Fit auf ${track} im DACH-Markt`,
    `Standort-Fit: ${locationLabel(city, country)}`,
    'Praktikums-/Werkstudent-Route plausibel',
  ];
}

function inferGapPool(track: RadarTrack): string[] {
  if (track === 'M&A') return ['Case-Speed in Modellierung schärfen', 'Mehr belastbare Deal-Referenzen'];
  if (track === 'TS') return ['Accounting edge cases vertiefen', 'Reporting unter Zeitdruck trainieren'];
  if (track === 'CorpFin') return ['Valuation-Tiefe ausbauen', 'Pitch-Storyline präzisieren'];
  return ['Transaktionsnähe im CV stärken', 'Mehr projektkonkrete Ergebnisse ergänzen'];
}

function deriveCity(area: unknown): string {
  if (!Array.isArray(area)) return 'Unknown';
  const filtered = area.filter((x): x is string => typeof x === 'string').filter(Boolean);
  return filtered[filtered.length - 1] ?? filtered[0] ?? 'Unknown';
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function buildAdzunaProvider(): OpportunitySourceProvider | null {
  const appId = process.env.ADZUNA_APP_ID?.trim();
  const appKey = process.env.ADZUNA_APP_KEY?.trim();
  if (!appId || !appKey) return null;

  return {
    key: 'adzuna',
    label: 'Adzuna',
    priority: 4,
    search: async (query, input) => {
      const items: OpportunitySourceItem[] = [];
      const what = buildAdzunaWhat(input);

      const perLocation = await Promise.allSettled(
        input.locations.map(async (location) => {
          const countryCode = ADZUNA_COUNTRY_MAP[location];
          if (!countryCode) return [] as OpportunitySourceItem[];

          const url = new URL(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1`);
          url.searchParams.set('app_id', appId);
          url.searchParams.set('app_key', appKey);
          url.searchParams.set('what', what);
          url.searchParams.set('results_per_page', '20');
          url.searchParams.set('content-type', 'application/json');

          const response = await fetchWithTimeout(url.toString(), { method: 'GET', cache: 'no-store' }, 1800);
          if (!response.ok) return [] as OpportunitySourceItem[];

          const payload = (await response.json()) as { results?: unknown[] };
          const results = Array.isArray(payload.results) ? payload.results : [];
          const locationItems: OpportunitySourceItem[] = [];

          for (const raw of results) {
            const job = raw as any;
            const title = String(job?.title ?? '').trim();
            const company = String(job?.company?.display_name ?? '').trim();
            if (!title || !company) continue;

            const description = String(job?.description ?? '').slice(0, 1200);
            const textBlob = normalizeToken(`${title} ${description}`);
            const normalized = normalizeToken(title);
            const isStudentRole = /(intern|internship|praktikum|werkstudent|working student)/.test(normalized);
            if (!isStudentRole) continue;
            if (isLikelyNoiseRole(textBlob)) continue;

            const track = inferTrack(`${title} ${description}`);
            const trackMatchCount = trackKeywordMatchCount(input.priorityTrack, textBlob);
            const inferredTrackMismatch = track !== input.priorityTrack && trackMatchCount === 0;
            if (inferredTrackMismatch) continue;

            const city = deriveCity(job?.location?.area);
            const baseFit = inferBaseFit(track, `${title} ${description}`);
            const reasonPool = inferReasonPool(track, city, location);
            const gapPool = inferGapPool(track);
            const qualitySignal = computeCompanyQualitySignal(company);

            locationItems.push({
              sourceKey: 'adzuna',
              sourceLabel: 'Adzuna',
              sourcePriority: 4,
              externalId: String(job?.id ?? `${company}-${title}-${city}`),
              title,
              company,
              city,
              country: location,
              track,
              baseFit: clampScore(baseFit + Math.min(4, trackMatchCount)),
              reasonPool: qualitySignal.reason ? [qualitySignal.reason, ...reasonPool] : reasonPool,
              gapPool,
              jobUrl: typeof job?.redirect_url === 'string' ? job.redirect_url : undefined,
              description,
              qualityBoost: qualitySignal.boost,
              ...(qualitySignal.reason ? { qualityReason: qualitySignal.reason } : {}),
            });
          }

          return locationItems;
        })
      );

      perLocation.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        items.push(...result.value);
      });

      return filterByQuery(items, query);
    },
  };
}

function buildProviders(): OpportunitySourceProvider[] {
  const providers = [...STATIC_PROVIDERS];
  const adzuna = buildAdzunaProvider();
  if (adzuna) providers.unshift(adzuna);
  return providers;
}

function llmCacheKey(item: OpportunitySearchItem, input: OpportunitySearchInput): string {
  return `${input.priorityTrack}|${item.id}|${item.fitScore}|${item.band}`;
}

async function generateLlmReasonsAndGaps(
  item: OpportunitySearchItem,
  input: OpportunitySearchInput
): Promise<{ reasons: string[]; gaps: string[] } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const cacheKey = llmCacheKey(item, input);
  const cached = LLM_EXPLANATION_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { reasons: cached.reasons, gaps: cached.gaps };
  }

  const prompt = [
    'Du bist Career-Analyst fuer Finance-Praktika in DACH.',
    'Gib NUR valides JSON zurueck: {"reasons":["..."],"gaps":["..."]}.',
    'Regeln: reasons max 3, gaps max 2, konkrete Sprache, Deutsch, keine Floskeln.',
    `Prioritaets-Track: ${input.priorityTrack}`,
    `Job: ${item.title} @ ${item.company}, ${item.city}, ${item.country}`,
    `Band: ${item.band}, Score: ${item.fitScore}`,
    `Bekannte Gruende: ${item.topReasons.join(' | ')}`,
    `Bekannte Gaps: ${item.topGaps.join(' | ')}`,
  ].join('\n');

  try {
    const response = await fetchWithTimeout(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 180,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }],
        }),
      },
      2200
    );

    if (!response.ok) return null;
    const payload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = payload.content?.find((p) => p.type === 'text')?.text ?? '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart < 0 || jsonEnd <= jsonStart) return null;

    const parsedJson = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    const parsed = LLM_OUTPUT_SCHEMA.safeParse(parsedJson);
    if (!parsed.success) return null;

    const value = {
      reasons: parsed.data.reasons,
      gaps: parsed.data.gaps,
      expiresAt: Date.now() + LLM_CACHE_TTL_MS,
    };
    LLM_EXPLANATION_CACHE.set(cacheKey, value);
    return { reasons: value.reasons, gaps: value.gaps };
  } catch {
    return null;
  }
}

async function attachLlmExplanations(
  items: OpportunitySearchItem[],
  input: OpportunitySearchInput
): Promise<OpportunitySearchItem[]> {
  if (!process.env.ANTHROPIC_API_KEY) return items;
  if (items.length === 0) return items;

  const topCount = Math.min(5, items.length);
  const enrichedTop = await Promise.all(
    items.slice(0, topCount).map(async (item) => {
      const llm = await generateLlmReasonsAndGaps(item, input);
      if (!llm) return item;
      return {
        ...item,
        topReasons: llm.reasons,
        topGaps: llm.gaps,
      };
    })
  );

  return [...enrichedTop, ...items.slice(topCount)];
}

export async function searchRadarOpportunities(
  input: OpportunitySearchInput,
  context?: OpportunitySearchContext
): Promise<{
  items: OpportunitySearchItem[];
  sourcesQueried: number;
  liveSourceConfigured: boolean;
  liveSourceHealthy: boolean;
  liveSourceContributed: boolean;
}> {
  const providers = buildProviders();
  const settled = await Promise.allSettled(providers.map((provider) => provider.search(input.query, input)));
  const liveSourceConfigured = providers.some((provider) => provider.key === 'adzuna');
  const liveSourceHealthy = settled.some(
    (result, index) => providers[index]?.key === 'adzuna' && result.status === 'fulfilled'
  );

  const aggregated = new Map<string, AggregatedOpportunity>();
  let sourcesQueried = 0;

  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    sourcesQueried += 1;
    const provider = providers[index];
    if (!provider) return;

    result.value.forEach((raw) => {
      mergeIntoAggregate(aggregated, {
        ...raw,
        sourceLabel: provider.label,
        sourcePriority: provider.priority,
      });
    });
  });

  const scoredItems = Array.from(aggregated.values())
    .filter((item) => input.locations.includes(item.country))
    .map((item) => {
      const fitScore = computeFitScore(item, input, context);
      const band = scoreToBand(fitScore);
      const maxSourcePriority = Math.max(...item.sourcePriorities);

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
        maxSourcePriority,
        ...(item.jobUrl ? { jobUrl: item.jobUrl } : {}),
      };
    })
    .filter((item) => input.bands.includes(item.band))
    .sort((a, b) => {
      if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
      return b.maxSourcePriority - a.maxSourcePriority;
    })
    .slice(0, input.limit);

  const items = await attachLlmExplanations(
    scoredItems.map(({ maxSourcePriority: _maxSourcePriority, ...item }) => item),
    input
  );
  const liveSourceContributed = items.some((item) => item.sourceLabels.includes('Adzuna'));

  return {
    items,
    sourcesQueried,
    liveSourceConfigured,
    liveSourceHealthy,
    liveSourceContributed,
  };
}
