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
  removeIliasFavoriteForUser: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { removeIliasFavoriteForUser } from '@/lib/kit-sync/service';
import { DELETE } from '@/app/api/kit/ilias-favorites/[id]/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedRemoveIliasFavoriteForUser = vi.mocked(removeIliasFavoriteForUser);

describe('DELETE /api/kit/ilias-favorites/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/kit/ilias-favorites/15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1', {
        method: 'DELETE',
      }),
      { params: { id: '15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1' } }
    );

    expect(response.status).toBe(401);
  });

  it('deletes a single ilias favorite for the authenticated user', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);
    mockedRemoveIliasFavoriteForUser.mockResolvedValueOnce({
      removedFavoriteId: '15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1',
      removedTitle: 'Investments SS2025',
      itemsDeleted: 4,
      nextStatus: {
        totalIliasFavorites: 2,
      },
    } as any);

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/kit/ilias-favorites/15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1', {
        method: 'DELETE',
      }),
      { params: { id: '15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1' } }
    );

    expect(response.status).toBe(200);
    expect(mockedRemoveIliasFavoriteForUser).toHaveBeenCalledWith(
      'user-1',
      '15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1'
    );
    const body = await response.json();
    expect(body.removedTitle).toBe('Investments SS2025');
    expect(body.itemsDeleted).toBe(4);
  });

  it('returns 400 for invalid favorite ids', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);

    const response = await DELETE(
      new NextRequest('http://localhost:3000/api/kit/ilias-favorites/not-a-uuid', {
        method: 'DELETE',
      }),
      { params: { id: 'not-a-uuid' } }
    );

    expect(response.status).toBe(400);
    expect(mockedRemoveIliasFavoriteForUser).not.toHaveBeenCalled();
  });
});
