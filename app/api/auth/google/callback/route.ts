import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';

const OAUTH_STATE_COOKIE = 'google_oauth_state';
const OAUTH_REDIRECT_URI_COOKIE = 'google_oauth_redirect_uri';

/**
 * GET /api/auth/google/callback - Handle Google OAuth callback
 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) {
    return NextResponse.redirect(new URL('/auth/login?error=auth_required', request.url));
  }

  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/today?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/today?error=missing_code', request.url)
    );
  }

  if (
    !state ||
    !expectedState ||
    state !== expectedState ||
    !state.startsWith(`${user.id}:`)
  ) {
    return NextResponse.redirect(
      new URL('/today?error=invalid_oauth_state', request.url)
    );
  }

  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = await import('@/lib/env').then(m => m.serverEnv);
  const redirectUri =
    request.cookies.get(OAUTH_REDIRECT_URI_COOKIE)?.value ||
    new URL('/api/auth/google/callback', request.url).toString();

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL('/today?error=oauth_not_configured', request.url)
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/today?error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/today?error=no_access_token', request.url)
      );
    }

    // Calculate expiration time (expires_in is in seconds)
    const expiresAt = new Date(Date.now() + (expires_in * 1000));

    // Store tokens in httpOnly cookies
    const response = NextResponse.redirect(new URL('/today?success=connected', request.url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_REDIRECT_URI_COOKIE);
    
    // Set access token cookie (httpOnly, secure in production)
    response.cookies.set('google_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in, // seconds
      path: '/',
    });

    // Set refresh token cookie (if provided)
    if (refresh_token) {
      response.cookies.set('google_refresh_token', refresh_token, {
        httpOnly: true,
        secure: (await import('@/lib/env').then(m => m.isProduction)),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
    }

    // Set expiration timestamp cookie
    response.cookies.set('google_token_expires_at', expiresAt.toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    const response = NextResponse.redirect(
      new URL('/today?error=oauth_callback_error', request.url)
    );
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_REDIRECT_URI_COOKIE);
    return response;
  }
}
