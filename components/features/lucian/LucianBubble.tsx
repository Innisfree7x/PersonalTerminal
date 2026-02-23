'use client';

import { useEffect, useRef, useState } from 'react';
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
  recovery:  'via-teal-400/45',
  idle:      'via-white/20',
};

// Mood → header text color
const moodHeaderColor: Record<LucianMood, string> = {
  motivate:  'text-blue-400',
  celebrate: 'text-yellow-400',
  warning:   'text-red-400',
  recovery:  'text-teal-400',
  idle:      'text-zinc-500',
};

// Mood → glow behind sprite
const moodGlow: Record<LucianMood, string> = {
  motivate:  'bg-blue-500/10',
  celebrate: 'bg-yellow-500/[12%]',
  warning:   'bg-red-500/15',
  recovery:  'bg-teal-500/10',
  idle:      'bg-white/5',
};

// Mood → subtle right-panel tint
const moodPanelTint: Record<LucianMood, string> = {
  motivate:  'from-blue-500/[0.10]',
  celebrate: 'from-yellow-500/[0.12]',
  warning:   'from-red-500/[0.12]',
  recovery:  'from-teal-500/[0.12]',
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
  actionLabel?: string;
  actionAriaLabel?: string;
  dismissOnBodyClick?: boolean;
  onDismiss: () => void;
  onMuteToday: () => void;
  onPause: () => void;
  onResume: () => void;
  onAction?: () => void;
}

export function LucianBubble({
  text,
  mood,
  ariaRole,
  visible,
  actionLabel,
  actionAriaLabel,
  dismissOnBodyClick = true,
  onDismiss,
  onMuteToday,
  onPause,
  onResume,
  onAction,
}: LucianBubbleProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'entry' | 'settled'>('settled');
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<{
    anchored: boolean;
    left: number;
    top: number;
    tailSide: 'top' | 'bottom';
    tailOffset: number;
  }>({
    anchored: false,
    left: 0,
    top: 0,
    tailSide: 'bottom',
    tailOffset: 160,
  });

  useEffect(() => {
    if (!visible) return;
    setPhase('entry');
    const timer = setTimeout(() => setPhase('settled'), 1200);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const updatePosition = () => {
      const bubbleEl = bubbleRef.current;
      const championEl = document.querySelector('[data-champion-sprite="true"]') as HTMLElement | null;
      if (!bubbleEl || !championEl) {
        setAnchor((prev) => ({ ...prev, anchored: false }));
        return;
      }

      const championRect = championEl.getBoundingClientRect();
      const bubbleRect = bubbleEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const margin = 12;

      let left = championRect.left + championRect.width / 2 - bubbleRect.width / 2;
      left = Math.max(margin, Math.min(viewportWidth - bubbleRect.width - margin, left));

      let top = championRect.top - bubbleRect.height - 14;
      let tailSide: 'top' | 'bottom' = 'bottom';
      if (top < margin) {
        top = championRect.bottom + 14;
        tailSide = 'top';
      }

      const championCenterX = championRect.left + championRect.width / 2;
      const tailOffset = Math.max(22, Math.min(bubbleRect.width - 22, championCenterX - left));

      setAnchor((prev) => {
        const same =
          prev.anchored &&
          Math.abs(prev.left - left) < 0.5 &&
          Math.abs(prev.top - top) < 0.5 &&
          prev.tailSide === tailSide &&
          Math.abs(prev.tailOffset - tailOffset) < 0.5;
        if (same) return prev;
        return {
          anchored: true,
          left,
          top,
          tailSide,
          tailOffset,
        };
      });
    };

    updatePosition();
    const interval = window.setInterval(updatePosition, 140);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [text, visible]);

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
  const bubbleStyle = anchor.anchored ? { left: anchor.left, top: anchor.top } : {};

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="lucian-bubble"
          ref={bubbleRef}
          {...variants}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`fixed z-[49] w-[min(320px,calc(100vw-48px))] ${anchor.anchored ? '' : 'bottom-[100px] right-6'}`}
          style={bubbleStyle}
          onMouseEnter={onPause}
          onFocus={onPause}
          onMouseLeave={onResume}
          onBlur={onResume}
          onClick={dismissOnBodyClick ? onDismiss : undefined}
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
                  {actionLabel && onAction ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAction();
                      }}
                      aria-label={actionAriaLabel ?? actionLabel}
                      className="mt-3 inline-flex w-fit items-center rounded-md border border-cyan-300/35 bg-cyan-400/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-400/20"
                    >
                      {actionLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          {anchor.anchored && (
            <div
              className="pointer-events-none absolute h-3 w-3 rotate-45 border border-white/[0.08] bg-[#0d0d10]/95"
              style={
                anchor.tailSide === 'bottom'
                  ? { left: anchor.tailOffset - 6, bottom: -6 }
                  : { left: anchor.tailOffset - 6, top: -6 }
              }
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
