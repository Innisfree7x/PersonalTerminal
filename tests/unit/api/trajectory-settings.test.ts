import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/trajectory', () => ({
  getOrCreateTrajectorySettings: vi.fn(),
  updateTrajectorySettings: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { getOrCreateTrajectorySettings, updateTrajectorySettings } from '@/lib/supabase/trajectory';
import { GET, PATCH } from '@/app/api/trajectory/settings/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedGetOrCreateTrajectorySettings = vi.mocked(getOrCreateTrajectorySettings);
const mockedUpdateTrajectorySettings = vi.mocked(updateTrajectorySettings);

function authSuccess() {
  return { user: { id: 'user-123' } as any, errorResponse: null };
}

function authFailure() {
  return {
    user: null,
    errorResponse: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }),
  };
}

describe('trajectory settings api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFailure() as any);

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('GET returns settings and auto-initialized defaults', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedGetOrCreateTrajectorySettings.mockResolvedValue({
      id: 'settings-1',
      hoursPerWeek: 8,
      horizonMonths: 24,
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.hoursPerWeek).toBe(8);
    expect(mockedGetOrCreateTrajectorySettings).toHaveBeenCalledWith('user-123');
  });

  it('PATCH updates settings', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedUpdateTrajectorySettings.mockResolvedValue({
      id: 'settings-1',
      hoursPerWeek: 12,
      horizonMonths: 24,
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:10:00.000Z',
    });

    const request = new NextRequest('http://localhost:3000/api/trajectory/settings', {
      method: 'PATCH',
      body: JSON.stringify({ hoursPerWeek: 12 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    expect(mockedUpdateTrajectorySettings).toHaveBeenCalledWith('user-123', { hoursPerWeek: 12 });
  });
});
