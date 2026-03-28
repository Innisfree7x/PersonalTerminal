import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  serverTrackMock: vi.fn(),
}));

vi.mock('@vercel/analytics/server', () => ({
  track: mocks.serverTrackMock,
}));

import { dispatchAnalyticsEvent } from '@/lib/analytics/provider';
import type { AnalyticsEventInput } from '@/lib/analytics/events';

const event: AnalyticsEventInput = {
  name: 'trajectory_status_shown',
  payload: { status: 'on_track', source: 'test' },
};

describe('dispatchAnalyticsEvent', () => {
  const originalPosthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const originalPosthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  test('sendet an Vercel und überspringt PostHog ohne Env', async () => {
    const results = await dispatchAnalyticsEvent(event, { userId: 'user-123' });

    expect(mocks.serverTrackMock).toHaveBeenCalledWith('trajectory_status_shown', {
      status: 'on_track',
      source: 'test',
      user_id: 'user-123',
    });
    expect(results).toEqual([
      { provider: 'vercel', status: 'sent' },
      { provider: 'posthog', status: 'skipped' },
    ]);
  });

  test('sendet an PostHog wenn Env gesetzt ist', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'ph-key';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://app.posthog.com/';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    const results = await dispatchAnalyticsEvent(event);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.posthog.com/capture/',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(results).toEqual([
      { provider: 'vercel', status: 'sent' },
      { provider: 'posthog', status: 'sent' },
    ]);

    fetchMock.mockRestore();
  });

  test('markiert PostHog-HTTP-Fehler sauber als failed', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'ph-key';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://eu.posthog.com';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: false, status: 503 } as Response);

    const results = await dispatchAnalyticsEvent(event);

    expect(results).toEqual([
      { provider: 'vercel', status: 'sent' },
      { provider: 'posthog', status: 'failed', error: 'http_503' },
    ]);

    fetchMock.mockRestore();
  });

  test('gibt Vercel-Fehler zurück statt zu crashen', async () => {
    mocks.serverTrackMock.mockRejectedValueOnce(new Error('vercel down'));

    const results = await dispatchAnalyticsEvent(event);

    expect(results[0]).toEqual({
      provider: 'vercel',
      status: 'failed',
      error: 'vercel down',
    });
    expect(results[1]).toEqual({ provider: 'posthog', status: 'skipped' });
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalPosthogKey;
    process.env.NEXT_PUBLIC_POSTHOG_HOST = originalPosthogHost;
  });
});
