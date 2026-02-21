import { NextRequest } from 'next/server';
import { apiErrorResponse } from '@/lib/api/server-errors';
import { serverEnv } from '@/lib/env';

export function requireCronAuth(request: NextRequest) {
  const configuredSecret = serverEnv.CRON_SECRET;

  // In local/dev we allow manual testing without a secret.
  if (!configuredSecret && serverEnv.NODE_ENV !== 'production') {
    return null;
  }

  if (!configuredSecret) {
    return apiErrorResponse(500, 'CRON_SECRET_MISSING', 'CRON_SECRET is not configured');
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${configuredSecret}`) {
    return apiErrorResponse(401, 'CRON_UNAUTHORIZED', 'Invalid cron authorization');
  }

  return null;
}
