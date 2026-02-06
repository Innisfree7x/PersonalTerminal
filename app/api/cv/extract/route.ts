import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';

export const runtime = 'nodejs';

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
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return new NextResponse('Missing file', { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mime = file.type;
    let text = '';

    if (mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      text = await extractPdf(buffer);
    } else if (
      mime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      text = await extractDocx(buffer);
    } else {
      return new NextResponse('Unsupported file type. Upload PDF or DOCX.', {
        status: 400,
      });
    }

    return NextResponse.json({ text });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to extract text';
    return new NextResponse(message, { status: 500 });
  }
}

