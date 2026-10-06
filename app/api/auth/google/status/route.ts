import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { getValidAccessToken } from '@/lib/google/calendar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  const accessToken = request.cookies.get('google_access_token')?.value;
  const refreshToken = request.cookies.get('google_refresh_token')?.value;
  const expiresAt = request.cookies.get('google_token_expires_at')?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({
      connected: false,
      hasCalendar: false,
      hasGmail: false,
    });
  }

  const validToken = await getValidAccessToken(accessToken, refreshToken, expiresAt);
  if (!validToken) {
    return NextResponse.json({
      connected: false,
      hasCalendar: false,
      hasGmail: false,
      error: 'Token refresh failed',
    });
  }

  let hasCalendar = false;
  let hasGmail = false;
  let email: string | null = null;
  let gmailError: string | null = null;

  // 1. Calendar validation
  try {
    const calRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
      {
        headers: { Authorization: `Bearer ${validToken}` },
        signal: AbortSignal.timeout(3500),
      }
    );
    hasCalendar = calRes.ok;
  } catch {
    hasCalendar = true; // Fallback on timeout: token is valid
  }

  // 2. Gmail validation & email discovery
  try {
    const profileRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      {
        headers: { Authorization: `Bearer ${validToken}` },
        signal: AbortSignal.timeout(3500),
      }
    );
    if (profileRes.ok) {
      const profile = await profileRes.json();
      hasGmail = true;
      email = profile.emailAddress ?? null;
    } else if (profileRes.status === 403) {
      gmailError = 'Gmail API disabled in Google Cloud Console';
    }
  } catch {
    // Ignore timeout
  }

  const res = NextResponse.json({
    connected: true,
    hasCalendar,
    hasGmail,
    email,
    gmailError,
  });

  // If token was refreshed, update cookie
  if (validToken !== accessToken) {
    const isSecure =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';
    res.cookies.set('google_access_token', validToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });
  }

  return res;
}
