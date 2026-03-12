import { describe, expect, it } from 'vitest';
import { parseOAuthCallbackParams } from '@/lib/hooks/useNotifications';

describe('parseOAuthCallbackParams', () => {
  it('returns redirect_uri_mismatch guidance with source context', () => {
    window.history.replaceState(
      {},
      '',
      '/today?error=redirect_uri_mismatch&oauth_source=configured'
    );

    const result = parseOAuthCallbackParams();
    expect(result.error).toContain('Redirect URI mismatch');
    expect(result.error).toContain('source: configured');
    expect(result.success).toBeNull();
  });

  it('returns success message for connected callback', () => {
    window.history.replaceState({}, '', '/today?success=connected');
    const result = parseOAuthCallbackParams();

    expect(result.error).toBeNull();
    expect(result.success).toBe('Google Calendar wurde erfolgreich verbunden.');
  });

  it('returns empty state when no callback query params are present', () => {
    window.history.replaceState({}, '', '/today');
    const result = parseOAuthCallbackParams();

    expect(result.error).toBeNull();
    expect(result.success).toBeNull();
  });
});

