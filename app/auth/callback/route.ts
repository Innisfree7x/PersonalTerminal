import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';
import { isOnboardingComplete } from '@/lib/auth/profile';

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

    const { data: { user } } = await supabase.auth.getUser();
    const target = isOnboardingComplete(user) ? '/today' : '/onboarding';
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.redirect(new URL('/auth/login', request.url));
}
