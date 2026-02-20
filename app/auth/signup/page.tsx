'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { BrandMark } from '@/components/shared/BrandLogo';
import { trackMarketingEvent } from '@/lib/analytics/marketing';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein.');
      setLoading(false);
      return;
    }

    try {
      void trackMarketingEvent('signup_started', { source: 'auth_signup_form' });
      const result = await signUp(email, password, { fullName });
      if (result.session && result.user) {
        void trackMarketingEvent('signup_completed', { source: 'auth_signup_form' });
        router.push('/onboarding');
        router.refresh();
        return;
      }
      void trackMarketingEvent('signup_completed', { source: 'auth_signup_form' });
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Konto erstellt!
          </h2>
          <p className="text-text-secondary">
            Prüfe deine E-Mails zur Verifizierung und melde dich danach an.
          </p>
        </motion.div>
      </div>
    );
  }

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
            Konto erstellen
          </h1>
          <p className="text-text-secondary">
            Starte mit INNIS dein persönliches System
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
                Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

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
              <p className="text-xs text-text-tertiary mt-1">
                Mindestens 8 Zeichen
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                Passwort bestätigen
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
              className="!bg-[#e54d42] hover:!bg-[#f06455] hover:!shadow-[0_0_24px_rgba(229,77,66,0.35)]"
            >
              Konto erstellen
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-text-tertiary">
                Bereits registriert?
              </span>
            </div>
          </div>

          {/* Sign In Link */}
          <Link href="/auth/login">
            <Button
              variant="secondary"
              fullWidth
              className="border-[#2f3346] hover:border-[#ff5a4f] hover:bg-[#ff5a4f]/10"
            >
              Anmelden
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary mt-8">
          Mit der Registrierung stimmst du den <a href="/terms" className="underline hover:text-text-secondary">Nutzungsbedingungen</a> und der <a href="/privacy" className="underline hover:text-text-secondary">Datenschutzerklärung</a> von INNIS zu.
        </p>
      </motion.div>
    </div>
  );
}
