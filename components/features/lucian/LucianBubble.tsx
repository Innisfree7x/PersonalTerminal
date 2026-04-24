'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { normalizeLucianMood, type LucianMood, type LucianMoodCore, type LucianDialogOption } from '@/lib/lucian/copy';
import { LucianSpriteAnimator, type LucianAnimation } from '@/components/features/lucian/LucianSpriteAnimator';
import { usePageVisibility } from '@/lib/hooks/usePageVisibility';

const moodAccentText: Record<LucianMoodCore, string> = {
  hype: 'text-amber-300',
  'real-talk': 'text-red-300',
  chill: 'text-zinc-400',
  comfort: 'text-teal-300',
  deep: 'text-cyan-300',
};

const moodChipBg: Record<LucianMoodCore, string> = {
  hype: 'bg-amber-500/15 border-amber-300/35',
  'real-talk': 'bg-red-500/15 border-red-300/35',
  chill: 'bg-zinc-500/15 border-zinc-300/25',
  comfort: 'bg-teal-500/15 border-teal-300/35',
  deep: 'bg-cyan-500/15 border-cyan-300/35',
};

const moodBubbleTint: Record<LucianMoodCore, string> = {
  hype: 'from-amber-400/[0.09]',
  'real-talk': 'from-red-400/[0.1]',
  chill: 'from-white/[0.06]',
  comfort: 'from-teal-400/[0.09]',
  deep: 'from-cyan-400/[0.09]',
};

const moodRim: Record<LucianMoodCore, string> = {
  hype: 'via-amber-300/55',
  'real-talk': 'via-red-300/60',
  chill: 'via-white/25',
  comfort: 'via-teal-300/55',
  deep: 'via-cyan-300/55',
};

const moodActionButton: Record<LucianMoodCore, string> = {
  hype:        'border-amber-300/35 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25',
  'real-talk': 'border-red-300/35 bg-red-400/15 text-red-100 hover:bg-red-400/25',
  chill:       'border-zinc-300/25 bg-zinc-400/15 text-zinc-200 hover:bg-zinc-400/25',
  comfort:     'border-teal-300/35 bg-teal-400/15 text-teal-100 hover:bg-teal-400/25',
  deep:        'border-cyan-300/35 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25',
};

const moodTailColor: Record<LucianMoodCore, string> = {
  hype:        'bg-amber-300/30',
  'real-talk': 'bg-red-300/35',
  chill:       'bg-white/[0.12]',
  comfort:     'bg-teal-300/30',
  deep:        'bg-cyan-300/30',
};

const moodGlowShadow: Record<LucianMoodCore, string> = {
  hype: '0 16px 48px rgba(245,158,11,0.16)',
  'real-talk': '0 16px 48px rgba(239,68,68,0.18)',
  chill: '0 16px 48px rgba(255,255,255,0.08)',
  comfort: '0 16px 48px rgba(20,184,166,0.14)',
  deep: '0 16px 48px rgba(34,211,238,0.14)',
};

const moodLabel: Record<LucianMoodCore, string> = {
  hype: 'HYPE',
  'real-talk': 'REAL TALK',
  chill: 'CHILL',
  comfort: 'COMFORT',
  deep: 'DEEP',
};

const moodSpell: Record<LucianMoodCore, string> = {
  hype: 'Momentum Surge',
  'real-talk': 'Deadline Pulse',
  chill: 'Standby Field',
  comfort: 'Reset Ritual',
  deep: 'Inner Light',
};

// Settled animation per mood
const moodAnimation: Record<LucianMoodCore, LucianAnimation> = {
  hype: 'victory',
  'real-talk': 'panic',
  chill: 'idle',
  comfort: 'meditate',
  deep: 'idle',
};

// Sprite panel glow per mood
const moodSpriteGlow: Record<LucianMoodCore, string> = {
  hype: 'bg-amber-500/12',
  'real-talk': 'bg-red-500/15',
  chill: 'bg-white/[0.05]',
  comfort: 'bg-teal-500/12',
  deep: 'bg-cyan-500/15',
};

