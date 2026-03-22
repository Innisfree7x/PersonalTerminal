import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from '@/lib/auth/admin';
import { fetchPersistentErrorSnapshot, persistMonitoringEvent } from '@/lib/monitoring/persistence';

const mockedCreateAdminClient = vi.mocked(createAdminClient);

function makeResolvedQuery<T>(result: T) {
  const query = Promise.resolve(result) as Promise<T> & Record<string, any>;
  const methods = ['select', 'gte', 'order', 'limit'];
  for (const method of methods) {
    query[method] = vi.fn(() => query);
  }
  return query;
}

describe('monitoring persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists normalized monitoring events with request path and user context', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockedCreateAdminClient.mockReturnValue({
      from: vi.fn(() => ({ insert })),
    } as any);

    await expect(
      persistMonitoringEvent(
        {
          message: 'Career radar timeout',
          severity: 'error',
          errorName: 'TimeoutError',
          stack: 'stack',
          context: { userId: 'user-42', route: '/career' },
          source: 'api',
        },
        { fingerprint: 'fp-timeout' }
      )
    ).resolves.toBeUndefined();

    expect(insert).toHaveBeenCalledWith({
      fingerprint: 'fp-timeout',
      severity: 'error',
      source: 'api',
      message: 'Career radar timeout',
      error_name: 'TimeoutError',
      stack: 'stack',
      context: { userId: 'user-42', route: '/career' },
      user_id: 'user-42',
      request_path: '/career',
    });
  });

  it('aggregates the last 24h snapshot by severity and top messages', async () => {
    mockedCreateAdminClient.mockReturnValue({
      from: vi.fn(() =>
        makeResolvedQuery({
          data: [
            { message: 'Career radar timeout', severity: 'error', created_at: '2026-03-18T10:00:00.000Z' },
            { message: 'Career radar timeout', severity: 'error', created_at: '2026-03-18T09:00:00.000Z' },
            { message: 'Slack webhook failed', severity: 'warning', created_at: '2026-03-18T08:00:00.000Z' },
            { message: 'Trajectory drift', severity: 'critical', created_at: '2026-03-18T07:00:00.000Z' },
          ],
          error: null,
        })
      ),
    } as any);

    const snapshot = await fetchPersistentErrorSnapshot();

    expect(snapshot.available).toBe(true);
    expect(snapshot.totalLast24h).toBe(4);
    expect(snapshot.bySeverityLast24h).toEqual({
      info: 0,
      warning: 1,
      error: 2,
      critical: 1,
    });
    expect(snapshot.topMessagesLast24h[0]).toEqual({
      message: 'Career radar timeout',
      count: 2,
      severity: 'error',
    });
  });

  it('returns an unavailable snapshot when the store errors', async () => {
    mockedCreateAdminClient.mockReturnValue({
      from: vi.fn(() =>
        makeResolvedQuery({
          data: null,
          error: new Error('ops_error_events missing'),
        })
      ),
    } as any);

    const snapshot = await fetchPersistentErrorSnapshot();

    expect(snapshot).toEqual({
      available: false,
      totalLast24h: 0,
      bySeverityLast24h: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      },
      topMessagesLast24h: [],
      reasonIfUnavailable: 'ops_error_events missing',
    });
  });
});
