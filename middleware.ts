import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/today')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith('/calendar')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith('/goals')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith('/university')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  if (!user && request.nextUrl.pathname.startsWith('/career')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && request.nextUrl.pathname.startsWith('/auth/login')) {
    return NextResponse.redirect(new URL('/today', request.url));
  }
  if (user && request.nextUrl.pathname.startsWith('/auth/signup')) {
    return NextResponse.redirect(new URL('/today', request.url));
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
    '/auth/:path*',
  ],
};
