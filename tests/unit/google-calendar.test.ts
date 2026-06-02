import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGoogleEventsInRange } from '@/lib/google/calendar';

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
});
