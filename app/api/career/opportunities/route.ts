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

    const cvProfile = await fetchCareerCvProfile(user.id);
    const {
      items,
      sourcesQueried,
      liveSourceConfigured,
      liveSourceHealthy,
      liveSourceContributed,
    } = await searchCareerOpportunities(careerRepository, input, {
      cvProfile: cvProfile
        ? {
            rankTier: cvProfile.rank_tier,
            targetTracks: parseTrackList(cvProfile.target_tracks),
            skills: cvProfile.skills ?? [],
          }
        : null,
    });

    return NextResponse.json({
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
      },
    });
  } catch (error) {
    return handleRouteError(error, 'Opportunity Radar konnte nicht geladen werden.', 'Error fetching opportunity radar');
  }
}
