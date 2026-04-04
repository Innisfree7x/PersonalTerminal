'use client';

import { useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Button3D } from '@/components/ui/Button3D';
import { ACHIEVEMENTS } from '@/lib/achievements/registry';

interface AchievementUnlockOverlayProps {
  achievementKey: string | null;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 6000;
const CONFETTI_COUNT = 12;
const CONFETTI_COLORS = ['#eab308', '#22c55e', '#3b82f6', '#f59e0b'];

function ConfettiParticle({ index }: { index: number }) {
  const { xTarget, yTarget, size } = useMemo(() => ({
    xTarget: (Math.random() - 0.5) * 160,
    yTarget: -(120 + Math.random() * 80),
    size: 6 + Math.random() * 4,
  }), []);

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        left: '50%',
        top: '40%',
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: xTarget, y: yTarget, opacity: 0, scale: 0.3 }}
      transition={{ duration: 1.2, delay: index * 0.05, ease: 'easeOut' }}
    />
  );
}

export default function AchievementUnlockOverlay({
  achievementKey,
  onDismiss,
}: AchievementUnlockOverlayProps) {
  const reduced = useReducedMotion();

  const achievement = useMemo(
    () => (achievementKey ? ACHIEVEMENTS.find((a) => a.key === achievementKey) : null),
    [achievementKey]
  );

  useEffect(() => {
    if (!achievementKey) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [achievementKey, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key={achievement.key}
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onDismiss}
            role="presentation"
          />
          <motion.div
            className="relative card-warm rounded-2xl max-w-sm w-full mx-4 p-8 text-center"
            initial={reduced ? { opacity: 1 } : { scale: 0.8, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {!reduced &&
              Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
                <ConfettiParticle key={i} index={i} />
              ))
            }

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 shadow-[0_0_24px_rgba(234,179,8,0.2)]">
              <Trophy className="h-8 w-8 text-primary" />
            </div>

            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
              Achievement freigeschaltet!
            </p>
            <h3 className="mt-2 text-xl font-bold text-text-primary">
              {achievement.title}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {achievement.description}
            </p>

            {achievement.roomItemReward && (
              <p className="mt-3 text-xs font-medium text-primary">
                Raumobjekt freigeschaltet 🎁
              </p>
            )}

            <div className="mt-6">
              <Button3D variant="primary" size="sm" onClick={onDismiss}>
                Weiter
              </Button3D>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
