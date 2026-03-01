import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

import { requireApiAuth } from '@/lib/api/auth';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { POST } from '@/app/api/cv/extract/route';

const mockedRequireApiAuth = vi.mocked(requireApiAuth);
const mockedPdfParse = vi.mocked(pdfParse);
const mockedMammoth = vi.mocked(mammoth.extractRawText);

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

function makeFile(name: string, type: string): File {
  const file = new File(['binary-content'], name, { type });
  if (!file.arrayBuffer) {
    (file as any).arrayBuffer = async () => new TextEncoder().encode('binary-content').buffer;
  }
  return file;
}

function createMockRequest(file?: File | null): Request {
  const entries = new Map<string, File | null>();
  if (file) entries.set('file', file);

  const mockFormData = {
    get: (key: string) => entries.get(key) ?? null,
  };

  return {
    formData: () => Promise.resolve(mockFormData as unknown as FormData),
  } as unknown as Request;
}

describe('POST /api/cv/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedRequireApiAuth.mockResolvedValue(authFail() as any);

    const response = await POST(createMockRequest(makeFile('resume.pdf', 'application/pdf')));
    expect(response.status).toBe(401);
  });

  it('returns 400 when no file is provided', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await POST(createMockRequest());
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Missing file');
  });

  it('extracts text from a PDF file by mime type', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedPdfParse.mockResolvedValue({ text: 'John Doe\nSoftware Engineer' } as any);

    const response = await POST(createMockRequest(makeFile('resume.pdf', 'application/pdf')));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.text).toBe('John Doe\nSoftware Engineer');
    expect(mockedPdfParse).toHaveBeenCalled();
  });

  it('detects PDF by file extension when mime is generic', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedPdfParse.mockResolvedValue({ text: 'CV content' } as any);

    const response = await POST(createMockRequest(makeFile('resume.PDF', 'application/octet-stream')));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.text).toBe('CV content');
  });

  it('extracts text from a DOCX file by mime type', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedMammoth.mockResolvedValue({ value: 'Jane Smith\nProject Manager' } as any);

    const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const response = await POST(createMockRequest(makeFile('resume.docx', docxMime)));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.text).toBe('Jane Smith\nProject Manager');
    expect(mockedMammoth).toHaveBeenCalled();
  });

  it('detects DOCX by file extension when mime is generic', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedMammoth.mockResolvedValue({ value: 'DOCX content' } as any);

    const response = await POST(createMockRequest(makeFile('cv.DOCX', 'application/octet-stream')));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.text).toBe('DOCX content');
  });

  it('returns 400 for unsupported file types', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);

    const response = await POST(createMockRequest(makeFile('readme.txt', 'text/plain')));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Unsupported file type. Upload PDF or DOCX.');
  });

  it('returns 500 when PDF parsing throws', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedPdfParse.mockRejectedValue(new Error('Corrupted PDF'));

    const response = await POST(createMockRequest(makeFile('broken.pdf', 'application/pdf')));

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Corrupted PDF');
  });

  it('returns 500 when DOCX parsing throws', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedMammoth.mockRejectedValue(new Error('Invalid DOCX'));

    const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const response = await POST(createMockRequest(makeFile('broken.docx', docxMime)));

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Invalid DOCX');
  });

  it('returns generic message for non-Error throws', async () => {
    mockedRequireApiAuth.mockResolvedValue(authOk() as any);
    mockedPdfParse.mockRejectedValue('string error');

    const response = await POST(createMockRequest(makeFile('file.pdf', 'application/pdf')));

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Failed to extract text');
  });
});
