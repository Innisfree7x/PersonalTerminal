import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/api/csrf', () => ({
  enforceTrustedMutationOrigin: vi.fn(() => null),
}));

vi.mock('@/lib/api/rateLimit', () => ({
  consumeRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 19, retryAfterSeconds: 0 }),
  applyRateLimitHeaders: vi.fn((response) => response),
  readForwardedIpFromRequest: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/kit-sync/service', () => ({
  acknowledgeIliasItemsForUser: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { acknowledgeIliasItemsForUser } from '@/lib/kit-sync/service';
import { POST } from '@/app/api/kit/ilias-items/acknowledge/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedAcknowledgeIliasItemsForUser = vi.mocked(acknowledgeIliasItemsForUser);

describe('POST /api/kit/ilias-items/acknowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/ilias-items/acknowledge', {
        method: 'POST',
        body: JSON.stringify({ ids: ['15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1'] }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(401);
  });

  it('acknowledges ilias items for the authenticated user', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);
    mockedAcknowledgeIliasItemsForUser.mockResolvedValueOnce({
      acknowledgedCount: 2,
      nextStatus: {
        freshIliasItems: 0,
        freshIliasPreview: [],
      },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/ilias-items/acknowledge', {
        method: 'POST',
        body: JSON.stringify({
          ids: [
            '15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1',
            '3484a6ef-e845-49f0-b33b-6a014c8392d6',
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(200);
    expect(mockedAcknowledgeIliasItemsForUser).toHaveBeenCalledWith('user-1', [
      '15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1',
      '3484a6ef-e845-49f0-b33b-6a014c8392d6',
    ]);
    const body = await response.json();
    expect(body.acknowledgedCount).toBe(2);
    expect(body.nextStatus.freshIliasItems).toBe(0);
  });

  it('returns 400 for invalid ids payloads', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/ilias-items/acknowledge', {
        method: 'POST',
        body: JSON.stringify({ ids: ['not-a-uuid'] }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(400);
    expect(mockedAcknowledgeIliasItemsForUser).not.toHaveBeenCalled();
  });
});
