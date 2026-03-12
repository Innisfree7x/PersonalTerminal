/**
 * Custom hook for managing temporary notification messages
 * Handles error and success messages with auto-dismiss
 */

import { useState, useEffect } from 'react';

export interface NotificationState {
  error: string | null;
  success: string | null;
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
  clearAll: () => void;
}

/**
 * Hook for managing notification state with auto-dismiss
 * 
 * @param autoDismissDelay - Time in ms before auto-dismissing (default: 5000)
 * @returns Notification state and setter functions
 * 
 * @example
 * function MyComponent() {
 *   const { error, success, setError, setSuccess } = useNotifications();
 *   
 *   const handleAction = async () => {
 *     try {
 *       await someAction();
 *       setSuccess('Action completed!');
 *     } catch (err) {
 *       setError('Action failed');
 *     }
 *   };
 *   
 *   return (
 *     <>
 *       {error && <ErrorMessage>{error}</ErrorMessage>}
 *       {success && <SuccessMessage>{success}</SuccessMessage>}
 *     </>
 *   );
 * }
 */
export function useNotifications(autoDismissDelay: number = 5000): NotificationState {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-dismiss error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), autoDismissDelay);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [error, autoDismissDelay]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), autoDismissDelay);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [success, autoDismissDelay]);

  const clearAll = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    error,
    success,
    setError,
    setSuccess,
    clearAll,
  };
}

/**
 * Parse URL parameters for OAuth callback messages
 * Extracts error and success parameters from URL
 * 
 * @returns Object with error and success messages (null if not present)
 * 
 * @example
 * function CallbackPage() {
 *   const { error, success } = useEffect(() => {
 *     const messages = parseOAuthCallbackParams();
 *     if (messages.error) setError(messages.error);
 *     if (messages.success) setSuccess(messages.success);
 *   }, []);
 * }
 */
export function parseOAuthCallbackParams(): {
  error: string | null;
  success: string | null;
} {
  if (typeof window === 'undefined') {
    return { error: null, success: null };
  }

  const params = new URLSearchParams(window.location.search);
  const errorParam = params.get('error');
  const successParam = params.get('success');
  const oauthSource = params.get('oauth_source');

  let error: string | null = null;
  let success: string | null = null;

  // Parse error parameter
  if (errorParam) {
    error =
      errorParam === 'oauth_not_configured'
        ? 'Google OAuth ist nicht vollständig konfiguriert. Prüfe Client ID, Secret und Redirect URI.'
        : errorParam === 'redirect_uri_mismatch'
        ? `Redirect URI mismatch. Öffne /calendar und übernimm die angezeigte URI exakt in Google Cloud.${oauthSource ? ` (source: ${oauthSource})` : ''}`
        : errorParam === 'token_exchange_failed'
        ? 'Token-Austausch mit Google fehlgeschlagen. Bitte erneut verbinden.'
        : errorParam === 'invalid_grant'
        ? 'Google hat den Authorization Code abgelehnt (invalid_grant). Starte die Verbindung erneut.'
        : errorParam === 'invalid_oauth_state'
        ? 'OAuth state validation fehlgeschlagen. Bitte erneut verbinden.'
        : errorParam === 'missing_code'
        ? 'Autorisierungscode fehlt. Bitte erneut verbinden.'
        : errorParam === 'access_denied'
        ? 'Google-Zugriff wurde abgelehnt.'
        : errorParam === 'oauth_callback_error'
        ? 'OAuth-Callback fehlgeschlagen. Bitte erneut verbinden.'
        : 'Bei der Authentifizierung ist ein Fehler aufgetreten.';
  }

  // Parse success parameter
  if (successParam === 'connected') {
    success = 'Google Calendar wurde erfolgreich verbunden.';
  }

  return { error, success };
}
