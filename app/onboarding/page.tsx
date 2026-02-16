'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchProfileAction, updateProfileAction } from '@/app/actions/profile';

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const profile = await fetchProfileAction();
        if (!mounted) return;
        if (profile.onboardingCompleted) {
          router.replace('/today');
          return;
        }
        setFullName(profile.fullName || '');
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const trimmedName = fullName.trim();
      await updateProfileAction({
        ...(trimmedName ? { fullName: trimmedName } : {}),
        onboardingCompleted: true,
      });
      toast.success('Welcome to Prism');
      router.push('/today');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish onboarding');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-text-tertiary">Preparing your workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg"
      >
        <div className="bg-surface/85 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Finish setup</h1>
          <p className="text-text-secondary mb-6">
            One quick step so Prism can personalize your workspace.
          </p>

          <form onSubmit={handleContinue} className="space-y-4">
            {error ? (
              <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                {error}
              </div>
            ) : null}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
                Display Name
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                disabled={saving}
              />
            </div>

            <Button type="submit" variant="primary" fullWidth loading={saving} disabled={saving}>
              Continue to Dashboard
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
