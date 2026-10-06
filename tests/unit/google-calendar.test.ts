import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGoogleEventsInRange } from '@/lib/google/calendar';

vi.mock('@/lib/env', () => ({
  serverEnv: {
    GOOGLE_CLIENT_ID: 'mock-google-client-id',
    GOOGLE_CLIENT_SECRET: 'mock-google-client-secret',
  },
}));

describe('google calendar mapping', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps Google all-day end dates exclusive and marks the event as all-day', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 'all-day-event',
              summary: 'GMAT Block',
              start: { date: '2026-08-20' },
              end: { date: '2026-08-21' },
            },
          ],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const events = await fetchGoogleEventsInRange(
      '2026-08-20T00:00:00.000Z',
      '2026-08-22T00:00:00.000Z',
      'access-token',
      undefined,
      new Date(Date.now() + 60 * 60 * 1000).toISOString()
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.allDay).toBe(true);
    expect(events[0]?.startTime.getFullYear()).toBe(2026);
    expect(events[0]?.startTime.getMonth()).toBe(7);
    expect(events[0]?.startTime.getDate()).toBe(20);
    expect(events[0]?.startTime.getHours()).toBe(0);
    expect(events[0]?.endTime.getFullYear()).toBe(2026);
    expect(events[0]?.endTime.getMonth()).toBe(7);
    expect(events[0]?.endTime.getDate()).toBe(21);
    expect(events[0]?.endTime.getHours()).toBe(0);
  });

  it('returns empty array when neither accessToken nor refreshToken is present', async () => {
    const events = await fetchGoogleEventsInRange(
      '2026-08-20T00:00:00.000Z',
      '2026-08-22T00:00:00.000Z',
      undefined,
      undefined,
      undefined
    );

    expect(events).toEqual([]);
  });

  it('attempts token refresh when accessToken is missing but refreshToken is provided', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://oauth2.googleapis.com/token') {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: 'refreshed-token-xyz' }),
            { status: 200 }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 'synced-event',
                summary: 'Team Standup',
                start: { dateTime: '2026-08-20T09:00:00Z' },
                end: { dateTime: '2026-08-20T09:30:00Z' },
              },
            ],
          }),
          { status: 200 }
        )
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const events = await fetchGoogleEventsInRange(
      '2026-08-20T00:00:00.000Z',
      '2026-08-22T00:00:00.000Z',
      undefined,
      'valid-refresh-token'
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.title).toBe('Team Standup');
  });
});
