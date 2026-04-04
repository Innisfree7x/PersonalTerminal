'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface MorningRitualProps {
  onComplete: () => void;
  morningMessage: string;
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STORAGE_KEY_PREFIX = 'innis:morning-ritual:';
const FADEIN_DELAY_MS = 800;
const BUBBLE_DELAY_MS = 2200;
const AUTO_DISMISS_MS = 7000;

export default function MorningRitual({ onComplete, morningMessage }: MorningRitualProps) {
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState<'hidden' | 'fadein' | 'bubble' | 'done'>('hidden');

  const finish = useCallback(() => {
    setPhase('done');
    try {
      window.localStorage.setItem(STORAGE_KEY_PREFIX + getTodayKey(), '1');
    } catch { /* quota */ }
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const key = STORAGE_KEY_PREFIX + getTodayKey();
    try {
      if (window.localStorage.getItem(key)) {
        finish();
        return;
      }
    } catch { /* */ }

    if (prefersReduced) {
      finish();
      return;
    }

    const t1 = setTimeout(() => setPhase('fadein'), FADEIN_DELAY_MS);
    const t2 = setTimeout(() => setPhase('bubble'), BUBBLE_DELAY_MS);
    const t3 = setTimeout(finish, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [finish, prefersReduced]);

  if (phase === 'done') return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <AnimatePresence>
        {phase === 'bubble' && (
          <motion.div
            key="bubble"
            className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-30"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="card-warm rounded-2xl px-5 py-3 max-w-sm shadow-lg border border-border/60">
              <p className="text-sm text-text-primary leading-relaxed">{morningMessage}</p>
              <button
                onClick={finish}
                className="mt-2 w-full rounded-lg bg-primary/10 border border-primary/25 px-4 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                Los geht&apos;s
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
