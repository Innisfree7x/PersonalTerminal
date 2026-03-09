import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/trajectory/morningSnapshot', () => ({
  buildTrajectoryMorningSnapshot: vi.fn(),
}));

vi.mock('@/lib/ops/flowMetrics', () => ({
  recordFlowMetric: vi.fn().mockResolvedValue(undefined),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { buildTrajectoryMorningSnapshot } from '@/lib/trajectory/morningSnapshot';
import { GET } from '@/app/api/trajectory/morning/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedBuildTrajectoryMorningSnapshot = vi.mocked(buildTrajectoryMorningSnapshot);

function authSuccess() {
  return { user: { id: 'user-123' } as any, errorResponse: null };
}

function authFailure() {
  return {
    user: null,
    errorResponse: NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    ),
  };
}

describe('trajectory morning api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFailure() as any);
    const response = await GET(new NextRequest('http://localhost:3000/api/trajectory/morning'));
    expect(response.status).toBe(401);
  });

  it('returns combined overview + momentum snapshot', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedBuildTrajectoryMorningSnapshot.mockResolvedValue({
      payload: {
        generatedAt: '2026-03-09T00:00:00.000Z',
        overview: {
          goals: [
            {
              id: 'goal-1',
              title: 'GMAT',
              dueDate: '2027-03-01',
              status: 'active',
            },
          ],
          computed: {
            generatedBlocks: [{ goalId: 'goal-1', startDate: '2026-11-01', status: 'on_track' }],
          },
        },
        momentum: {
          score: 58,
          delta: 2,
          trend: 'up',
          breakdown: {
            statusPoints: 40,
            capacityPoints: 15,
            bufferPoints: 3,
            trendPoints: 1,
          },
          stats: {
            onTrack: 1,
            tight: 0,
            atRisk: 0,
            activeGoals: 1,
            plannedHoursPerWeek: 10,
            last7DaysHours: 8,
            previous7DaysHours: 6,
            capacityRatio: 0.8,
          },
        },
      },
      meta: {
        queryDurationMs: 10,
        goalCount: 1,
        generatedBlocks: 1,
      },
    } as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/trajectory/morning'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('private');
    expect(response.headers.get('X-Request-Id')).toBeTruthy();

    const body = await response.json();
    expect(body.overview.goals).toHaveLength(1);
    expect(body.overview.computed.generatedBlocks).toHaveLength(1);
    expect(body.momentum.score).toBe(58);
    expect(mockedBuildTrajectoryMorningSnapshot).toHaveBeenCalledWith('user-123');
  });
});
