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

function isCallbackPath(pathname: string): boolean {
  return /\/+api\/auth\/google\/callback\/?$/i.test(pathname);
}

export function resolveGoogleOAuthRedirectUri(options: {
  requestUrl: string;
  cookieRedirectUri?: string | null | undefined;
  configuredRedirectUri?: string | null | undefined;
  siteUrl?: string | null | undefined;
  preferCookie?: boolean;
  preferRequestOrigin?: boolean;
}): GoogleRedirectResolution {
  const candidateValues: Record<GoogleRedirectSource, string | null | undefined> = {
    configured: options.configuredRedirectUri,
    site_url: options.siteUrl,
    cookie: options.cookieRedirectUri,
    request_origin: options.requestUrl,
    fallback: null,
  };

  const candidateOrder: GoogleRedirectSource[] = ['configured', 'site_url', 'cookie', 'request_origin'];
  if (options.preferCookie) {
    const withoutCookie = candidateOrder.filter((source) => source !== 'cookie');
    candidateOrder.splice(0, candidateOrder.length, 'cookie', ...withoutCookie);
  }
  if (options.preferRequestOrigin) {
    const withoutRequestOrigin = candidateOrder.filter((source) => source !== 'request_origin');
    candidateOrder.splice(0, candidateOrder.length, 'request_origin', ...withoutRequestOrigin);
  }

  const candidates = candidateOrder.map((source) => ({
    source,
    value: candidateValues[source],
  }));

  for (const candidate of candidates) {
    if (candidate.source === 'configured') {
      const configured = parseHttpUrl(candidate.value);
      // If the configured URI already points at callback (even with double slashes),
      // keep it exact to prevent Google redirect_uri mismatch with strict string compare.
      if (configured && isCallbackPath(configured.pathname)) {
        return {
          redirectUri: configured.toString(),
          source: candidate.source,
          normalized: false,
        };
      }
    }

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
