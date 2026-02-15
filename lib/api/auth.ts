import { getCurrentUser } from '@/lib/auth/server';
import { apiErrorResponse } from '@/lib/api/server-errors';

export async function requireApiAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null as null, errorResponse: apiErrorResponse(401, 'UNAUTHORIZED', 'Unauthorized') };
  }
  return { user, errorResponse: null as null };
}
