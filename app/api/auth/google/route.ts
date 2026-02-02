import { NextResponse } from 'next/server';

/**
 * GET /api/auth/google - Redirect to Google OAuth consent screen
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { message: 'Google OAuth not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI.' },
      { status: 500 }
    );
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

  return NextResponse.redirect(authUrl.toString());
}
