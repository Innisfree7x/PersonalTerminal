import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/api/server-errors', () => ({
  handleRouteError: vi.fn((error, userMessage) => NextResponse.json({ error: userMessage }, { status: 500 })),
}));

vi.mock('@/lib/application/use-cases/career', () => ({
  searchCareerOpportunities: vi.fn(),
}));

vi.mock('@/lib/infrastructure/supabase/repositories/careerRepository', () => ({
  careerRepository: {},
}));

vi.mock('@/lib/supabase/careerCvProfiles', () => ({
  fetchCareerCvProfile: vi.fn(),
}));

vi.mock('@/lib/career/llmUsage', () => ({
  getCareerLlmBudgetSnapshot: vi.fn().mockResolvedValue({
    enabled: false,
    maxDailyUnits: 50,
    usedUnits: 0,
    remainingUnits: 0,
  }),
  recordCareerLlmUsage: vi.fn(),
}));

vi.mock('@/lib/api/rateLimit', () => ({
  consumeRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 29, limit: 30, resetMs: 60000 }),
  applyRateLimitHeaders: vi.fn((response) => response),
  readForwardedIpFromRequest: vi.fn().mockReturnValue('127.0.0.1'),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { searchCareerOpportunities } from '@/lib/application/use-cases/career';
import { fetchCareerCvProfile } from '@/lib/supabase/careerCvProfiles';
import { getCareerLlmBudgetSnapshot, recordCareerLlmUsage } from '@/lib/career/llmUsage';
import { GET } from '@/app/api/career/opportunities/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedSearchCareerOpportunities = vi.mocked(searchCareerOpportunities);
const mockedFetchCareerCvProfile = vi.mocked(fetchCareerCvProfile);
const mockedGetCareerLlmBudgetSnapshot = vi.mocked(getCareerLlmBudgetSnapshot);
const mockedRecordCareerLlmUsage = vi.mocked(recordCareerLlmUsage);

describe('GET /api/career/opportunities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unauthorized when auth fails', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/career/opportunities'));
    expect(response.status).toBe(401);
  });

  it('parses filters and returns items', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
      errorResponse: null,
    } as any);

    mockedGetCareerLlmBudgetSnapshot.mockResolvedValueOnce({
      enabled: true,
      maxDailyUnits: 50,
      usedUnits: 10,
      remainingUnits: 40,
    });

    mockedSearchCareerOpportunities.mockResolvedValueOnce({
      items: [
        {
          id: 'alpha:1',
          title: 'Intern M&A Advisory',
          company: 'Rothenstein Partners',
          city: 'Frankfurt',
          country: 'DE',
          track: 'M&A',
          fitScore: 82,
          band: 'realistic',
          topReasons: ['test'],
          topGaps: ['gap'],
          sourceLabels: ['Campus Board'],
          jobUrl: 'https://example.com/job',
        },
      ],
      sourcesQueried: 3,
      liveSourceConfigured: true,
      liveSourceHealthy: true,
      liveSourceContributed: true,
      queryRelaxedUsed: false,
      bandRelaxedUsed: false,
      llmEnrichedCount: 3,
    } as any);
    mockedFetchCareerCvProfile.mockResolvedValueOnce(null as any);

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/api/career/opportunities?query=audit&priorityTrack=M%26A&locations=DE,AT&bands=realistic,target&limit=8'
      )
    );

    expect(response.status).toBe(200);
    expect(mockedSearchCareerOpportunities).toHaveBeenCalledWith(
      expect.anything(),
      {
        query: 'audit',
        priorityTrack: 'M&A',
        locations: ['DE', 'AT'],
        bands: ['realistic', 'target'],
        limit: 8,
      },
      {
        cvProfile: null,
        llm: { enabled: true, maxEnrichments: 5 },
      }
    );

    const body = await response.json();
    expect(body.items).toHaveLength(1);
    expect(body.meta.sourcesQueried).toBe(3);
    expect(body.meta.liveSourceConfigured).toBe(true);
    expect(body.meta.liveSourceContributed).toBe(true);
    expect(body.meta.queryRelaxedUsed).toBe(false);
    expect(body.meta.bandRelaxedUsed).toBe(false);
    expect(body.meta.cvProfileApplied).toBe(false);
    expect(body.meta.llm.enabled).toBe(true);
    expect(body.meta.llm.enrichedThisRequest).toBe(3);
    expect(mockedRecordCareerLlmUsage).toHaveBeenCalledWith('user-1', 3);
  });

  it('passes cv profile context into opportunity search', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: { id: 'user-42' },
      errorResponse: null,
    } as any);

    mockedFetchCareerCvProfile.mockResolvedValueOnce({
      rank_tier: 'strong',
      target_tracks: ['M&A', 'TS'],
      skills: ['valuation', 'excel modeling'],
      strengths: ['Financial modeling sichtbar im CV'],
      gaps: ['Mehr projektkonkrete Ergebnisse ergänzen'],
      updated_at: '2026-03-21T10:00:00.000Z',
    } as any);

    mockedSearchCareerOpportunities.mockResolvedValueOnce({
      items: [],
      sourcesQueried: 2,
      liveSourceConfigured: true,
      liveSourceHealthy: true,
      liveSourceContributed: false,
      queryRelaxedUsed: false,
      bandRelaxedUsed: false,
      llmEnrichedCount: 0,
    } as any);

    const response = await GET(
      new NextRequest('http://localhost:3000/api/career/opportunities?query=m%26a')
    );
    expect(response.status).toBe(200);

    expect(mockedSearchCareerOpportunities).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ query: 'm&a' }),
      {
        cvProfile: {
          rankTier: 'strong',
          targetTracks: ['M&A', 'TS'],
          skills: ['valuation', 'excel modeling'],
        },
        llm: { enabled: false, maxEnrichments: 0 },
      }
    );

    const body = await response.json();
    expect(body.meta.cvProfileApplied).toBe(true);
    expect(body.meta.cvRankTier).toBe('strong');
    expect(body.meta.cvTargetTracks).toEqual(['M&A', 'TS']);
    expect(body.meta.cvTopStrengths).toEqual(['Financial modeling sichtbar im CV']);
    expect(body.meta.cvTopGaps).toEqual(['Mehr projektkonkrete Ergebnisse ergänzen']);
    expect(body.meta.cvUpdatedAt).toBe('2026-03-21T10:00:00.000Z');
  });
});
