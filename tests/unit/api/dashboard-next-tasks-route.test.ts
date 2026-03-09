import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/dashboard/queries', () => ({
  getDashboardNextTasks: vi.fn(),
}));

vi.mock('@/lib/trajectory/morningSnapshot', () => ({
  buildTrajectoryMorningSnapshot: vi.fn(),
}));

vi.mock('@/lib/ops/flowMetrics', () => ({
  recordFlowMetric: vi.fn().mockResolvedValue(undefined),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { getDashboardNextTasks } from '@/lib/dashboard/queries';
import { buildTrajectoryMorningSnapshot } from '@/lib/trajectory/morningSnapshot';
import { GET } from '@/app/api/dashboard/next-tasks/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedGetDashboardNextTasks = vi.mocked(getDashboardNextTasks);
const mockedBuildTrajectoryMorningSnapshot = vi.mocked(buildTrajectoryMorningSnapshot);

function authSuccess() {
  return { user: { id: 'user-1' } as any, errorResponse: null };
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

function makeBasePayload() {
  return {
    homeworks: [],
    goals: [],
    interviews: [],
    studyProgress: [],
    nextBestAction: null,
    nextBestAlternatives: [],
    riskSignals: [],
    executionScore: 0,
    meta: {
      generatedAt: new Date().toISOString(),
      queryDurationMs: 12,
    },
    stats: {
      tasksToday: 0,
      tasksCompleted: 0,
      exercisesThisWeek: 0,
      exercisesTotal: 0,
      nextExam: null,
      goalsActive: 0,
      goalsDueSoon: 0,
      interviewsUpcoming: 0,
    },
  };
}

describe('dashboard next-tasks route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated requests', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFailure() as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/dashboard/next-tasks'));
    expect(response.status).toBe(401);
  });

  it('returns base next-tasks payload without trajectory include', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedGetDashboardNextTasks.mockResolvedValue(makeBasePayload() as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/dashboard/next-tasks'));
    expect(response.status).toBe(200);
    expect(mockedBuildTrajectoryMorningSnapshot).not.toHaveBeenCalled();
    expect(response.headers.get('Server-Timing')).toContain('query_build;dur=12');
    expect(response.headers.get('Server-Timing')).not.toContain('traj_build');

    const body = await response.json();
    expect(body.trajectoryMorning).toBeUndefined();
    expect(body.meta.queryDurationMs).toBe(12);
  });

  it('includes trajectory snapshot when include=trajectory_morning is requested', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedGetDashboardNextTasks.mockResolvedValue(makeBasePayload() as any);
    mockedBuildTrajectoryMorningSnapshot.mockResolvedValue({
      payload: {
        generatedAt: '2026-03-09T00:00:00.000Z',
        overview: {
          goals: [],
          computed: {
            generatedBlocks: [],
          },
        },
        momentum: {
          score: 55,
          delta: 1,
          trend: 'flat',
          breakdown: {
            statusPoints: 30,
            capacityPoints: 20,
            bufferPoints: 5,
            trendPoints: 0,
          },
          stats: {
            onTrack: 1,
            tight: 0,
            atRisk: 0,
            activeGoals: 1,
            plannedHoursPerWeek: 10,
            last7DaysHours: 7,
            previous7DaysHours: 7,
            capacityRatio: 0.7,
          },
        },
      },
      meta: {
        queryDurationMs: 9,
        goalCount: 1,
        generatedBlocks: 1,
      },
    } as any);

    const response = await GET(
      new NextRequest('http://localhost:3000/api/dashboard/next-tasks?include=trajectory_morning')
    );
    expect(response.status).toBe(200);
    expect(mockedBuildTrajectoryMorningSnapshot).toHaveBeenCalledWith('user-1');
    expect(response.headers.get('Server-Timing')).toContain('query_build;dur=12');
    expect(response.headers.get('Server-Timing')).toContain('traj_build;dur=9');

    const body = await response.json();
    expect(body.trajectoryMorning.momentum.score).toBe(55);
    expect(body.trajectoryMorning.generatedAt).toBe('2026-03-09T00:00:00.000Z');
  });
});
