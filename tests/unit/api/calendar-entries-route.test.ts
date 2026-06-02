import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock('@/lib/supabase/calendarEntries', () => ({
  listCalendarEntriesInRange: vi.fn(),
  createCalendarEntry: vi.fn(),
}));

vi.mock('@/lib/google/calendar', () => ({
  fetchGoogleEventsInRange: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { fetchGoogleEventsInRange } from '@/lib/google/calendar';
import { listCalendarEntriesInRange } from '@/lib/supabase/calendarEntries';
import { GET } from '@/app/api/calendar/entries/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedFetchGoogleEventsInRange = vi.mocked(fetchGoogleEventsInRange);
const mockedListCalendarEntriesInRange = vi.mocked(listCalendarEntriesInRange);

function authOk() {
  return { user: { id: 'user-123' } as any, errorResponse: null };
}

function requestWithCookies(url: string): NextRequest {
  const request = new NextRequest(url);
  request.cookies.set('google_access_token', 'access-token');
  request.cookies.set('google_refresh_token', 'refresh-token');
  request.cookies.set('google_token_expires_at', new Date(Date.now() + 60 * 60 * 1000).toISOString());
  return request;
}

describe('GET /api/calendar/entries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedListCalendarEntriesInRange.mockResolvedValue([]);
  });

  it('merges Google all-day entries with the allDay flag preserved', async () => {
    mockedFetchGoogleEventsInRange.mockResolvedValue([
      {
        id: 'google-1',
        title: 'GMAT Block',
        startTime: new Date('2026-08-20T00:00:00.000Z'),
        endTime: new Date('2026-08-21T00:00:00.000Z'),
        allDay: true,
        type: 'meeting',
        source: 'google',
      },
    ]);

    const response = await GET(
      requestWithCookies(
        'http://localhost:3000/api/calendar/entries?from=2026-08-20T00:00:00.000Z&to=2026-08-22T00:00:00.000Z'
      )
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.entries).toEqual([
      {
        id: 'google-google-1',
        source: 'google',
        title: 'GMAT Block',
        description: null,
        location: null,
        startsAt: '2026-08-20T00:00:00.000Z',
        endsAt: '2026-08-21T00:00:00.000Z',
        allDay: true,
        kind: 'meeting',
      },
    ]);
  });

  it('returns the auth error response for unauthenticated users', async () => {
    mockedRequireApiAuth.mockResolvedValue({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/api/calendar/entries?from=2026-08-20T00:00:00.000Z&to=2026-08-22T00:00:00.000Z'
      )
    );

    expect(response.status).toBe(401);
  });
});
