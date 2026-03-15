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

vi.mock('@/lib/api/server-errors', () => ({
  handleRouteError: vi.fn((error, userMessage) => NextResponse.json({ error: userMessage }, { status: 500 })),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/auth/server';
import { POST } from '@/app/api/career/opportunities/gap-task/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedCreateClient = vi.mocked(createClient);

function mockRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/career/opportunities/gap-task', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/career/opportunities/gap-task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await POST(mockRequest({
      opportunityTitle: 'M&A Internship',
      opportunityCompany: 'Alpha Capital',
      gap: 'Mehr Deal-Referenzen',
      track: 'M&A',
    }));

    expect(response.status).toBe(401);
  });

  it('creates a new gap task when none exists', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
      errorResponse: null,
    } as any);

    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqTitle = vi.fn().mockReturnValue({ maybeSingle });
    const eqDate = vi.fn().mockReturnValue({ eq: eqTitle });
    const eqUser = vi.fn().mockReturnValue({ eq: eqDate });
    const selectExisting = vi.fn().mockReturnValue({ eq: eqUser });

    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'task-1',
        title: '[Career Gap] M&A: Mehr Deal-Referenzen',
        date: '2026-03-15',
        completed: false,
        source: 'manual',
        source_id: null,
        time_estimate: '45m',
        created_at: '2026-03-15T10:00:00.000Z',
      },
      error: null,
    });
    const selectInserted = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select: selectInserted });

    mockedCreateClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: selectExisting,
        insert,
      }),
    } as any);

    const response = await POST(
      mockRequest({
        opportunityTitle: 'M&A Internship',
        opportunityCompany: 'Alpha Capital',
        gap: 'Mehr Deal-Referenzen',
        track: 'M&A',
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(true);
    expect(body.task.title).toContain('Mehr Deal-Referenzen');
  });

  it('returns existing task when duplicate exists for today', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: { id: 'user-1' },
      errorResponse: null,
    } as any);

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'task-existing',
        title: '[Career Gap] M&A: Mehr Deal-Referenzen',
        date: '2026-03-15',
        completed: false,
        source: 'manual',
        source_id: null,
        time_estimate: '45m',
        created_at: '2026-03-15T10:00:00.000Z',
      },
      error: null,
    });
    const eqTitle = vi.fn().mockReturnValue({ maybeSingle });
    const eqDate = vi.fn().mockReturnValue({ eq: eqTitle });
    const eqUser = vi.fn().mockReturnValue({ eq: eqDate });
    const selectExisting = vi.fn().mockReturnValue({ eq: eqUser });

    const insert = vi.fn();

    mockedCreateClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: selectExisting,
        insert,
      }),
    } as any);

    const response = await POST(
      mockRequest({
        opportunityTitle: 'M&A Internship',
        opportunityCompany: 'Alpha Capital',
        gap: 'Mehr Deal-Referenzen',
        track: 'M&A',
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });
});
