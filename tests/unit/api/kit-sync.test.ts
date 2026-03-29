import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/api/csrf', () => ({
  enforceTrustedMutationOrigin: vi.fn(() => null),
}));

vi.mock('@/lib/api/rateLimit', () => ({
  consumeRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 0, retryAfterSeconds: 0 }),
  applyRateLimitHeaders: vi.fn((response) => response),
  readForwardedIpFromRequest: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/kit-sync/service', () => ({
  syncCampusWebcalForUser: vi.fn(),
  syncCampusConnectorSnapshotForUser: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { syncCampusConnectorSnapshotForUser, syncCampusWebcalForUser } from '@/lib/kit-sync/service';
import { POST } from '@/app/api/kit/sync/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedSyncCampusWebcalForUser = vi.mocked(syncCampusWebcalForUser);
const mockedSyncCampusConnectorSnapshotForUser = vi.mocked(syncCampusConnectorSnapshotForUser);

describe('POST /api/kit/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/sync', {
        method: 'POST',
        body: JSON.stringify({ source: 'campus_webcal' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(401);
  });

  it('starts a manual campus webcal sync', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);
    mockedSyncCampusWebcalForUser.mockResolvedValueOnce({
      source: 'campus_webcal',
      itemsRead: 4,
      itemsWritten: 4,
      calendarName: 'KIT',
      nextStatus: { campusWebcalConfigured: true },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/sync', {
        method: 'POST',
        body: JSON.stringify({ source: 'campus_webcal' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(200);
    expect(mockedSyncCampusWebcalForUser).toHaveBeenCalledWith('user-1', 'manual');
    const body = await response.json();
    expect(body.itemsWritten).toBe(4);
  });

  it('accepts a campus connector snapshot', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);
    mockedSyncCampusConnectorSnapshotForUser.mockResolvedValueOnce({
      source: 'campus_connector',
      itemsRead: 5,
      itemsWritten: 5,
      skippedGrades: 0,
      skippedExams: 0,
      nextStatus: { totalCampusModules: 2, totalCampusGrades: 1 },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/sync', {
        method: 'POST',
        body: JSON.stringify({
          source: 'campus_connector',
          connectorVersion: 'kit-connector/0.1.0',
          payload: {
            modules: [
              {
                externalId: 'module-1',
                title: 'Operations Research',
                status: 'active',
              },
            ],
            grades: [
              {
                externalGradeId: 'grade-1',
                moduleExternalId: 'module-1',
                gradeLabel: '1,7',
              },
            ],
            exams: [],
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(200);
    expect(mockedSyncCampusConnectorSnapshotForUser).toHaveBeenCalledWith('user-1', {
      connectorVersion: 'kit-connector/0.1.0',
      payload: {
        modules: [
          {
            externalId: 'module-1',
            title: 'Operations Research',
            status: 'active',
          },
        ],
        grades: [
          {
            externalGradeId: 'grade-1',
            moduleExternalId: 'module-1',
            gradeLabel: '1,7',
          },
        ],
        exams: [],
      },
    });
  });

  it('rejects oversized connector payloads', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);

    const hugeSummary = 'x'.repeat(520 * 1024);
    const response = await POST(
      new NextRequest('http://localhost:3000/api/kit/sync', {
        method: 'POST',
        body: JSON.stringify({
          source: 'campus_connector',
          connectorVersion: 'kit-connector/0.1.0',
          payload: {
            modules: [
              {
                externalId: 'module-1',
                title: hugeSummary,
                status: 'active',
              },
            ],
            grades: [],
            exams: [],
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(413);
    expect(mockedSyncCampusConnectorSnapshotForUser).not.toHaveBeenCalled();
  });
});
