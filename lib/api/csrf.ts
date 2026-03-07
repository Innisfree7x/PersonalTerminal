import type { NextRequest } from 'next/server';
import { apiErrorResponse } from '@/lib/api/server-errors';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function normalizeOrigin(origin: string): string | null {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function getTrustedOrigins(): Set<string> {
  const trusted = new Set<string>();
  const googleRedirectOrigin = process.env.GOOGLE_REDIRECT_URI
    ? normalizeOrigin(process.env.GOOGLE_REDIRECT_URI)
    : null;
  const envCandidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    googleRedirectOrigin,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ];

  for (const value of envCandidates) {
    if (!value) continue;
    const normalized = normalizeOrigin(value);
    if (normalized) trusted.add(normalized);
  }

  trusted.add('http://localhost:3000');
  trusted.add('http://127.0.0.1:3000');
  return trusted;
}

export function enforceTrustedMutationOrigin(request: NextRequest) {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) return null;

  const originHeader = request.headers.get('origin');
  if (!originHeader) return null;

  const origin = normalizeOrigin(originHeader);
  if (!origin) {
    return apiErrorResponse(403, 'FORBIDDEN', 'Invalid origin header');
  }

  const trustedOrigins = getTrustedOrigins();
  if (trustedOrigins.has(origin)) return null;

  return apiErrorResponse(403, 'FORBIDDEN', 'Cross-origin mutation blocked');
}

export function isTrustedOriginForTests(origin: string): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return getTrustedOrigins().has(normalized);
}
