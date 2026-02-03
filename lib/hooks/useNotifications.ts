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

  let error: string | null = null;
  let success: string | null = null;

  // Parse error parameter
  if (errorParam) {
    error =
      errorParam === 'oauth_not_configured'
        ? 'Google OAuth is not configured. Please check your environment variables.'
        : errorParam === 'token_exchange_failed'
        ? 'Failed to exchange authorization code. Please try again.'
        : errorParam === 'missing_code'
        ? 'Authorization code missing. Please try again.'
        : 'An error occurred during authentication.';
  }

  // Parse success parameter
  if (successParam === 'connected') {
    success = 'Successfully connected to Google Calendar!';
  }

  return { error, success };
}
