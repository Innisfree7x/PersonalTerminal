import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';

/**
 * POST /api/auth/google/disconnect - Clear Google OAuth tokens
 */
export async function POST(_request: NextRequest) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  const response = NextResponse.json({ success: true });

  // Clear all Google OAuth cookies
  response.cookies.delete('google_access_token');
  response.cookies.delete('google_refresh_token');
  response.cookies.delete('google_token_expires_at');

  return response;
}
