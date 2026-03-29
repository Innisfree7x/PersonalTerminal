import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/api/csrf', () => ({
  enforceTrustedMutationOrigin: vi.fn(() => null),
}));

vi.mock('@/lib/api/rateLimit', () => ({
  consumeRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 5, retryAfterSeconds: 0 }),
  applyRateLimitHeaders: vi.fn((response) => response),
  readForwardedIpFromRequest: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/kit-sync/service', () => ({
  saveCampusWebcalForUser: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { saveCampusWebcalForUser } from '@/lib/kit-sync/service';
import { POST } from '@/app/api/kit/webcal/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedSaveCampusWebcalForUser = vi.mocked(saveCampusWebcalForUser);

describe('POST /api/kit/webcal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/webcal', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com/feed.ics' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(401);
  });

  it('validates and stores webcal urls', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);
    mockedSaveCampusWebcalForUser.mockResolvedValueOnce({
      maskedUrl: 'campus.studium.kit.edu/…',
      calendarName: 'KIT Kalender',
      validatedAt: '2026-03-29T12:00:00.000Z',
    });

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/webcal', {
        method: 'POST',
        body: JSON.stringify({ url: 'webcal://campus.studium.kit.edu/feed.ics' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(200);
    expect(mockedSaveCampusWebcalForUser).toHaveBeenCalledWith('user-1', 'webcal://campus.studium.kit.edu/feed.ics');
    const body = await response.json();
    expect(body.calendarName).toBe('KIT Kalender');
  });

  it('returns 400 for missing url', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/webcal', {
        method: 'POST',
        body: JSON.stringify({ url: '' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(400);
  });
});
