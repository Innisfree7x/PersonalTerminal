import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/kit-sync/service', () => ({
  getKitSyncStatus: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { getKitSyncStatus } from '@/lib/kit-sync/service';
import { GET } from '@/app/api/kit/status/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedGetKitSyncStatus = vi.mocked(getKitSyncStatus);

describe('GET /api/kit/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/kit/status'));
    expect(response.status).toBe(401);
  });

  it('returns the kit sync status payload', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);
    mockedGetKitSyncStatus.mockResolvedValueOnce({
      campusWebcalConfigured: true,
      campusWebcalMaskedUrl: 'campus.studium.kit.edu/…',
      campusWebcalCalendarName: 'KIT',
      campusWebcalLastValidatedAt: '2026-03-29T10:00:00.000Z',
      campusWebcalLastSyncedAt: null,
      campusWebcalLastError: null,
      connectorVersion: 'kit-connector/0.1.0',
      totalCampusEvents: 12,
      totalCampusModules: 5,
      totalCampusGrades: 2,
      nextCampusEvent: null,
      nextCampusExam: null,
      latestCampusGrade: {
        moduleTitle: 'Operations Research',
        gradeLabel: '1,7',
        publishedAt: '2026-03-29T11:00:00.000Z',
      },
      lastRun: null,
    });

    const response = await GET(new NextRequest('http://localhost:3000/api/kit/status'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totalCampusEvents).toBe(12);
    expect(body.totalCampusModules).toBe(5);
    expect(body.latestCampusGrade.gradeLabel).toBe('1,7');
    expect(mockedGetKitSyncStatus).toHaveBeenCalledWith('user-1');
  });
});
