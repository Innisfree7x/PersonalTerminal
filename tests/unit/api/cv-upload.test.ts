import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/api/csrf', () => ({
  enforceTrustedMutationOrigin: vi.fn(() => null),
}));

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

import { requireApiAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/auth/server';
import { POST } from '@/app/api/cv/upload/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedCreateClient = vi.mocked(createClient);

function makeFile(name: string, type: string, content: string | Uint8Array = 'file-content'): File {
  return new File([content], name, { type });
}

function mockRequest(file?: File | null): Request {
  const formData = {
    get: (key: string) => (key === 'file' ? file ?? null : null),
  };
  return {
    formData: () => Promise.resolve(formData as unknown as FormData),
  } as unknown as Request;
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

    const response = await POST(mockRequest(makeFile('cv.pdf', 'application/pdf')) as any);
    expect(response.status).toBe(401);
  });

  it('returns 400 if file is missing', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);

    const response = await POST(mockRequest() as any);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Missing file');
  });

  it('returns 400 for unsupported file types', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-1' }, errorResponse: null } as any);

    const response = await POST(mockRequest(makeFile('cv.txt', 'text/plain')) as any);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Unsupported file type. Upload PDF or DOCX.');
  });

  it('uploads file to user-scoped path', async () => {
    mockedRequireApiAuth.mockResolvedValueOnce({ user: { id: 'user-123' }, errorResponse: null } as any);
    const upload = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upload });
    mockedCreateClient.mockReturnValue({
      storage: { from },
    } as any);

    const response = await POST(mockRequest(makeFile('my cv.pdf', 'application/pdf')) as any);
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
    mockedCreateClient.mockReturnValue({
      storage: { from },
    } as any);

    const response = await POST(mockRequest(makeFile('cv.pdf', 'application/pdf')) as any);
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('policy violation');
  });
});
