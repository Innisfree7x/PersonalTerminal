'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, User, ChevronRight } from 'lucide-react';
import { updateProfileAction } from '@/app/actions/profile';

interface StepProfileProps {
  initialName?: string;
  onNext: (name: string) => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function StepProfile({ initialName = '', onNext }: StepProfileProps) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSaving(true);
    try {
      await updateProfileAction({ fullName: name.trim() });
      onNext(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onNext('');
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <User className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Wie heißt du?</h2>
        <p className="text-text-secondary text-sm">
          Prism personalisiert dein Dashboard mit deinem Namen.
        </p>
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
            {error}
          </div>
        ) : null}

        <Input
          label="Anzeigename"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Max Müller"
          disabled={saving}
          fullWidth
          autoFocus
        />

        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={saving}
            disabled={saving || !name.trim()}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Weiter
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors flex items-center justify-center gap-1 py-1"
          >
            Ohne Namen fortfahren
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
