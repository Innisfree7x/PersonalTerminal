import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function makeResolvedQuery<T>(result: T) {
  const query = Promise.resolve(result) as Promise<T> & Record<string, any>;
  const methods = ['select', 'order', 'limit'];
  for (const method of methods) {
    query[method] = vi.fn(() => query);
  }
  query.insert = vi.fn(() => query);
  return query;
}

async function loadAuditModule(createClientImpl: ReturnType<typeof vi.fn>) {
  vi.resetModules();
  vi.doMock('@/lib/auth/server', () => ({
    createClient: createClientImpl,
  }));
  return import('@/lib/monitoring/audit');
}

describe('monitoring audit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-21T09:00:00.000Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.doUnmock('@/lib/auth/server');
  });

  it('returns migrationApplied=false when the audit table is unavailable', async () => {
    const createClientMock = vi.fn(() => ({
      from: vi.fn(() =>
        makeResolvedQuery({
          data: null,
          error: { message: 'relation admin_audit_logs does not exist' },
        })
      ),
    }));

    const audit = await loadAuditModule(createClientMock);

    await expect(
      audit.createAdminAuditLog({
        actorUserId: 'user-1',
        action: 'test',
        resource: 'career',
      })
    ).resolves.toBeUndefined();

    await expect(audit.fetchRecentAdminAuditLogs()).resolves.toEqual({
      migrationApplied: false,
      logs: [],
    });
  });

  it('caches table availability briefly and maps recent logs', async () => {
    const availabilityQuery = makeResolvedQuery({ data: [{ id: '1' }], error: null });
    const recentLogsQuery = makeResolvedQuery({
      data: [
        {
          id: 'log-1',
          actor_user_id: 'user-1',
          action: 'resolve_incident',
          resource: 'monitoring',
          metadata: { fingerprint: 'fp-1' },
          created_at: '2026-03-21T08:00:00.000Z',
        },
      ],
      error: null,
    });

    const from = vi
      .fn()
      .mockReturnValueOnce(availabilityQuery)
      .mockReturnValueOnce(recentLogsQuery)
      .mockReturnValueOnce(availabilityQuery);

    const createClientMock = vi.fn(() => ({ from }));
    const audit = await loadAuditModule(createClientMock);

    expect(await audit.isAdminAuditLogTableAvailable()).toBe(true);
    expect(await audit.fetchRecentAdminAuditLogs(10)).toEqual({
      migrationApplied: true,
      logs: [
        {
          id: 'log-1',
          actorUserId: 'user-1',
          action: 'resolve_incident',
          resource: 'monitoring',
          metadata: { fingerprint: 'fp-1' },
          createdAt: '2026-03-21T08:00:00.000Z',
        },
      ],
    });

    expect(from).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(31_000);

    expect(await audit.isAdminAuditLogTableAvailable()).toBe(true);
    expect(from).toHaveBeenCalledTimes(3);
  });
});
