import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { searchCareerOpportunities } from '@/lib/application/use-cases/career';
import { careerRepository } from '@/lib/infrastructure/supabase/repositories/careerRepository';
import { fetchCareerCvProfile } from '@/lib/supabase/careerCvProfiles';
import {
  DachLocationSchema,
  OpportunitySearchInputSchema,
  RadarBandSchema,
  RadarTrackSchema,
} from '@/lib/schemas/opportunity-radar.schema';
import { getCareerLlmBudgetSnapshot, recordCareerLlmUsage } from '@/lib/career/llmUsage';
import { applyRateLimitHeaders, consumeRateLimit, readForwardedIpFromRequest } from '@/lib/api/rateLimit';

function parseCsv<T extends string>(raw: string | null, fallback: readonly T[], validator: (value: string) => T | null): T[] {
  if (!raw) return [...fallback];
  const parsed = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(validator)
    .filter((item): item is T => item !== null);

  return parsed.length > 0 ? parsed : [...fallback];
}

function validateTrack(raw: string | null) {
  const parsed = RadarTrackSchema.safeParse(raw);
  return parsed.success ? parsed.data : 'M&A';
}

function validateLocation(value: string) {
  const parsed = DachLocationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function validateBand(value: string) {
  const parsed = RadarBandSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseTrackList(values: unknown): ('M&A' | 'TS' | 'CorpFin' | 'Audit')[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => RadarTrackSchema.safeParse(value))
    .filter((parsed): parsed is { success: true; data: 'M&A' | 'TS' | 'CorpFin' | 'Audit' } => parsed.success)
    .map((parsed) => parsed.data);
}

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const rateLimit = consumeRateLimit({
      key: `career_opportunities:${user.id}:${readForwardedIpFromRequest(request)}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Zu viele Radar-Requests in kurzer Zeit. Bitte kurz warten.',
            },
          },
          { status: 429 }
        ),
        rateLimit
      );
    }

    const { searchParams } = new URL(request.url);

    const query = searchParams.get('query') ?? '';
    const priorityTrack = validateTrack(searchParams.get('priorityTrack'));
    const locations = parseCsv(searchParams.get('locations'), ['DE', 'AT', 'CH'], validateLocation);
    const bands = parseCsv(searchParams.get('bands'), ['realistic', 'target', 'stretch'], validateBand);

    const limitRaw = Number.parseInt(searchParams.get('limit') ?? '12', 10);
    const limit = Number.isFinite(limitRaw) ? limitRaw : 12;

    const input = OpportunitySearchInputSchema.parse({
      query,
      priorityTrack,
      locations,
      bands,
      limit,
    });

    let llmBudget = {
      enabled: false,
      maxDailyUnits: 50,
      usedUnits: 0,
      remainingUnits: 0,
    };
    try {
      const maxDailyUnitsRaw = Number.parseInt(process.env.CAREER_LLM_DAILY_LIMIT ?? '50', 10);
      const maxDailyUnits = Number.isFinite(maxDailyUnitsRaw) && maxDailyUnitsRaw > 0 ? maxDailyUnitsRaw : 50;
      llmBudget = await getCareerLlmBudgetSnapshot(user.id, maxDailyUnits);
    } catch (budgetError) {
      console.error('Failed to fetch LLM budget snapshot', budgetError);
    }

    const maxPerRequestRaw = Number.parseInt(process.env.CAREER_LLM_MAX_PER_REQUEST ?? '5', 10);
    const maxPerRequest = Number.isFinite(maxPerRequestRaw) && maxPerRequestRaw > 0 ? maxPerRequestRaw : 5;
    const llmMaxEnrichments = llmBudget.enabled ? Math.min(llmBudget.remainingUnits, maxPerRequest) : 0;

    const cvProfile = await fetchCareerCvProfile(user.id);
    const {
      items,
      sourcesQueried,
      liveSourceConfigured,
      liveSourceHealthy,
      liveSourceContributed,
      llmEnrichedCount,
    } = await searchCareerOpportunities(careerRepository, input, {
      cvProfile: cvProfile
        ? {
            rankTier: cvProfile.rank_tier,
            targetTracks: parseTrackList(cvProfile.target_tracks),
            skills: cvProfile.skills ?? [],
          }
        : null,
      llm: {
        enabled: llmBudget.enabled,
        maxEnrichments: llmMaxEnrichments,
      },
    });

    if (llmBudget.enabled && llmEnrichedCount > 0) {
      try {
        await recordCareerLlmUsage(user.id, llmEnrichedCount);
      } catch (recordError) {
        console.error('Failed to persist LLM usage log', recordError);
      }
    }

    const response = NextResponse.json({
      items,
      meta: {
        query: input.query,
        priorityTrack: input.priorityTrack,
        totalBeforeLimit: items.length,
        sourcesQueried,
        liveSourceConfigured,
        liveSourceHealthy,
        liveSourceContributed,
        cvProfileApplied: Boolean(cvProfile),
        llm: {
          enabled: llmBudget.enabled,
          maxDailyUnits: llmBudget.maxDailyUnits,
          usedUnits: llmBudget.usedUnits + (llmBudget.enabled ? llmEnrichedCount : 0),
          remainingUnits: Math.max(0, llmBudget.remainingUnits - (llmBudget.enabled ? llmEnrichedCount : 0)),
          enrichedThisRequest: llmEnrichedCount,
        },
      },
    });
    return applyRateLimitHeaders(response, rateLimit);
  } catch (error) {
    return handleRouteError(error, 'Opportunity Radar konnte nicht geladen werden.', 'Error fetching opportunity radar');
  }
}