interface LucianBubbleProps {
  text: string;
  mood: LucianMood;
  ariaRole: 'status' | 'alert';
  visible: boolean;
  anchorSelector?: string;
  actionLabel?: string;
  actionAriaLabel?: string;
  dialogOptions?: LucianDialogOption[] | undefined;
  dismissOnBodyClick?: boolean;
  onDismiss: () => void;
  onMuteToday: () => void;
  onPause: () => void;
  onResume: () => void;
  onAction?: (() => void) | undefined;
  onDialogAction?: ((action: LucianDialogOption['action']) => void) | undefined;
}

export function LucianBubble({
  text,
  mood,
  ariaRole,
  visible,
  anchorSelector = '[data-champion-sprite="true"]',
  actionLabel,
  actionAriaLabel,
  dialogOptions,
  dismissOnBodyClick = false,
  onDismiss,
  onMuteToday,
  onPause,
  onResume,
  onAction,
  onDialogAction,
}: LucianBubbleProps) {
  const prefersReducedMotion = useReducedMotion();
  const isPageVisible = usePageVisibility();
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalizedMood = normalizeLucianMood(mood);

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

  // Walk-in entry phase: walk for 1200ms, then settle into mood animation
  const [phase, setPhase] = useState<'entry' | 'settled'>('entry');

  useEffect(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (!visible) {
      setPhase('entry');
      return;
    }
    phaseTimerRef.current = setTimeout(() => setPhase('settled'), 1200);
    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
    };
  }, [visible]);

  const spriteAnimation: LucianAnimation = prefersReducedMotion
    ? moodAnimation[normalizedMood]
    : phase === 'entry'
    ? 'walk'
    : moodAnimation[normalizedMood];

  useEffect(() => {
    if (!visible) return;

    const updatePosition = () => {
      const bubbleEl = bubbleRef.current;
      const championEl = document.querySelector(anchorSelector) as HTMLElement | null;

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
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });

    const interval = isPageVisible
      ? window.setInterval(updatePosition, 500)
      : null;

    return () => {
      if (interval !== null) window.clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [anchorSelector, text, visible, isPageVisible]);

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 16, scale: 0.92 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -8, scale: 0.96 },
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
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
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
            {/* Top rim light */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${moodRim[normalizedMood]} to-transparent`}
            />
            {/* Mood tint */}
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${moodBubbleTint[normalizedMood]} via-transparent to-transparent`}
            />
            {/* Glow shadow */}
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{ boxShadow: moodGlowShadow[normalizedMood] }}
            />

            {/* Header — full width */}
            <div className="relative flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] ${moodChipBg[normalizedMood]} ${moodAccentText[normalizedMood]}`}
              >
                <Zap className="h-3 w-3" />
                Lucian · {moodLabel[normalizedMood]}
              </span>
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

            {/* Body — sprite panel + text panel */}
            <div className="relative flex items-stretch">
              {/* Sprite panel */}
              <div className="relative flex w-[96px] flex-shrink-0 items-center justify-center border-r border-white/[0.06] py-4">
                <div
                  className={`pointer-events-none absolute inset-0 ${moodSpriteGlow[normalizedMood]} blur-xl`}
                />
                <LucianSpriteAnimator animation={spriteAnimation} size={72} />
              </div>

              {/* Text panel */}
              <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3.5">
                <p className="text-[14px] leading-snug text-zinc-100">
                  {text}
                </p>

                <div className="mt-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-zinc-400">
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span>{moodSpell[normalizedMood]}</span>
                </div>

                {/* Dialog options — multiple action buttons */}
                {dialogOptions && dialogOptions.length > 0 && onDialogAction ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {dialogOptions.map((option) => (
                      <button
                        key={option.action + option.label}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDialogAction(option.action);
                        }}
                        className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-[0.04em] transition ${moodActionButton[normalizedMood]}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : actionLabel && onAction ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAction();
                    }}
                    aria-label={actionAriaLabel ?? actionLabel}
                    className={`mt-3 inline-flex w-fit items-center rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${moodActionButton[normalizedMood]}`}
                  >
                    {actionLabel}
                  </button>
                ) : null}
              </div>
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
              <div className={`absolute inset-0 ${moodTailColor[normalizedMood]} ${tailShapeClass}`} />
              <div className={`absolute inset-[1px] bg-[#0d1119]/95 ${tailShapeClass}`} />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
