import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/api/auth';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { errorResponse } = await requireApiAdmin();
  if (errorResponse) return errorResponse;

  return NextResponse.json({ ok: true });
}
