import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/api/server-errors', () => ({
  handleRouteError: vi.fn((error, userMessage) => NextResponse.json({ error: userMessage }, { status: 500 })),
}));

vi.mock('@/lib/api/csrf', () => ({
  enforceTrustedMutationOrigin: vi.fn(() => null),
}));

vi.mock('@/lib/api/rateLimit', () => ({
  consumeRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 9, limit: 10, resetMs: 60000 }),
  applyRateLimitHeaders: vi.fn((response) => response),
  readForwardedIpFromRequest: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/supabase/careerCvProfiles', () => ({
  upsertCareerCvProfile: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { upsertCareerCvProfile } from '@/lib/supabase/careerCvProfiles';
import { POST } from '@/app/api/cv/analyze/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedUpsertCareerCvProfile = vi.mocked(upsertCareerCvProfile);

describe('POST /api/cv/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/cv/analyze', {
      method: 'POST',
      body: JSON.stringify({ cvText: 'x'.repeat(100), targetTracks: ['M&A'] }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('analyzes cv and persists profile', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
      errorResponse: null,
    } as any);

    mockedUpsertCareerCvProfile.mockResolvedValueOnce({
      profile: null,
      persisted: true,
    });

    const request = new NextRequest('http://localhost:3000/api/cv/analyze', {
      method: 'POST',
      body: JSON.stringify({
        cvText:
          'Internship in M&A with DCF and due diligence. Excel and PowerPoint exposure in client projects.',
        targetTracks: ['M&A'],
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.analysis.cvRank).toBeGreaterThan(0);
    expect(body.meta.persisted).toBe(true);
    expect(mockedUpsertCareerCvProfile).toHaveBeenCalled();
  });
});
