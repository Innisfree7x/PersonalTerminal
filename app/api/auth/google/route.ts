import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';
import { requireApiAuth } from '@/lib/api/auth';
import { resolveGoogleOAuthRedirectUri } from '@/lib/google/oauth';

const OAUTH_STATE_COOKIE = 'google_oauth_state';
const OAUTH_REDIRECT_URI_COOKIE = 'google_oauth_redirect_uri';

/**
 * GET /api/auth/google - Redirect to Google OAuth consent screen
 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  const {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_REDIRECT_URI: configuredRedirectUri,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  } = serverEnv;
  const redirectResolution = resolveGoogleOAuthRedirectUri({
    requestUrl: request.url,
    configuredRedirectUri,
    siteUrl,
    preferRequestOrigin: true,
  });
  const redirectUri = redirectResolution.redirectUri;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { message: 'Google OAuth credentials not configured' },
      { status: 500 }
    );
  }

  if (redirectResolution.normalized && redirectResolution.source === 'configured') {
    console.warn('[google-oauth] Normalized GOOGLE_REDIRECT_URI to canonical callback path.', {
      source: redirectResolution.source,
      redirectUri,
    });
  }

  const scope = 'https://www.googleapis.com/auth/calendar.readonly';
  const responseType = 'code';
  const accessType = 'offline'; // Required to get refresh_token
  const prompt = 'consent'; // Force consent screen to get refresh_token

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', responseType);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', accessType);
  authUrl.searchParams.set('prompt', prompt);
  const state = `${user.id}:${crypto.randomUUID()}`;
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
  response.cookies.set(OAUTH_REDIRECT_URI_COOKIE, redirectUri, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
  return response;
}
