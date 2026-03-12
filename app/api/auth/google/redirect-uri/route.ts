import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { createApiTraceContext, withApiTraceHeaders } from '@/lib/api/observability';
import { applyPrivateSWRPolicy } from '@/lib/api/responsePolicy';
import { serverEnv } from '@/lib/env';
import { resolveGoogleOAuthRedirectUri } from '@/lib/google/oauth';

/**
 * GET /api/auth/google/redirect-uri
 * Returns the exact redirect URI currently resolved by the app.
 * Used by the Calendar connect UI to prevent redirect_uri_mismatch misconfigurations.
 */
export async function GET(request: NextRequest) {
  const trace = createApiTraceContext(request, '/api/auth/google/redirect-uri');
  const { errorResponse } = await requireApiAuth();
  if (errorResponse) return withApiTraceHeaders(errorResponse, trace, { metricName: 'oauth_redirect' });

  const configuredRedirectUri = serverEnv.GOOGLE_REDIRECT_URI;
  const redirectResolution = resolveGoogleOAuthRedirectUri({
    requestUrl: request.url,
    configuredRedirectUri,
    siteUrl: serverEnv.NEXT_PUBLIC_SITE_URL,
    preferRequestOrigin: true,
  });
  const requestOrigin = new URL(request.url).origin;
  let configuredOrigin: string | null = null;
  if (configuredRedirectUri) {
    try {
      configuredOrigin = new URL(configuredRedirectUri).origin;
    } catch {
      configuredOrigin = null;
    }
  }
  const configuredMatchesRequestOrigin =
    configuredOrigin === null ? null : configuredOrigin === requestOrigin;

  const response = applyPrivateSWRPolicy(
    NextResponse.json({
      redirectUri: redirectResolution.redirectUri,
      source: redirectResolution.source,
      normalized: redirectResolution.normalized,
      requestOrigin,
      configuredRedirectUri: configuredRedirectUri || null,
      configuredOrigin,
      configuredMatchesRequestOrigin,
    }),
    {
      maxAgeSeconds: 60,
      staleWhileRevalidateSeconds: 300,
    }
  );
  return withApiTraceHeaders(response, trace, { metricName: 'oauth_redirect' });
}
