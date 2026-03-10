import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/api/csrf', () => ({
  enforceTrustedMutationOrigin: vi.fn(() => null),
}));

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/strategy', () => ({
  getStrategyDecisionById: vi.fn(),
  getStrategyOptionById: vi.fn(),
  listStrategyOptionsByDecision: vi.fn(),
  updateStrategyDecisionScore: vi.fn(),
  markStrategyDecisionCommitted: vi.fn(),
  createStrategyDecisionCommit: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/auth/server';
import {
  createStrategyDecisionCommit,
  getStrategyDecisionById,
  getStrategyOptionById,
  listStrategyOptionsByDecision,
  markStrategyDecisionCommitted,
  updateStrategyDecisionScore,
} from '@/lib/supabase/strategy';
import { POST } from '@/app/api/strategy/decisions/[id]/commit/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedCreateClient = vi.mocked(createClient);
const mockedGetStrategyDecisionById = vi.mocked(getStrategyDecisionById);
const mockedGetStrategyOptionById = vi.mocked(getStrategyOptionById);
const mockedListStrategyOptionsByDecision = vi.mocked(listStrategyOptionsByDecision);
const mockedUpdateStrategyDecisionScore = vi.mocked(updateStrategyDecisionScore);
const mockedMarkStrategyDecisionCommitted = vi.mocked(markStrategyDecisionCommitted);
const mockedCreateStrategyDecisionCommit = vi.mocked(createStrategyDecisionCommit);

function authSuccess() {
  return { user: { id: 'user-123' } as any, errorResponse: null };
}

function authFailure() {
  return {
    user: null,
    errorResponse: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }),
  };
}

describe('strategy commit api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFailure() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/strategy/decisions/1/commit', {
        method: 'POST',
        body: JSON.stringify({ optionId: '00000000-0000-0000-0000-000000000001' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { id: 'decision-1' } }
    );

    expect(response.status).toBe(401);
  });

  it('creates commit and daily task', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);

    mockedGetStrategyDecisionById.mockResolvedValue({ id: 'decision-1', title: 'Decision A' } as any);
    mockedGetStrategyOptionById.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      decisionId: 'decision-1',
      title: 'Option A',
    } as any);
    mockedListStrategyOptionsByDecision.mockResolvedValue([
      {
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Option A',
        impactPotential: 8,
        confidenceLevel: 7,
        strategicFit: 8,
        effortCost: 4,
        downsideRisk: 3,
        timeToValueWeeks: 5,
      },
    ] as any);

    mockedUpdateStrategyDecisionScore.mockResolvedValue({ id: 'decision-1' } as any);
    mockedMarkStrategyDecisionCommitted.mockResolvedValue({ id: 'decision-1', status: 'committed' } as any);
    mockedCreateStrategyDecisionCommit.mockResolvedValue({ id: 'commit-1' } as any);

    const insertSingle = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          id: 'task-1',
          date: '2026-03-10',
          title: 'Strategy: Option A',
          completed: false,
          source: 'strategy',
          source_id: 'strategy:decision-1:00000000-0000-0000-0000-000000000001:2026-03-10',
          time_estimate: '45m',
          created_at: '2026-03-10T00:00:00.000Z',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: 'task-2',
          date: '2026-03-11',
          title: 'Follow-up: nächster Schritt für Decision A',
          completed: false,
          source: 'strategy_follow_up',
          source_id: 'strategy-followup:decision-1:00000000-0000-0000-0000-000000000001:2026-03-11',
          time_estimate: '20m',
          created_at: '2026-03-10T00:00:01.000Z',
        },
        error: null,
      });

    const dailyTaskQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: null, error: null }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: insertSingle,
        }),
      }),
    };

    mockedCreateClient.mockReturnValue({
      from: vi.fn().mockReturnValue(dailyTaskQuery),
    } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/strategy/decisions/1/commit', {
        method: 'POST',
        body: JSON.stringify({
          optionId: '00000000-0000-0000-0000-000000000001',
          taskDate: '2026-03-10',
          timeEstimate: '45m',
          followUpEnabled: true,
          followUpDate: '2026-03-11',
          followUpTitle: 'Follow-up: nächster Schritt für Decision A',
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: { id: 'decision-1' } }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.skippedExistingTask).toBe(false);
    expect(payload.task.title).toContain('Strategy');
    expect(payload.followUpTask.title).toContain('Follow-up');
    expect(mockedCreateStrategyDecisionCommit).toHaveBeenCalled();
  });
});
