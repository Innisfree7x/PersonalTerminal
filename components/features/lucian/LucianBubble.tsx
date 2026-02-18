'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { LucianMood } from '@/lib/lucian/copy';

// Mood → luminous top border gradient
const moodBorder: Record<LucianMood, string> = {
  motivate:  'via-blue-400/45',
  celebrate: 'via-yellow-400/50',
  warning:   'via-red-400/55',
  recovery:  'via-violet-400/45',
  idle:      'via-white/20',
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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="lucian-bubble"
          {...variants}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed bottom-[100px] right-6 z-[49] w-[min(300px,calc(100vw-48px))]"
          onMouseEnter={onPause}
          onFocus={onPause}
          onMouseLeave={onResume}
          onBlur={onResume}
          // Click body = dismiss
          onClick={onDismiss}
          role={ariaRole}
          aria-live={ariaRole === 'alert' ? 'assertive' : 'polite'}
          aria-atomic="true"
          aria-label="Lucian Companion-Hinweis"
        >
          <div
            className="relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08]
              bg-[#0d0d10]/95 px-4 py-3.5
              shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_16px_40px_rgba(0,0,0,0.6)]
              backdrop-blur-2xl"
          >
            {/* Mood-tinted luminous top border */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-px
                bg-gradient-to-r from-transparent ${moodBorder[mood]} to-transparent`}
            />

            {/* Header: label + mute button */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Lucian
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // don't also trigger onDismiss
                  onMuteToday();
                }}
                aria-label="Lucian für heute stummschalten"
                className="rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Message text */}
            <p className="text-[13px] leading-snug text-zinc-200">{text}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
