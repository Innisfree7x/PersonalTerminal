import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/strategy', () => ({
  getStrategyDecisionById: vi.fn(),
  listStrategyOptionsByDecision: vi.fn(),
  updateStrategyDecisionScore: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import {
  getStrategyDecisionById,
  listStrategyOptionsByDecision,
  updateStrategyDecisionScore,
} from '@/lib/supabase/strategy';
import { POST } from '@/app/api/strategy/decisions/[id]/score/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedGetDecisionById = vi.mocked(getStrategyDecisionById);
const mockedListOptionsByDecision = vi.mocked(listStrategyOptionsByDecision);
const mockedUpdateStrategyDecisionScore = vi.mocked(updateStrategyDecisionScore);

function authSuccess() {
  return { user: { id: 'user-123' } as any, errorResponse: null };
}

function authFailure() {
  return {
    user: null,
    errorResponse: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }),
  };
}

describe('strategy score api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFailure() as any);

    const response = await POST(new NextRequest('http://localhost:3000/api/strategy/decisions/1/score', { method: 'POST' }), {
      params: { id: 'decision-1' },
    });

    expect(response.status).toBe(401);
  });

  it('returns 400 when no options exist', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedGetDecisionById.mockResolvedValue({ id: 'decision-1', title: 'A' } as any);
    mockedListOptionsByDecision.mockResolvedValue([]);

    const response = await POST(new NextRequest('http://localhost:3000/api/strategy/decisions/1/score', { method: 'POST' }), {
      params: { id: 'decision-1' },
    });

    expect(response.status).toBe(400);
  });

  it('scores options and persists winner', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedGetDecisionById.mockResolvedValue({ id: 'decision-1', title: 'A' } as any);
    mockedListOptionsByDecision.mockResolvedValue([
      {
        id: 'opt-1',
        title: 'Option 1',
        impactPotential: 9,
        confidenceLevel: 8,
        strategicFit: 8,
        effortCost: 4,
        downsideRisk: 3,
        timeToValueWeeks: 4,
      },
      {
        id: 'opt-2',
        title: 'Option 2',
        impactPotential: 5,
        confidenceLevel: 5,
        strategicFit: 5,
        effortCost: 7,
        downsideRisk: 6,
        timeToValueWeeks: 14,
      },
    ] as any);
    mockedUpdateStrategyDecisionScore.mockResolvedValue({ id: 'decision-1' } as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/strategy/decisions/1/score', {
        method: 'POST',
        body: JSON.stringify({ scoreMode: 'deadline' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      {
        params: { id: 'decision-1' },
      }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.winner.optionId).toBe('opt-1');
    expect(payload.scoreMode).toBe('deadline');
    expect(payload.scoredOptions).toHaveLength(2);
    expect(mockedUpdateStrategyDecisionScore).toHaveBeenCalledWith(
      'user-123',
      'decision-1',
      expect.any(Number),
      'opt-1'
    );
  });
});
