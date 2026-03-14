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

import { requireApiAuth } from '@/lib/api/auth';
import { searchCareerOpportunities } from '@/lib/application/use-cases/career';
import { GET } from '@/app/api/career/opportunities/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedSearchCareerOpportunities = vi.mocked(searchCareerOpportunities);

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
    } as any);

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/api/career/opportunities?query=audit&priorityTrack=M%26A&locations=DE,AT&bands=realistic,target&limit=8'
      )
    );

    expect(response.status).toBe(200);
    expect(mockedSearchCareerOpportunities).toHaveBeenCalledWith(expect.anything(), {
      query: 'audit',
      priorityTrack: 'M&A',
      locations: ['DE', 'AT'],
      bands: ['realistic', 'target'],
      limit: 8,
    });

    const body = await response.json();
    expect(body.items).toHaveLength(1);
    expect(body.meta.sourcesQueried).toBe(3);
    expect(body.meta.liveSourceConfigured).toBe(true);
    expect(body.meta.liveSourceContributed).toBe(true);
  });
});
