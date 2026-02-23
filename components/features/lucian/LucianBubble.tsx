'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import type { LucianMood } from '@/lib/lucian/copy';

const moodAccentText: Record<LucianMood, string> = {
  motivate: 'text-cyan-300',
  celebrate: 'text-amber-300',
  warning: 'text-red-300',
  recovery: 'text-teal-300',
  idle: 'text-zinc-400',
};

const moodChipBg: Record<LucianMood, string> = {
  motivate: 'bg-cyan-500/15 border-cyan-300/35',
  celebrate: 'bg-amber-500/15 border-amber-300/35',
  warning: 'bg-red-500/15 border-red-300/35',
  recovery: 'bg-teal-500/15 border-teal-300/35',
  idle: 'bg-zinc-500/15 border-zinc-300/25',
};

const moodBubbleTint: Record<LucianMood, string> = {
  motivate: 'from-cyan-400/[0.09]',
  celebrate: 'from-amber-400/[0.09]',
  warning: 'from-red-400/[0.1]',
  recovery: 'from-teal-400/[0.09]',
  idle: 'from-white/[0.06]',
};

const moodRim: Record<LucianMood, string> = {
  motivate: 'via-cyan-300/55',
  celebrate: 'via-amber-300/55',
  warning: 'via-red-300/60',
  recovery: 'via-teal-300/55',
  idle: 'via-white/25',
};

// Mood → CTA action button accent
const moodActionButton: Record<LucianMood, string> = {
  motivate:  'border-cyan-300/35 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25',
  celebrate: 'border-amber-300/35 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25',
  warning:   'border-red-300/35 bg-red-400/15 text-red-100 hover:bg-red-400/25',
  recovery:  'border-teal-300/35 bg-teal-400/15 text-teal-100 hover:bg-teal-400/25',
  idle:      'border-zinc-300/25 bg-zinc-400/15 text-zinc-200 hover:bg-zinc-400/25',
};

// Mood → tail outer border color (matches rim light)
const moodTailColor: Record<LucianMood, string> = {
  motivate:  'bg-cyan-300/30',
  celebrate: 'bg-amber-300/30',
  warning:   'bg-red-300/35',
  recovery:  'bg-teal-300/30',
  idle:      'bg-white/[0.12]',
};

const moodGlowShadow: Record<LucianMood, string> = {
  motivate: '0 16px 48px rgba(34,211,238,0.14)',
  celebrate: '0 16px 48px rgba(245,158,11,0.16)',
  warning: '0 16px 48px rgba(239,68,68,0.18)',
  recovery: '0 16px 48px rgba(20,184,166,0.14)',
  idle: '0 16px 48px rgba(255,255,255,0.08)',
};

const moodLabel: Record<LucianMood, string> = {
  motivate: 'MOTIVATE',
  celebrate: 'CELEBRATE',
  warning: 'WARNING',
  recovery: 'RECOVERY',
  idle: 'IDLE',
};

const moodSpell: Record<LucianMood, string> = {
  motivate: 'Relentless Drive',
  celebrate: 'Momentum Surge',
  warning: 'Deadline Pulse',
  recovery: 'Reset Ritual',
  idle: 'Standby Field',
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
    tailOffset: 180,
  });

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
      const margin = 14;

      let left = championRect.left + championRect.width / 2 - bubbleRect.width / 2;
      left = Math.max(margin, Math.min(viewportWidth - bubbleRect.width - margin, left));

      let top = championRect.top - bubbleRect.height - 16;
      let tailSide: 'top' | 'bottom' = 'bottom';

      if (top < margin) {
        top = championRect.bottom + 16;
        tailSide = 'top';
      }

      const championCenterX = championRect.left + championRect.width / 2;
      const tailOffset = Math.max(30, Math.min(bubbleRect.width - 30, championCenterX - left));

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
    const interval = window.setInterval(updatePosition, 150);
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
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 6, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -4 },
      };

  const bubbleStyle = anchor.anchored ? { left: anchor.left, top: anchor.top } : {};
  const tailShapeClass =
    anchor.tailSide === 'bottom'
      ? '[clip-path:polygon(50%_100%,0_0,100%_0)]'
      : '[clip-path:polygon(0_100%,100%_100%,50%_0)]';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="lucian-bubble"
          ref={bubbleRef}
          {...variants}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className={`fixed z-[56] w-[min(420px,calc(100vw-40px))] ${anchor.anchored ? '' : 'bottom-[108px] right-6'}`}
          style={bubbleStyle}
          onMouseEnter={onPause}
          onFocus={onPause}
          onMouseLeave={onResume}
          onBlur={onResume}
          onClick={dismissOnBodyClick ? onDismiss : undefined}
          role={ariaRole}
          aria-live={ariaRole === 'alert' ? 'assertive' : 'polite'}
          aria-atomic="true"
          aria-label="Lucian Companion Sprechblase"
        >
          <div
            className="relative cursor-pointer overflow-hidden rounded-[26px] border border-white/[0.12]
              bg-[#0d1119]/95
              shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_52px_rgba(0,0,0,0.62)]
              backdrop-blur-2xl"
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${moodRim[mood]} to-transparent`}
            />
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${moodBubbleTint[mood]} via-transparent to-transparent`}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{ boxShadow: moodGlowShadow[mood] }}
            />

            <div className="relative px-4 pb-4 pt-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${moodChipBg[mood]} ${moodAccentText[mood]}`}
                  >
                    <MessageCircle className="h-3 w-3" />
                    Lucian · {moodLabel[mood]}
                  </span>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onMuteToday();
                  }}
                  aria-label="Lucian fuer heute stummschalten"
                  className="rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-[15px] leading-snug text-zinc-100">
                {text}
              </p>

              <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
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
                  className={`mt-3 inline-flex w-fit items-center rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${moodActionButton[mood]}`}
                >
                  {actionLabel}
                </button>
              ) : null}
            </div>
          </div>

          {anchor.anchored && (
            <div
              className="pointer-events-none absolute h-4 w-7"
              style={
                anchor.tailSide === 'bottom'
                  ? { left: anchor.tailOffset - 14, bottom: -14 }
                  : { left: anchor.tailOffset - 14, top: -14 }
              }
            >
              <div className={`absolute inset-0 ${moodTailColor[mood]} ${tailShapeClass}`} />
              <div className={`absolute inset-[1px] bg-[#0d1119]/95 ${tailShapeClass}`} />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
