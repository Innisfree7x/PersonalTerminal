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

vi.mock('@/lib/trajectory/planner', () => ({
  computeTrajectoryPlan: vi.fn(),
}));

vi.mock('@/lib/trajectory/crisis', () => ({
  detectCrises: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { getOrCreateTrajectorySettings, listTrajectoryBlocks, listTrajectoryGoals } from '@/lib/supabase/trajectory';
import { computeTrajectoryPlan } from '@/lib/trajectory/planner';
import { detectCrises } from '@/lib/trajectory/crisis';
import { POST } from '@/app/api/trajectory/plan/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedGetOrCreateTrajectorySettings = vi.mocked(getOrCreateTrajectorySettings);
const mockedListTrajectoryGoals = vi.mocked(listTrajectoryGoals);
const mockedListTrajectoryBlocks = vi.mocked(listTrajectoryBlocks);
const mockedComputeTrajectoryPlan = vi.mocked(computeTrajectoryPlan);
const mockedDetectCrises = vi.mocked(detectCrises);

function authSuccess() {
  return { user: { id: 'user-123' } as any, errorResponse: null };
}

function authFailure() {
  return {
    user: null,
    errorResponse: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }),
  };
}

describe('trajectory plan api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFailure() as any);

    const request = new NextRequest('http://localhost:3000/api/trajectory/plan', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('uses simulation hours when provided', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedGetOrCreateTrajectorySettings.mockResolvedValue({
      id: 'settings-1',
      hoursPerWeek: 8,
      horizonMonths: 24,
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });
    mockedListTrajectoryGoals.mockResolvedValue([]);
    mockedListTrajectoryBlocks.mockResolvedValue([]);
    mockedComputeTrajectoryPlan.mockReturnValue({
      effectiveCapacityHoursPerWeek: 12,
      generatedBlocks: [],
      alerts: [],
      summary: { total: 0, onTrack: 0, tight: 0, atRisk: 0 },
    });
    mockedDetectCrises.mockReturnValue({ collisions: [], hasCrisis: false });

    const request = new NextRequest('http://localhost:3000/api/trajectory/plan', {
      method: 'POST',
      body: JSON.stringify({ simulationHoursPerWeek: 12 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockedComputeTrajectoryPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        capacityHoursPerWeek: 12,
      })
    );

    const body = await response.json();
    expect(body.simulation.used).toBe(true);
    expect(body.simulation.effectiveCapacityHoursPerWeek).toBe(12);
    expect(mockedDetectCrises).toHaveBeenCalled();
    expect(body.crisis).toEqual({ collisions: [], hasCrisis: false });
  });

  it('includes crisis collisions in response', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedGetOrCreateTrajectorySettings.mockResolvedValue({
      id: 's', hoursPerWeek: 8, horizonMonths: 24,
      createdAt: '2026-04-19T00:00:00Z', updatedAt: '2026-04-19T00:00:00Z',
    });
    mockedListTrajectoryGoals.mockResolvedValue([]);
    mockedListTrajectoryBlocks.mockResolvedValue([]);
    mockedComputeTrajectoryPlan.mockReturnValue({
      effectiveCapacityHoursPerWeek: 8,
      generatedBlocks: [], alerts: [], summary: { total: 0, onTrack: 0, tight: 0, atRisk: 0 },
    });
    mockedDetectCrises.mockReturnValue({
      collisions: [{
        code: 'FIXED_WINDOW_COLLISION',
        severity: 'critical',
        conflictingGoalIds: ['a','b'],
        window: { startDate: '2026-09-01', endDate: '2026-10-15' },
        message: 'overlap',
      }],
      hasCrisis: true,
    });

    const request = new NextRequest('http://localhost:3000/api/trajectory/plan', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();
    expect(body.crisis.hasCrisis).toBe(true);
    expect(body.crisis.collisions[0].code).toBe('FIXED_WINDOW_COLLISION');
  });
});
