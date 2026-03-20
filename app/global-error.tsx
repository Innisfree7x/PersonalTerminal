'use client';

import { useEffect } from 'react';
import { captureClientError } from '@/lib/monitoring';
import { Button } from '@/components/ui/Button';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientError({
      message: error.message,
      errorName: error.name,
      severity: 'critical',
      context: {
        digest: error.digest,
      },
      ...(error.stack ? { stack: error.stack } : {}),
    });
  }, [error]);

  return (
    <html lang="de" className="dark" suppressHydrationWarning>
      <body className="bg-background text-text-primary p-8">
        <div className="max-w-xl mx-auto mt-24 rounded-xl border border-error/30 bg-surface p-8 space-y-4">
          <h2 className="text-2xl font-bold">Kritischer Anwendungsfehler</h2>
          <p className="text-text-secondary">
            Es ist ein unerwarteter Fehler aufgetreten. Der Vorfall wurde zur Analyse erfasst.
          </p>
          <Button variant="primary" onClick={() => reset()}>
            Erneut versuchen
          </Button>
        </div>
      </body>
    </html>
  );
}
