import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/applications', () => ({
  fetchApplications: vi.fn(),
  createApplication: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
  captureServerError: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { fetchApplications, createApplication } from '@/lib/supabase/applications';
import { GET, POST } from '@/app/api/applications/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedFetchApplications = vi.mocked(fetchApplications);
const mockedCreateApplication = vi.mocked(createApplication);

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

describe('GET /api/applications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/applications'));
    expect(response.status).toBe(401);
  });

  it('returns applications when authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    const apps = [
      { id: 'a1', company: 'ACME', position: 'Engineer', status: 'applied' },
    ];
    mockedFetchApplications.mockResolvedValue({ applications: apps } as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/applications'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(apps);
    expect(mockedFetchApplications).toHaveBeenCalledWith({
      userId: 'user-123',
      page: 1,
      limit: 20,
      status: undefined,
    });
  });

  it('passes pagination and status filter params', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchApplications.mockResolvedValue({ applications: [] } as any);

    await GET(new NextRequest('http://localhost:3000/api/applications?page=3&limit=5&status=interview'));

    expect(mockedFetchApplications).toHaveBeenCalledWith({
      userId: 'user-123',
      page: 3,
      limit: 5,
      status: 'interview',
    });
  });

  it('clamps limit to max 100', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchApplications.mockResolvedValue({ applications: [] } as any);

    await GET(new NextRequest('http://localhost:3000/api/applications?limit=500'));

    expect(mockedFetchApplications).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 })
    );
  });

  it('clamps page to min 1', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchApplications.mockResolvedValue({ applications: [] } as any);

    await GET(new NextRequest('http://localhost:3000/api/applications?page=-5'));

    expect(mockedFetchApplications).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it('returns 500 on server error', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedFetchApplications.mockRejectedValue(new Error('DB error'));

    const response = await GET(new NextRequest('http://localhost:3000/api/applications'));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error?.message).toBe('Failed to fetch applications');
  });
});

describe('POST /api/applications', () => {
  beforeEach(() => vi.clearAllMocks());

  const validBody = {
    company: 'Bloomberg',
    position: 'Software Engineer',
    status: 'applied',
    applicationDate: '2026-02-15',
  };

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(response.status).toBe(401);
  });

  it('creates application with valid data', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    const created = { id: 'a1', ...validBody };
    mockedCreateApplication.mockResolvedValue(created as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.company).toBe('Bloomberg');
    expect(mockedCreateApplication).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ company: 'Bloomberg', position: 'Software Engineer' })
    );
  });

  it('returns 400 for invalid data (missing company)', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: JSON.stringify({ position: 'Dev', status: 'applied', applicationDate: '2026-01-01' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error?.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid status value', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await POST(
      new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: JSON.stringify({ ...validBody, status: 'invalid_status' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(400);
  });
});
