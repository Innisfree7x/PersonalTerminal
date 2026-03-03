const GOOGLE_OAUTH_CALLBACK_PATH = '/api/auth/google/callback';
const DISALLOWED_OAUTH_HOSTS = new Set([
  'supabase.com',
  'www.supabase.com',
  'vercel.com',
  'www.vercel.com',
  'console.cloud.google.com',
]);

export type GoogleRedirectSource =
  | 'cookie'
  | 'configured'
  | 'site_url'
  | 'request_origin'
  | 'fallback';

export type GoogleRedirectResolution = {
  redirectUri: string;
  source: GoogleRedirectSource;
  normalized: boolean;
};

function parseHttpUrl(raw: string | undefined | null): URL | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (DISALLOWED_OAUTH_HOSTS.has(hostname)) {
      return null;
    }
    if (/\/dashboard\/project\//i.test(parsed.pathname)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function toCanonicalGoogleCallback(raw: string | undefined | null): {
  redirectUri: string;
  normalized: boolean;
} | null {
  const parsed = parseHttpUrl(raw);
  if (!parsed) return null;

  const canonical = new URL(GOOGLE_OAUTH_CALLBACK_PATH, parsed.origin).toString();
  const normalized = canonical !== parsed.toString();
  return { redirectUri: canonical, normalized };
}

export function resolveGoogleOAuthRedirectUri(options: {
  requestUrl: string;
  cookieRedirectUri?: string | null | undefined;
  configuredRedirectUri?: string | null | undefined;
  siteUrl?: string | null | undefined;
}): GoogleRedirectResolution {
  const candidates: Array<{ value: string | null | undefined; source: GoogleRedirectSource }> = [
    { value: options.configuredRedirectUri, source: 'configured' },
    { value: options.siteUrl, source: 'site_url' },
    { value: options.cookieRedirectUri, source: 'cookie' },
    { value: options.requestUrl, source: 'request_origin' },
  ];

  for (const candidate of candidates) {
    const resolved = toCanonicalGoogleCallback(candidate.value);
    if (resolved) {
      return {
        redirectUri: resolved.redirectUri,
        source: candidate.source,
        normalized: resolved.normalized,
      };
    }
  }

  return {
    redirectUri: 'http://localhost:3000/api/auth/google/callback',
    source: 'fallback',
    normalized: true,
  };
}
