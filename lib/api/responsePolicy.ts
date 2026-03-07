import { NextResponse } from 'next/server';

interface PrivateSWRPolicy {
  maxAgeSeconds?: number;
  staleWhileRevalidateSeconds?: number;
}

/**
 * Apply a conservative cache policy for authenticated JSON APIs.
 * Keeps short-lived browser reuse while preventing shared proxy caching.
 */
export function applyPrivateSWRPolicy(
  response: NextResponse,
  policy?: PrivateSWRPolicy
): NextResponse {
  const maxAge = Math.max(0, Math.floor(policy?.maxAgeSeconds ?? 15));
  const swr = Math.max(0, Math.floor(policy?.staleWhileRevalidateSeconds ?? 60));
  response.headers.set('Cache-Control', `private, max-age=${maxAge}, stale-while-revalidate=${swr}`);
  response.headers.set('Vary', 'Cookie');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
