import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  trackMock: vi.fn(),
}));

vi.mock('@vercel/analytics', () => ({
  track: mocks.trackMock,
}));

import { trackMarketingEvent } from '@/lib/analytics/marketing';

describe('trackMarketingEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('spiegelt primary CTA sowohl auf das kanonische als auch das granulare Event', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    await trackMarketingEvent('landing_cta_primary_clicked', { source: 'hero' });

    expect(mocks.trackMock).toHaveBeenNthCalledWith(1, 'landing_cta_clicked', { source: 'hero' });
    expect(mocks.trackMock).toHaveBeenNthCalledWith(2, 'landing_cta_primary_clicked', {
      source: 'hero',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/analytics/event',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'landing_cta_clicked', payload: { source: 'hero' } }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/analytics/event',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'landing_cta_primary_clicked',
          payload: { source: 'hero' },
        }),
      }),
    );

    fetchMock.mockRestore();
  });

  test('sendet normale Marketing-Events nur einmal', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    await trackMarketingEvent('signup_started', { plan: 'pro' });

    expect(mocks.trackMock).toHaveBeenCalledTimes(1);
    expect(mocks.trackMock).toHaveBeenCalledWith('signup_started', { plan: 'pro' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockRestore();
  });

  test('schluckt Fetch-Fehler ohne Throw', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));

    await expect(
      trackMarketingEvent('landing_cta_secondary_clicked', { source: 'footer' }),
    ).resolves.toBeUndefined();

    expect(mocks.trackMock).toHaveBeenCalledTimes(2);

    fetchMock.mockRestore();
  });
});
