import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { enforceTrustedMutationOrigin } from '@/lib/api/csrf';
import { createClient } from '@/lib/auth/server';
import { handleRouteError } from '@/lib/api/server-errors';

export const runtime = 'nodejs';

const STORAGE_BUCKET = 'cv-uploads';
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXT = new Set(['pdf', 'docx']);
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
]);

function fileExt(name: string): string {
  const segments = name.toLowerCase().split('.');
  return segments.length > 1 ? (segments[segments.length - 1] ?? '') : '';
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedMutationOrigin(request);
  if (originViolation) return originViolation;

  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return new NextResponse('Missing file', { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return new NextResponse('File too large. Max 4MB.', { status: 413 });
    }

    const ext = fileExt(file.name);
    const validExt = ALLOWED_EXT.has(ext);
    const validMime = !file.type || ALLOWED_MIME.has(file.type);
    if (!validExt && !validMime) {
      return new NextResponse('Unsupported file type. Upload PDF or DOCX.', { status: 400 });
    }

    const safeName = sanitizeName(file.name);
    const path = `${user.id}/cv/${Date.now()}_${safeName}`;

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });

    if (error) {
      return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({
      bucket: STORAGE_BUCKET,
      path,
    });
  } catch (error) {
    return handleRouteError(error, 'CV konnte nicht in Storage gespeichert werden.', 'Error uploading CV');
  }
}
