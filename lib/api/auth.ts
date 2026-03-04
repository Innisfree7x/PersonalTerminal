import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth/server';
import { apiErrorResponse } from '@/lib/api/server-errors';
import { isAdminUser } from '@/lib/auth/authorization';

type AuthSuccess = { user: User; errorResponse: null };
type AuthFailure = { user: null; errorResponse: NextResponse };
export type AuthResult = AuthSuccess | AuthFailure;

export async function requireApiAuth(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, errorResponse: apiErrorResponse(401, 'UNAUTHORIZED', 'Unauthorized') };
  }
  return { user, errorResponse: null };
}

export async function requireApiAdmin(): Promise<AuthResult> {
  const result = await requireApiAuth();
  if (result.errorResponse) return result;

  if (!isAdminUser(result.user)) {
    return {
      user: null,
      errorResponse: apiErrorResponse(403, 'FORBIDDEN', 'Admin access required'),
    };
  }

  return result;
}
