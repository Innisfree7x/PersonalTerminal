import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/google/calendar', () => ({
  fetchTodayEvents: vi.fn(),
  fetchWeekEvents: vi.fn(),
}));

vi.mock('@/lib/api/observability', () => ({
  createApiTraceContext: vi.fn(() => ({ traceId: 'test-trace' })),
  withApiTraceHeaders: vi.fn(
    (response: NextResponse) => response
  ),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { fetchTodayEvents, fetchWeekEvents } from '@/lib/google/calendar';
import { GET as GETToday } from '@/app/api/calendar/today/route';
import { GET as GETWeek } from '@/app/api/calendar/week/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedFetchTodayEvents = vi.mocked(fetchTodayEvents);
const mockedFetchWeekEvents = vi.mocked(fetchWeekEvents);

function authOk() {
  return { user: { id: 'user-123' } as any, errorResponse: null };
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

function requestWithCookies(
  url: string,
  cookies: Record<string, string> = {}
): NextRequest {
  const req = new NextRequest(url);
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

const googleCookies = {
  google_access_token: 'test-access-token',
  google_refresh_token: 'test-refresh-token',
  google_token_expires_at: String(Date.now() + 3600_000),
};

describe('GET /api/calendar/today', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await GETToday(requestWithCookies('http://localhost:3000/api/calendar/today'));
    expect(response.status).toBe(401);
  });

  it('returns 401 when Google access token is missing', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await GETToday(requestWithCookies('http://localhost:3000/api/calendar/today'));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toContain('connect Google Calendar');
  });

  it('returns events when authenticated with Google token', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    const events = [{ id: 'e1', summary: 'Meeting' }];
    mockedFetchTodayEvents.mockResolvedValue(events as any);

    const response = await GETToday(
      requestWithCookies('http://localhost:3000/api/calendar/today', googleCookies)
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(events);
    expect(mockedFetchTodayEvents).toHaveBeenCalledWith(
      'test-access-token',
      'test-refresh-token',
      expect.any(String)
    );
  });

  it('returns 401 when token is expired (UNAUTHORIZED error)', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchTodayEvents.mockRejectedValue(new Error('UNAUTHORIZED'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GETToday(
      requestWithCookies('http://localhost:3000/api/calendar/today', googleCookies)
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toContain('reconnect');
    consoleSpy.mockRestore();
  });

  it('returns 500 on unexpected error', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchTodayEvents.mockRejectedValue(new Error('Network timeout'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GETToday(
      requestWithCookies('http://localhost:3000/api/calendar/today', googleCookies)
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.message).toBe('Network timeout');
    consoleSpy.mockRestore();
  });
});

describe('GET /api/calendar/week', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await GETWeek(requestWithCookies('http://localhost:3000/api/calendar/week'));
    expect(response.status).toBe(401);
  });

  it('returns 401 when Google access token is missing', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await GETWeek(requestWithCookies('http://localhost:3000/api/calendar/week'));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toContain('connect Google Calendar');
  });

  it('returns week events when authenticated with Google token', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    const events = [{ id: 'e1', summary: 'Weekly standup' }];
    mockedFetchWeekEvents.mockResolvedValue(events as any);

    const response = await GETWeek(
      requestWithCookies('http://localhost:3000/api/calendar/week?weekStart=2026-03-02', googleCookies)
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(events);
    expect(mockedFetchWeekEvents).toHaveBeenCalledWith(
      expect.any(Date),
      'test-access-token',
      'test-refresh-token',
      expect.any(String)
    );
  });

  it('defaults to current week when weekStart is not provided', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchWeekEvents.mockResolvedValue([] as any);

    await GETWeek(
      requestWithCookies('http://localhost:3000/api/calendar/week', googleCookies)
    );

    expect(mockedFetchWeekEvents).toHaveBeenCalledWith(
      expect.any(Date),
      'test-access-token',
      'test-refresh-token',
      expect.any(String)
    );
  });

  it('returns 401 when token is expired', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchWeekEvents.mockRejectedValue(new Error('UNAUTHORIZED'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GETWeek(
      requestWithCookies('http://localhost:3000/api/calendar/week', googleCookies)
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toContain('reconnect');
    consoleSpy.mockRestore();
  });

  it('returns 500 on unexpected error', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchWeekEvents.mockRejectedValue(new Error('API limit'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GETWeek(
      requestWithCookies('http://localhost:3000/api/calendar/week', googleCookies)
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.message).toBe('API limit');
    consoleSpy.mockRestore();
  });
});
