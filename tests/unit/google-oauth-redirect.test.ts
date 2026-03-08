import { describe, expect, it } from 'vitest';
import { resolveGoogleOAuthRedirectUri } from '@/lib/google/oauth';

describe('google oauth redirect resolution', () => {
  it('prefers configured redirect uri and normalizes callback path', () => {
    const result = resolveGoogleOAuthRedirectUri({
      requestUrl: 'https://innis.ai/api/auth/google',
      configuredRedirectUri: 'https://innis.ai/auth/callback?foo=bar',
      siteUrl: 'https://site.innis.ai',
    });

    expect(result.redirectUri).toBe('https://innis.ai/api/auth/google/callback');
    expect(result.source).toBe('configured');
    expect(result.normalized).toBe(true);
  });

  it('falls back to site url when configured redirect uri is invalid', () => {
    const result = resolveGoogleOAuthRedirectUri({
      requestUrl: 'https://innis.ai/api/auth/google',
      configuredRedirectUri: 'supabase.com/dashboard/project/abc',
      siteUrl: 'https://prod.innis.ai',
    });

    expect(result.redirectUri).toBe('https://prod.innis.ai/api/auth/google/callback');
    expect(result.source).toBe('site_url');
  });

  it('keeps configured callback uri exact when already pointed to callback path', () => {
    const result = resolveGoogleOAuthRedirectUri({
      requestUrl: 'https://innis.ai/api/auth/google',
      configuredRedirectUri: 'https://personal-terminal-green.vercel.app//api/auth/google/callback',
      siteUrl: 'https://prod.innis.ai',
    });

    expect(result.redirectUri).toBe(
      'https://personal-terminal-green.vercel.app//api/auth/google/callback'
    );
    expect(result.source).toBe('configured');
    expect(result.normalized).toBe(false);
  });

  it('ignores dashboard urls and falls back to request origin when needed', () => {
    const result = resolveGoogleOAuthRedirectUri({
      requestUrl: 'https://preview.innis.ai/api/auth/google',
      configuredRedirectUri: 'https://supabase.com/dashboard/project/pnrvfysuuntjjxxmazun',
    });

    expect(result.redirectUri).toBe('https://preview.innis.ai/api/auth/google/callback');
    expect(result.source).toBe('request_origin');
  });

  it('falls back to request origin when no configured values are available', () => {
    const result = resolveGoogleOAuthRedirectUri({
      requestUrl: 'https://preview.innis.ai/api/auth/google',
    });

    expect(result.redirectUri).toBe('https://preview.innis.ai/api/auth/google/callback');
    expect(result.source).toBe('request_origin');
  });

  it('uses cookie redirect uri when configured and site values are unavailable', () => {
    const result = resolveGoogleOAuthRedirectUri({
      requestUrl: 'https://preview.innis.ai/api/auth/google',
      cookieRedirectUri: 'https://cookie.innis.ai/anything-here',
    });

    expect(result.redirectUri).toBe('https://cookie.innis.ai/api/auth/google/callback');
    expect(result.source).toBe('cookie');
  });

  it('falls back to localhost when all candidates are invalid', () => {
    const result = resolveGoogleOAuthRedirectUri({
      requestUrl: 'not-a-url',
      configuredRedirectUri: 'https://supabase.com/dashboard/project/abc',
      siteUrl: 'javascript:alert(1)',
      cookieRedirectUri: 'ftp://invalid.example.com/path',
    });

    expect(result.redirectUri).toBe('http://localhost:3000/api/auth/google/callback');
    expect(result.source).toBe('fallback');
    expect(result.normalized).toBe(true);
  });
});
