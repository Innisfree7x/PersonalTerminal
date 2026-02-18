'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { isOnboardingComplete } from '@/lib/auth/profile';

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
      const target = isOnboardingComplete(result.user) ? '/today' : '/onboarding';
      router.push(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark mb-4">
            <span className="text-white font-bold text-2xl">I</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome back
          </h1>
          <p className="text-text-secondary">
            Sign in to your INNIS account
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
                Password
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
                className="text-primary hover:text-primary-hover transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-text-tertiary">
                Don&apos;t have an account?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link href="/auth/signup">
            <Button variant="secondary" fullWidth>
              Create Account
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary mt-8">
          By continuing, you agree to INNIS&apos;s Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
