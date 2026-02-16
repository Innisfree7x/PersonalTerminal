import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/auth/server';
import { GET, POST } from '@/app/api/daily-tasks/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedCreateClient = vi.mocked(createClient);

function buildAuthSuccess() {
  return { user: { id: 'user-123' } as any, errorResponse: null };
}

function buildAuthFailure() {
  return {
    user: null,
    errorResponse: NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    ),
  };
}

function mockSupabaseForGet(result: { data: any; error: any }) {
  const chain = {
    eq: vi.fn(),
    order: vi.fn(),
  } as any;

  chain.eq.mockReturnValue(chain);
  chain.order.mockImplementation((_column: string) => {
    if (chain.order.mock.calls.length === 1) return chain;
    return Promise.resolve(result);
  });

  const client = {
    from: vi.fn(() => ({
      select: vi.fn(() => chain),
    })),
  };

  return { client, chain };
}

function mockSupabaseForPost(result: { data: any; error: any }) {
  const insert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(result),
    })),
  }));

  const client = {
    from: vi.fn(() => ({
      insert,
    })),
  };

  return { client, insert };
}

describe('GET /api/daily-tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(buildAuthFailure() as any);

    const request = new NextRequest('http://localhost:3000/api/daily-tasks');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns tasks when authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(buildAuthSuccess() as any);
    const { client, chain } = mockSupabaseForGet({
      data: [
        {
          id: '1',
          title: 'Task 1',
          completed: false,
          date: '2025-01-01',
          source: null,
          source_id: null,
          time_estimate: null,
          created_at: '2025-01-01T08:00:00.000Z',
        },
      ],
      error: null,
    });
    mockedCreateClient.mockReturnValue(client as any);

    const request = new NextRequest('http://localhost:3000/api/daily-tasks?date=2025-01-01');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].createdAt).toBe('2025-01-01T08:00:00.000Z');
    expect(body[0].sourceId).toBeNull();
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('returns 500 on database error', async () => {
    mockedRequireApiAuth.mockResolvedValue(buildAuthSuccess() as any);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client } = mockSupabaseForGet({
      data: null,
      error: { message: 'DB Error' },
    });
    mockedCreateClient.mockReturnValue(client as any);

    const request = new NextRequest('http://localhost:3000/api/daily-tasks');
    const response = await GET(request);

    expect(response.status).toBe(500);
    consoleSpy.mockRestore();
  });
});

describe('POST /api/daily-tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(buildAuthFailure() as any);

    const request = new NextRequest('http://localhost:3000/api/daily-tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', date: '2025-01-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('creates task with valid data', async () => {
    mockedRequireApiAuth.mockResolvedValue(buildAuthSuccess() as any);
    const { client, insert } = mockSupabaseForPost({
      data: {
        id: '1',
        title: 'New Task',
        completed: false,
        date: '2025-01-01',
        source: 'manual',
        source_id: null,
        time_estimate: null,
        created_at: '2025-01-01T08:00:00.000Z',
      },
      error: null,
    });
    mockedCreateClient.mockReturnValue(client as any);

    const request = new NextRequest('http://localhost:3000/api/daily-tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Task', date: '2025-01-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.title).toBe('New Task');
    expect(body.createdAt).toBe('2025-01-01T08:00:00.000Z');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
      })
    );
  });

  it('returns 400 for invalid input', async () => {
    mockedRequireApiAuth.mockResolvedValue(buildAuthSuccess() as any);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = new NextRequest('http://localhost:3000/api/daily-tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '', date: '2025-01-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error?.message).toBe('Validation error');

    consoleSpy.mockRestore();
  });
});
