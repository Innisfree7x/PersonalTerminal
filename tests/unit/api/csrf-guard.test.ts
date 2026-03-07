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
});
