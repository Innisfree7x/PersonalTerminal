import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { applyRateLimitHeaders, consumeRateLimit, readForwardedIpFromRequest } from '@/lib/api/rateLimit';

export const runtime = 'nodejs';
const MAX_BYTES = 4 * 1024 * 1024;

function fileExt(name: string): string {
  const segments = name.toLowerCase().split('.');
  return segments.length > 1 ? (segments[segments.length - 1] ?? '') : '';
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const mod = await import('pdf-parse');
  const pdfParse: any = (mod as any).default ?? mod;
  const result = await pdfParse(buffer);
  return String(result?.text ?? '');
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mod = await import('mammoth');
  const mammoth: any = (mod as any).default ?? mod;
  const result = await mammoth.extractRawText({ buffer });
  return String(result?.value ?? '');
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const rateLimit = consumeRateLimit({
      key: `cv_extract:${user.id}:${readForwardedIpFromRequest(request)}`,
      limit: 15,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Zu viele CV-Extract-Requests in kurzer Zeit. Bitte warte kurz.',
            },
          },
          { status: 429 }
        ),
        rateLimit
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return new NextResponse('Missing file', { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return new NextResponse('File too large. Max 4MB.', { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mime = file.type;
    const ext = fileExt(file.name);
    let text = '';

    if (mime === 'application/pdf' || ext === 'pdf') {
      text = await extractPdf(buffer);
    } else if (
      mime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    ) {
      text = await extractDocx(buffer);
    } else {
      return new NextResponse('Unsupported file type. Upload PDF or DOCX.', {
        status: 400,
      });
    }

    return applyRateLimitHeaders(NextResponse.json({ text }), rateLimit);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to extract text';
    return new NextResponse(message, { status: 500 });
  }
}
