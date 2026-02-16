import { getCurrentUser } from '@/lib/auth/server';
import { apiErrorResponse } from '@/lib/api/server-errors';
import { isAdminUser } from '@/lib/auth/authorization';

export async function requireApiAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null as null, errorResponse: apiErrorResponse(401, 'UNAUTHORIZED', 'Unauthorized') };
  }
  return { user, errorResponse: null as null };
}

export async function requireApiAdmin() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return { user: null as null, errorResponse };

  if (!isAdminUser(user)) {
    return {
      user: null as null,
      errorResponse: apiErrorResponse(403, 'FORBIDDEN', 'Admin access required'),
    };
  }

  return { user, errorResponse: null as null };
}
