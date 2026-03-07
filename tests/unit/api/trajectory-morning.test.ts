import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/trajectory', () => ({
  getOrCreateTrajectorySettings: vi.fn(),
  listTrajectoryGoals: vi.fn(),
  listTrajectoryBlocks: vi.fn(),
}));

vi.mock('@/lib/supabase/focusSessions', () => ({
  fetchFocusAnalytics: vi.fn(),
}));

vi.mock('@/lib/trajectory/planner', () => ({
  computeTrajectoryPlan: vi.fn(),
}));

vi.mock('@/lib/trajectory/momentum', () => ({
  computeMomentumScore: vi.fn(),
}));

vi.mock('@/lib/ops/flowMetrics', () => ({
  recordFlowMetric: vi.fn().mockResolvedValue(undefined),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { getOrCreateTrajectorySettings, listTrajectoryGoals, listTrajectoryBlocks } from '@/lib/supabase/trajectory';
import { fetchFocusAnalytics } from '@/lib/supabase/focusSessions';
import { computeTrajectoryPlan } from '@/lib/trajectory/planner';
import { computeMomentumScore } from '@/lib/trajectory/momentum';
import { GET } from '@/app/api/trajectory/morning/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedGetOrCreateTrajectorySettings = vi.mocked(getOrCreateTrajectorySettings);
const mockedListTrajectoryGoals = vi.mocked(listTrajectoryGoals);
const mockedListTrajectoryBlocks = vi.mocked(listTrajectoryBlocks);
const mockedFetchFocusAnalytics = vi.mocked(fetchFocusAnalytics);
const mockedComputeTrajectoryPlan = vi.mocked(computeTrajectoryPlan);
const mockedComputeMomentumScore = vi.mocked(computeMomentumScore);

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
    mockedGetOrCreateTrajectorySettings.mockResolvedValue({
      id: 'settings-1',
      hoursPerWeek: 10,
      horizonMonths: 24,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });
    mockedListTrajectoryGoals.mockResolvedValue([
      {
        id: 'goal-1',
        title: 'GMAT',
        category: 'gmat',
        dueDate: '2027-03-01',
        effortHours: 520,
        bufferWeeks: 2,
        priority: 3,
        status: 'active',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ] as any);
    mockedListTrajectoryBlocks.mockResolvedValue([] as any);
    mockedFetchFocusAnalytics.mockResolvedValue([] as any);
    mockedComputeTrajectoryPlan.mockReturnValue({
      effectiveCapacityHoursPerWeek: 10,
      generatedBlocks: [{ goalId: 'goal-1', startDate: '2026-11-01', status: 'on_track' }],
      alerts: [],
      summary: { total: 1, onTrack: 1, tight: 0, atRisk: 0 },
    } as any);
    mockedComputeMomentumScore.mockReturnValue({
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
    });

    const response = await GET(new NextRequest('http://localhost:3000/api/trajectory/morning'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('private');
    expect(response.headers.get('X-Request-Id')).toBeTruthy();

    const body = await response.json();
    expect(body.overview.goals).toHaveLength(1);
    expect(body.overview.computed.generatedBlocks).toHaveLength(1);
    expect(body.momentum.score).toBe(58);
    expect(mockedComputeTrajectoryPlan).toHaveBeenCalledTimes(1);
    expect(mockedComputeMomentumScore).toHaveBeenCalledTimes(1);
  });
});
