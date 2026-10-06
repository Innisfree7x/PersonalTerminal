import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { handleRouteError } from '@/lib/api/server-errors';
import { fetchRecentGmailMessages } from '@/lib/google/gmail';

import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;
    const expiresAt = request.cookies.get('google_token_expires_at')?.value;

    const result = await fetchRecentGmailMessages(
      accessToken,
      refreshToken,
      expiresAt,
      8
    );

    return applyPrivateSWRPolicy(NextResponse.json(result), {
      maxAgeSeconds: 15,
      staleWhileRevalidateSeconds: 45,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch Gmail messages', 'Gmail fetch error');
  }
}
