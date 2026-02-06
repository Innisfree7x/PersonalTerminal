import { getCurrentUser } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

export async function requireApiAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null as null, errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, errorResponse: null as null };
}
