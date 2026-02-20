import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/analytics/provider', () => ({
  dispatchAnalyticsEvent: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/server';
import { dispatchAnalyticsEvent } from '@/lib/analytics/provider';
import { POST } from '@/app/api/analytics/event/route';

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedDispatchAnalyticsEvent = vi.mocked(dispatchAnalyticsEvent);

describe('POST /api/analytics/event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-123' } as never);
    mockedDispatchAnalyticsEvent.mockResolvedValue([
      { provider: 'vercel', status: 'sent' },
      { provider: 'posthog', status: 'skipped' },
    ]);
  });

  it('returns 400 for malformed JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      body: '{bad-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockedDispatchAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('returns 400 for unsupported event name', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify({
        name: 'not_allowed',
        payload: {},
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockedDispatchAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid payload shape', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify({
        name: 'onboarding_step_completed',
        payload: { step: 'two' },
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockedDispatchAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('accepts valid event and dispatches to providers', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify({
        name: 'signup_started',
        payload: { source: 'auth_signup_form' },
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body.accepted).toBe(true);
    expect(mockedDispatchAnalyticsEvent).toHaveBeenCalledWith(
      {
        name: 'signup_started',
        payload: { source: 'auth_signup_form' },
      },
      { userId: 'user-123' }
    );
  });
});

