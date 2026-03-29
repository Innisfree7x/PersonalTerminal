import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/api/csrf', () => ({
  enforceTrustedMutationOrigin: vi.fn(() => null),
}));

vi.mock('@/lib/api/rateLimit', () => ({
  consumeRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 0, retryAfterSeconds: 0 }),
  applyRateLimitHeaders: vi.fn((response) => response),
  readForwardedIpFromRequest: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/kit-sync/service', () => ({
  syncCampusWebcalForUser: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { syncCampusWebcalForUser } from '@/lib/kit-sync/service';
import { POST } from '@/app/api/kit/sync/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedSyncCampusWebcalForUser = vi.mocked(syncCampusWebcalForUser);

describe('POST /api/kit/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/sync', {
        method: 'POST',
        body: JSON.stringify({ source: 'campus_webcal' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(401);
  });

  it('starts a manual campus webcal sync', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);
    mockedSyncCampusWebcalForUser.mockResolvedValueOnce({
      source: 'campus_webcal',
      itemsRead: 4,
      itemsWritten: 4,
      calendarName: 'KIT',
      nextStatus: { campusWebcalConfigured: true },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/sync', {
        method: 'POST',
        body: JSON.stringify({ source: 'campus_webcal' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(200);
    expect(mockedSyncCampusWebcalForUser).toHaveBeenCalledWith('user-1', 'manual');
    const body = await response.json();
    expect(body.itemsWritten).toBe(4);
  });
});
