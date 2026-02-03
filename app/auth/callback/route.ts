import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';

/**
 * Auth callback route for email confirmation and OAuth redirects
 * Handles the redirect after Supabase email verification
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(new URL('/today', request.url));
}
