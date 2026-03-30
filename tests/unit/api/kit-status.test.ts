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
      totalIliasFavorites: 3,
      totalIliasItems: 9,
      freshIliasItems: 2,
      nextCampusEvent: null,
      nextCampusExam: null,
      latestCampusGrade: {
        moduleTitle: 'Operations Research',
        gradeLabel: '1,7',
        publishedAt: '2026-03-29T11:00:00.000Z',
      },
      latestIliasItem: {
        favoriteTitle: 'Investments SS2025',
        title: 'Neue Klausurhinweise',
        itemType: 'announcement',
        publishedAt: '2026-03-29T11:15:00.000Z',
        itemUrl: 'https://ilias.studium.kit.edu/item-1',
      },
      freshIliasPreview: [
        {
          id: '15ab1907-7b8c-44b2-a08f-b2d4b05dd2e1',
          favoriteTitle: 'Investments SS2025',
          title: 'Neue Klausurhinweise',
          itemType: 'announcement',
          publishedAt: '2026-03-29T11:15:00.000Z',
          itemUrl: 'https://ilias.studium.kit.edu/item-1',
          firstSeenAt: '2026-03-29T11:20:00.000Z',
        },
      ],
      iliasFavoritePreview: [
        {
          id: '3c40531d-a633-4578-aeb0-61db392c17c2',
          title: 'Investments SS2025',
          semesterLabel: 'SS 2025',
          courseUrl: 'https://ilias.studium.kit.edu/course-1',
        },
      ],
      lastRun: null,
    });

    const response = await GET(new NextRequest('http://localhost:3000/api/kit/status'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totalCampusEvents).toBe(12);
    expect(body.totalCampusModules).toBe(5);
    expect(body.latestCampusGrade.gradeLabel).toBe('1,7');
    expect(body.totalIliasFavorites).toBe(3);
    expect(body.latestIliasItem.itemType).toBe('announcement');
    expect(body.freshIliasPreview).toHaveLength(1);
    expect(body.freshIliasPreview[0].favoriteTitle).toBe('Investments SS2025');
    expect(mockedGetKitSyncStatus).toHaveBeenCalledWith('user-1');
  });
});
