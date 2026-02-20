'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { isOnboardingComplete } from '@/lib/auth/profile';
import { BrandMark } from '@/components/shared/BrandLogo';
import { trackMarketingEvent } from '@/lib/analytics/marketing';

const LAST_SEEN_KEY = 'innis_last_seen_at';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      const now = Date.now();
      try {
        const previous = localStorage.getItem(LAST_SEEN_KEY);
        if (previous) {
          const previousMs = Date.parse(previous);
          if (!Number.isNaN(previousMs) && now - previousMs >= 24 * 60 * 60 * 1000) {
            void trackMarketingEvent('day2_return', { source: 'auth_login' });
          }
        }
        localStorage.setItem(LAST_SEEN_KEY, new Date(now).toISOString());
      } catch {
        // localStorage unavailable, ignore tracking.
      }
      const target = isOnboardingComplete(result.user) ? '/today' : '/onboarding';
      router.push(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <BrandMark sizeClassName="h-16 w-16" className="mb-4" />
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Willkommen zurück
          </h1>
          <p className="text-text-secondary">
            Melde dich bei deinem INNIS-Konto an
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Passwort
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/auth/reset-password"
                className="text-[#ff5a4f] hover:text-[#ff8a65] transition-colors"
              >
                Passwort vergessen?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
              className="!bg-[#e54d42] hover:!bg-[#f06455] hover:!shadow-[0_0_24px_rgba(229,77,66,0.35)]"
            >
              Anmelden
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-text-tertiary">
                Noch kein Konto?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link href="/auth/signup">
            <Button
              variant="secondary"
              fullWidth
              className="border-[#2f3346] hover:border-[#ff5a4f] hover:bg-[#ff5a4f]/10"
            >
              Konto erstellen
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary mt-8">
          Mit der Anmeldung stimmst du den <a href="/terms" className="underline hover:text-text-secondary">Nutzungsbedingungen</a> und der <a href="/privacy" className="underline hover:text-text-secondary">Datenschutzerklärung</a> von INNIS zu.
        </p>
      </motion.div>
    </div>
  );
}
