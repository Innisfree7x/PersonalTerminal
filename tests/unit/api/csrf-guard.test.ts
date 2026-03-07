import { describe, expect, it } from 'vitest';
import { NextResponse } from 'next/server';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { enforceTrustedMutationOrigin, isTrustedOriginForTests } from '@/lib/api/csrf';

function makeRequest(method: string, origin?: string): Request {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  return new Request('http://localhost:3000/api/test', { method, headers });
}

describe('csrf guard + response policy', () => {
  it('allows trusted localhost origin for mutations', () => {
    const result = enforceTrustedMutationOrigin(makeRequest('POST', 'http://localhost:3000') as any);
    expect(result).toBeNull();
  });

  it('blocks unknown cross-origin mutation requests', async () => {
    const result = enforceTrustedMutationOrigin(makeRequest('PATCH', 'https://evil.example') as any);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
    const payload = await result?.json();
    expect(payload?.error?.code).toBe('FORBIDDEN');
  });

  it('allows non-browser mutation requests without origin', () => {
    const result = enforceTrustedMutationOrigin(makeRequest('DELETE') as any);
    expect(result).toBeNull();
  });

  it('applies private swr cache headers', () => {
    const response = applyPrivateSWRPolicy(NextResponse.json({ ok: true }), {
      maxAgeSeconds: 22,
      staleWhileRevalidateSeconds: 90,
    });
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=22, stale-while-revalidate=90');
    expect(response.headers.get('Vary')).toBe('Cookie');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('recognizes invalid origins as untrusted', () => {
    expect(isTrustedOriginForTests('notaurl')).toBe(false);
  });

  it('accepts GOOGLE_REDIRECT_URI origin as trusted mutation origin', () => {
    const previous = process.env.GOOGLE_REDIRECT_URI;
    process.env.GOOGLE_REDIRECT_URI = 'https://personal-terminal-green.vercel.app/api/auth/google/callback';
    try {
      const result = enforceTrustedMutationOrigin(
        makeRequest('POST', 'https://personal-terminal-green.vercel.app') as any
      );
      expect(result).toBeNull();
      expect(isTrustedOriginForTests('https://personal-terminal-green.vercel.app')).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.GOOGLE_REDIRECT_URI;
      else process.env.GOOGLE_REDIRECT_URI = previous;
    }
  });

  it('keeps localhost fallback trusted even with invalid env origins', () => {
    const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
    const previousRedirect = process.env.GOOGLE_REDIRECT_URI;
    const previousVercel = process.env.VERCEL_URL;
    process.env.NEXT_PUBLIC_SITE_URL = 'not-a-url';
    process.env.GOOGLE_REDIRECT_URI = 'also-not-a-url';
    process.env.VERCEL_URL = '';
    try {
      expect(isTrustedOriginForTests('http://localhost:3000')).toBe(true);
      expect(isTrustedOriginForTests('http://127.0.0.1:3000')).toBe(true);
    } finally {
      if (previousSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = previousSite;
      if (previousRedirect === undefined) delete process.env.GOOGLE_REDIRECT_URI;
      else process.env.GOOGLE_REDIRECT_URI = previousRedirect;
      if (previousVercel === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = previousVercel;
    }
  });
});
