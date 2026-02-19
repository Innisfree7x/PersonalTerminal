'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { captureClientError } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in production, you'd send this to your error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    captureClientError({
      message: error.message,
      errorName: error.name,
      severity: 'error',
      context: {
        componentStack: errorInfo.componentStack,
      },
      source: 'client',
      ...(error.stack ? { stack: error.stack } : {}),
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/today';
  };

  override render() {
    if (this.state.hasError) {
      const { fallbackTitle, fallbackMessage } = this.props;
      const { error, errorInfo } = this.state;
      const showErrorDetails = process.env.NODE_ENV === 'development';

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center min-h-[400px] p-6"
        >
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-surface border border-error/30 rounded-xl p-8 shadow-lg">
              {/* Icon + Title */}
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-error/20">
                  <AlertTriangle className="w-8 h-8 text-error" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {fallbackTitle || 'Etwas ist schiefgelaufen'}
                  </h2>
                  <p className="text-text-secondary">
                    {fallbackMessage ||
                      'Ein unerwarteter Fehler ist aufgetreten. Deine Daten sind sicher.'}
                  </p>
                </div>
              </div>

              {/* Error Details (only in development) */}
              {showErrorDetails && error && (
                <div className="mb-6 p-4 bg-background/50 border border-border rounded-lg">
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Error Details (Development Only):
                  </h3>
                  <pre className="text-xs text-error overflow-x-auto">
                    {error.toString()}
                  </pre>
                  {errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-text-tertiary overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <motion.button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Erneut versuchen
                </motion.button>

                <motion.button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-hover hover:bg-surface text-text-primary border border-border rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Home className="w-4 h-4" />
                  Zum Dashboard
                </motion.button>
              </div>

              {/* Help Text */}
              <p className="mt-6 text-xs text-text-tertiary">
                Wenn das Problem anhält, lade die Seite neu oder kehre zum Dashboard zurück.
              </p>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based wrapper for ErrorBoundary (for convenience)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
