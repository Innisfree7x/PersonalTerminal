import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/focusSessions', () => ({
  fetchFocusSessions: vi.fn(),
  createFocusSession: vi.fn(),
  fetchTodayFocusSummary: vi.fn(),
  fetchFocusAnalytics: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
  captureServerError: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import {
  fetchFocusSessions,
  createFocusSession,
  fetchTodayFocusSummary,
  fetchFocusAnalytics,
} from '@/lib/supabase/focusSessions';
import { createClient } from '@/lib/auth/server';
import { GET, POST } from '@/app/api/focus-sessions/route';
import { GET as GETToday } from '@/app/api/focus-sessions/today/route';
import { GET as GETAnalytics } from '@/app/api/focus-sessions/analytics/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedFetchSessions = vi.mocked(fetchFocusSessions);
const mockedCreateSession = vi.mocked(createFocusSession);
const mockedFetchTodaySummary = vi.mocked(fetchTodayFocusSummary);
const mockedFetchAnalytics = vi.mocked(fetchFocusAnalytics);
const mockedCreateClient = vi.mocked(createClient);

const mockUser = { id: 'user-123' };

function authOk() {
  return { user: mockUser as any, errorResponse: null };
}

function authFail() {
  return {
    user: null,
    errorResponse: NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    ),
  };
}

describe('GET /api/focus-sessions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/focus-sessions'));
    expect(response.status).toBe(401);
  });

  it('returns sessions when authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    const sessions = [{ id: 's1', duration_seconds: 1500 }];
    mockedFetchSessions.mockResolvedValue(sessions as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/focus-sessions'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(sessions);
    expect(mockedFetchSessions).toHaveBeenCalledWith({ userId: 'user-123' });
  });

  it('passes query params to fetch function', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchSessions.mockResolvedValue([] as any);

    const url = 'http://localhost:3000/api/focus-sessions?from=2026-01-01&to=2026-01-31&category=study&limit=10';
    await GET(new NextRequest(url));

    expect(mockedFetchSessions).toHaveBeenCalledWith({
      userId: 'user-123',
      from: '2026-01-01',
      to: '2026-01-31',
      category: 'study',
      limit: 10,
    });
  });

  it('returns 500 on server error', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchSessions.mockRejectedValue(new Error('DB failed'));

    const response = await GET(new NextRequest('http://localhost:3000/api/focus-sessions'));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error?.message).toBe('Failed to fetch focus sessions');
  });
});

describe('POST /api/focus-sessions', () => {
  beforeEach(() => vi.clearAllMocks());

  const validBody = {
    sessionType: 'focus',
    durationSeconds: 1500,
    plannedDurationSeconds: 1500,
    startedAt: '2026-02-28T10:00:00Z',
    endedAt: '2026-02-28T10:25:00Z',
    completed: true,
  };

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(response.status).toBe(401);
  });

  it('creates session with valid data', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    const created = { id: 's1', ...validBody };
    mockedCreateSession.mockResolvedValue(created as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(201);
    expect(mockedCreateSession).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ durationSeconds: 1500, completed: true })
    );
  });

  it('returns 400 for invalid data (missing required fields)', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify({ sessionType: 'focus' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error?.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/focus-sessions/today', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);
    const response = await GETToday();
    expect(response.status).toBe(401);
  });

  it('returns today summary with streak', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchTodaySummary.mockResolvedValue({
      totalMinutes: 50,
      sessionsCount: 2,
    } as any);

    mockedCreateClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              })),
            })),
          })),
        })),
      })),
    } as any);

    const response = await GETToday();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totalMinutes).toBe(50);
    expect(body.currentStreak).toBe(0);
  });
});

describe('GET /api/focus-sessions/analytics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await GETAnalytics(
      new NextRequest('http://localhost:3000/api/focus-sessions/analytics?days=30')
    );
    expect(response.status).toBe(401);
  });

  it('returns analytics data', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchAnalytics.mockResolvedValue([
      {
        id: 's1',
        duration_seconds: 1500,
        started_at: '2026-02-28T10:00:00Z',
        completed: true,
        category: 'study',
        session_type: 'focus',
      },
    ] as any);

    const response = await GETAnalytics(
      new NextRequest('http://localhost:3000/api/focus-sessions/analytics?days=30')
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totalSessions).toBe(1);
    expect(body.totalMinutes).toBe(25);
    expect(body.completedSessions).toBe(1);
    expect(body.dailyData).toHaveLength(1);
    expect(body.hourlyDistribution).toHaveLength(24);
    expect(body.categoryBreakdown).toHaveLength(1);
    expect(body.weekdayDistribution).toHaveLength(7);
  });

  it('clamps days parameter between 7 and 365', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchAnalytics.mockResolvedValue([] as any);

    await GETAnalytics(
      new NextRequest('http://localhost:3000/api/focus-sessions/analytics?days=1')
    );
    expect(mockedFetchAnalytics).toHaveBeenCalledWith('user-123', 7);

    mockedFetchAnalytics.mockClear();
    await GETAnalytics(
      new NextRequest('http://localhost:3000/api/focus-sessions/analytics?days=999')
    );
    expect(mockedFetchAnalytics).toHaveBeenCalledWith('user-123', 365);
  });
});
