import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import {
  getOrCreateTrajectorySettings,
  listTrajectoryGoals,
  listTrajectoryBlocks,
} from '@/lib/supabase/trajectory';
import { fetchFocusAnalytics } from '@/lib/supabase/focusSessions';
import { computeTrajectoryPlan } from '@/lib/trajectory/planner';
import { computeMomentumScore } from '@/lib/trajectory/momentum';
import { buildTrajectoryMorningSnapshot } from '@/lib/trajectory/morningSnapshot';

const mockedGetOrCreateTrajectorySettings = vi.mocked(getOrCreateTrajectorySettings);
const mockedListTrajectoryGoals = vi.mocked(listTrajectoryGoals);
const mockedListTrajectoryBlocks = vi.mocked(listTrajectoryBlocks);
const mockedFetchFocusAnalytics = vi.mocked(fetchFocusAnalytics);
const mockedComputeTrajectoryPlan = vi.mocked(computeTrajectoryPlan);
const mockedComputeMomentumScore = vi.mocked(computeMomentumScore);

describe('buildTrajectoryMorningSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds overview + momentum payload and exposes meta diagnostics', async () => {
    mockedGetOrCreateTrajectorySettings.mockResolvedValue({
      id: 'settings-1',
      hoursPerWeek: 12,
      horizonMonths: 24,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as any);
    mockedListTrajectoryGoals.mockResolvedValue([
      {
        id: 'goal-1',
        title: 'GMAT',
        dueDate: '2027-03-01',
        effortHours: 520,
        bufferWeeks: 2,
        status: 'active',
      },
    ] as any);
    mockedListTrajectoryBlocks.mockResolvedValue([
      {
        id: 'block-1',
        goalId: 'goal-1',
        startDate: '2026-11-01',
        endDate: '2027-02-15',
        weeklyHours: 12,
        status: 'planned',
      },
    ] as any);
    mockedFetchFocusAnalytics.mockResolvedValue([
      {
        started_at: '2026-03-01T08:00:00.000Z',
        duration_seconds: 1800,
        completed: true,
        session_type: 'focus',
      },
    ] as any);
    mockedComputeTrajectoryPlan.mockReturnValue({
      generatedBlocks: [{ goalId: 'goal-1', startDate: '2026-11-01', status: 'on_track' }],
    } as any);
    mockedComputeMomentumScore.mockReturnValue({
      score: 61,
      delta: 3,
      trend: 'up',
      breakdown: {
        statusPoints: 40,
        capacityPoints: 15,
        bufferPoints: 4,
        trendPoints: 2,
      },
      stats: {
        onTrack: 1,
        tight: 0,
        atRisk: 0,
        activeGoals: 1,
        plannedHoursPerWeek: 12,
        last7DaysHours: 7,
        previous7DaysHours: 4,
        capacityRatio: 0.58,
      },
    } as any);

    const snapshot = await buildTrajectoryMorningSnapshot('user-1');

    expect(snapshot.payload.overview.goals).toHaveLength(1);
    expect(snapshot.payload.overview.computed.generatedBlocks).toHaveLength(1);
    expect(snapshot.payload.momentum.score).toBe(61);
    expect(snapshot.meta.goalCount).toBe(1);
    expect(snapshot.meta.generatedBlocks).toBe(1);
    expect(snapshot.meta.queryDurationMs).toBeGreaterThanOrEqual(0);
    expect(mockedComputeTrajectoryPlan).toHaveBeenCalledTimes(1);
    expect(mockedComputeMomentumScore).toHaveBeenCalledTimes(1);
  });
});
