'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { LucianMood } from '@/lib/lucian/copy';
import { LucianSpriteAnimator } from './LucianSpriteAnimator';
import type { LucianAnimation } from './LucianSpriteAnimator';

// Mood → luminous top border gradient
const moodBorder: Record<LucianMood, string> = {
  motivate:  'via-blue-400/45',
  celebrate: 'via-yellow-400/50',
  warning:   'via-red-400/55',
  recovery:  'via-violet-400/45',
  idle:      'via-white/20',
};

// Mood → header text color
const moodHeaderColor: Record<LucianMood, string> = {
  motivate:  'text-blue-400',
  celebrate: 'text-yellow-400',
  warning:   'text-red-400',
  recovery:  'text-violet-400',
  idle:      'text-zinc-500',
};

// Mood → glow behind sprite
const moodGlow: Record<LucianMood, string> = {
  motivate:  'bg-blue-500/10',
  celebrate: 'bg-yellow-500/[12%]',
  warning:   'bg-red-500/15',
  recovery:  'bg-violet-500/10',
  idle:      'bg-white/5',
};

// Mood → subtle right-panel tint
const moodPanelTint: Record<LucianMood, string> = {
  motivate:  'from-blue-500/[0.10]',
  celebrate: 'from-yellow-500/[0.12]',
  warning:   'from-red-500/[0.12]',
  recovery:  'from-violet-500/[0.12]',
  idle:      'from-white/[0.06]',
};

// Mood → display label
const moodLabel: Record<LucianMood, string> = {
  motivate:  'MOTIVATE',
  celebrate: 'CELEBRATE',
  warning:   'WARNING',
  recovery:  'RECOVERY',
  idle:      'IDLE',
};

// Mood → companion "spell" tag
const moodSpell: Record<LucianMood, string> = {
  motivate:  'Relentless Drive',
  celebrate: 'Momentum Surge',
  warning:   'Deadline Pulse',
  recovery:  'Reset Ritual',
  idle:      'Standby Field',
};

// Mood → settled sprite animation
const moodAnimation: Record<LucianMood, LucianAnimation> = {
  motivate:  'idle',
  celebrate: 'victory',
  warning:   'panic',
  recovery:  'meditate',
  idle:      'idle',
};

interface LucianBubbleProps {
  text: string;
  mood: LucianMood;
  ariaRole: 'status' | 'alert';
  visible: boolean;
  onDismiss: () => void;
  onMuteToday: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function LucianBubble({
  text,
  mood,
  ariaRole,
  visible,
  onDismiss,
  onMuteToday,
  onPause,
  onResume,
}: LucianBubbleProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'entry' | 'settled'>('settled');

  useEffect(() => {
    if (!visible) return;
    setPhase('entry');
    const timer = setTimeout(() => setPhase('settled'), 1200);
    return () => clearTimeout(timer);
  }, [visible]);

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit:    { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 8, scale: 0.97 },
        animate: { opacity: 1, y: 0,  scale: 1    },
        exit:    { opacity: 0, y: -4              },
      };

  const currentAnimation: LucianAnimation =
    phase === 'entry' ? 'walk' : moodAnimation[mood];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="lucian-bubble"
          {...variants}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed bottom-[100px] right-6 z-[49] w-[min(320px,calc(100vw-48px))]"
          onMouseEnter={onPause}
          onFocus={onPause}
          onMouseLeave={onResume}
          onBlur={onResume}
          onClick={onDismiss}
          role={ariaRole}
          aria-live={ariaRole === 'alert' ? 'assertive' : 'polite'}
          aria-atomic="true"
          aria-label="Lucian Companion-Hinweis"
        >
          <div
            className="relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08]
              bg-[#0d0d10]/95
              shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_16px_40px_rgba(0,0,0,0.6)]
              backdrop-blur-2xl"
          >
            {/* Mood-tinted luminous top border */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-px
                bg-gradient-to-r from-transparent ${moodBorder[mood]} to-transparent`}
            />

            {/* Header: mood label + close button */}
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <span
                className={`text-[10px] font-semibold uppercase tracking-widest ${moodHeaderColor[mood]}`}
              >
                Lucian · {moodLabel[mood]}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMuteToday();
                }}
                aria-label="Lucian für heute stummschalten"
                className="rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Body: sprite panel + message panel */}
            <div className="flex items-stretch pb-3.5">
              {/* Left panel — sprite + mood glow */}
              <div className="relative flex w-20 flex-shrink-0 items-center justify-center border-r border-white/[0.06]">
                <motion.div
                  className={`pointer-events-none absolute inset-0 ${moodGlow[mood]} blur-lg`}
                  animate={
                    prefersReducedMotion
                      ? { opacity: 0.7, scale: 1 }
                      : { opacity: [0.45, 0.9, 0.45], scale: [0.92, 1.08, 0.92] }
                  }
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <LucianSpriteAnimator animation={currentAnimation} size={64} />
              </div>

              {/* Right panel — message text */}
              <div className="relative flex flex-1 overflow-hidden">
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${moodPanelTint[mood]} via-transparent to-transparent`}
                />
                <div className="relative flex w-full flex-col justify-center px-4">
                  <p className="text-[13px] leading-snug text-zinc-200">
                    {text}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                    <span className="h-1 w-1 rounded-full bg-current" />
                    <span>{moodSpell[mood]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
