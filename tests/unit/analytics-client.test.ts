import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  trackMock: vi.fn(),
}));

vi.mock('@vercel/analytics', () => ({
  track: mocks.trackMock,
}));

import { trackAppEvent } from '@/lib/analytics/client';

describe('trackAppEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('leitet Analytics-Events an Vercel und das Backend weiter', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    await trackAppEvent('daily_task_created', { source: 'test' });

    expect(mocks.trackMock).toHaveBeenCalledWith('daily_task_created', { source: 'test' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/analytics/event',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }),
    );

    fetchMock.mockRestore();
  });

  test('schluckt Backend-Fetch-Fehler ohne Throw', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));

    await expect(trackAppEvent('daily_task_created', { source: 'test' })).resolves.toBeUndefined();
    expect(mocks.trackMock).toHaveBeenCalled();

    fetchMock.mockRestore();
  });
});
