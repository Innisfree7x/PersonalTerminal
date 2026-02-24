import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isOnboardingComplete } from '@/lib/auth/profile';
import { isAdminUser } from '@/lib/auth/authorization';

const PROTECTED_PREFIXES = [
  '/today',
  '/calendar',
  '/goals',
  '/university',
  '/career',
  '/analytics',
  '/focus',
  '/settings',
];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const inProtectedArea = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
  const onboardingDone = isOnboardingComplete(user);

  if (!user && (inProtectedArea || path.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && path.startsWith('/auth/')) {
    return NextResponse.redirect(new URL(onboardingDone ? '/today' : '/onboarding', request.url));
  }

  // Force onboarding before dashboard usage
  if (user && !onboardingDone && inProtectedArea) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Keep completed users away from onboarding
  if (user && onboardingDone && path.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/today', request.url));
  }

  // Restrict ops monitoring page to admins only.
  if (user && path.startsWith('/analytics/ops') && !isAdminUser(user)) {
    return NextResponse.redirect(new URL('/analytics', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/today/:path*',
    '/calendar/:path*',
    '/goals/:path*',
    '/university/:path*',
    '/career/:path*',
    '/analytics/:path*',
    '/focus/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/auth/:path*',
    '/api/:path*',
  ],
};
