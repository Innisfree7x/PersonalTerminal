import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/api/csrf', () => ({
  enforceTrustedMutationOrigin: vi.fn(() => null),
}));

vi.mock('@/lib/auth/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/api/rateLimit', () => ({
  consumeRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 7, limit: 8, resetMs: 60000 }),
  applyRateLimitHeaders: vi.fn((response) => response),
  readForwardedIpFromRequest: vi.fn().mockReturnValue('127.0.0.1'),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/auth/admin';
import { POST } from '@/app/api/cv/upload/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedCreateAdminClient = vi.mocked(createAdminClient);

function makeFile(name: string, type: string, content: string | Uint8Array = 'file-content'): File {
  return new File([content], name, { type });
}

function mockRequest(file?: File | null): NextRequest {
  const formData = {
    get: (key: string) => (key === 'file' ? file ?? null : null),
  };
  return {
    formData: () => Promise.resolve(formData as unknown as FormData),
    headers: new Headers(),
    url: 'http://localhost:3000/api/cv/upload',
  } as unknown as NextRequest;
}

describe('POST /api/cv/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await POST(mockRequest(makeFile('cv.pdf', 'application/pdf')));
    expect(response.status).toBe(401);
  });

  it('returns 400 if file is missing', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);

    const response = await POST(mockRequest());
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Missing file');
  });

  it('returns 400 for unsupported file types', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);

    const response = await POST(mockRequest(makeFile('cv.txt', 'text/plain')));
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Unsupported file type. Upload PDF or DOCX.');
  });

  it('uploads file to user-scoped path', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-123' }, errorResponse: null } as any);
    const upload = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upload });
    mockedCreateAdminClient.mockReturnValue({
      storage: { from },
    } as any);

    const response = await POST(mockRequest(makeFile('my cv.pdf', 'application/pdf')));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.bucket).toBe('cv-uploads');
    expect(body.path).toMatch(/^user-123\/cv\/\d+_my_cv\.pdf$/);

    expect(from).toHaveBeenCalledWith('cv-uploads');
    expect(upload).toHaveBeenCalledOnce();
  });

  it('returns 400 when storage upload fails', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-123' }, errorResponse: null } as any);
    const upload = vi.fn().mockResolvedValue({ error: { message: 'policy violation' } });
    const from = vi.fn().mockReturnValue({ upload });
    mockedCreateAdminClient.mockReturnValue({
      storage: { from },
    } as any);

    const response = await POST(mockRequest(makeFile('cv.pdf', 'application/pdf')));
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('policy violation');
  });
});
