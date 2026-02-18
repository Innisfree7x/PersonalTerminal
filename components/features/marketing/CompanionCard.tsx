'use client';

import { motion } from 'framer-motion';

/**
 * Lucian Sigil — premium mascot marker for INNIS marketing.
 * SVG IDs are scoped to each <svg> element — safe to render multiple instances.
 */
function LucianSigil({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="sigil-gold"
          x1="0"
          y1="0"
          x2="36"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Outer dashed ring — sense of orbit / orbit */}
      <circle
        cx="18"
        cy="18"
        r="16.5"
        stroke="url(#sigil-gold)"
        strokeWidth="0.55"
        strokeDasharray="2.2 3.2"
        opacity="0.5"
      />

      {/* Inner precision ring */}
      <circle
        cx="18"
        cy="18"
        r="8"
        stroke="url(#sigil-gold)"
        strokeWidth="0.7"
        opacity="0.75"
      />

      {/* Cardinal spokes — N S E W */}
      <line x1="18" y1="1.5" x2="18" y2="10" stroke="url(#sigil-gold)" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="18" y1="26" x2="18" y2="34.5" stroke="url(#sigil-gold)" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="1.5" y1="18" x2="10" y2="18" stroke="url(#sigil-gold)" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="26" y1="18" x2="34.5" y2="18" stroke="url(#sigil-gold)" strokeWidth="0.9" strokeLinecap="round" />

      {/* Diagonal spokes — 45° — softer weight */}
      <line x1="6.5"  y1="6.5"  x2="12.3" y2="12.3" stroke="url(#sigil-gold)" strokeWidth="0.55" strokeLinecap="round" opacity="0.65" />
      <line x1="23.7" y1="23.7" x2="29.5" y2="29.5" stroke="url(#sigil-gold)" strokeWidth="0.55" strokeLinecap="round" opacity="0.65" />
      <line x1="29.5" y1="6.5"  x2="23.7" y2="12.3" stroke="url(#sigil-gold)" strokeWidth="0.55" strokeLinecap="round" opacity="0.65" />
      <line x1="12.3" y1="23.7" x2="6.5"  y2="29.5" stroke="url(#sigil-gold)" strokeWidth="0.55" strokeLinecap="round" opacity="0.65" />

      {/* Center — bright core */}
      <circle cx="18" cy="18" r="2.6" fill="url(#sigil-gold)" />
      <circle cx="18" cy="18" r="1.1" fill="#FEF08A" opacity="0.9" />
    </svg>
  );
}

interface CompanionCardProps {
  className?: string;
}

export function CompanionCard({ className = '' }: CompanionCardProps) {
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 4.8,
        repeat: Infinity,
        ease: 'easeInOut',
        repeatType: 'mirror',
      }}
      className={`relative overflow-hidden rounded-2xl border border-yellow-500/[0.18] bg-[#0c0c0e]/90 px-4 py-3.5
        shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_48px_rgba(0,0,0,0.55),0_0_36px_rgba(234,179,8,0.07)]
        backdrop-blur-2xl ${className}`}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-yellow-500/[0.12] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-5 -left-4 h-20 w-20 rounded-full bg-red-500/[0.10] blur-xl" />

      {/* Luminous top border */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/55 to-transparent" />

      {/* Main row */}
      <div className="relative flex items-center gap-3">
        {/* Sigil container */}
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl
          border border-yellow-500/[0.18] bg-gradient-to-br from-yellow-500/[0.09] to-yellow-900/[0.05]">
          <LucianSigil size={26} />
          {/* Inner ambient */}
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-yellow-500/[0.04]" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold tracking-[0.01em] text-[#FAF0E6]">
              Lucian
            </span>
            {/* Active pill */}
            <span className="inline-flex items-center gap-[3px] rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-1.5 py-[2px] text-[9px] font-semibold uppercase tracking-widest text-emerald-400">
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <p className="mt-[3px] text-[11px] leading-none text-zinc-500">
            Terminal Companion
          </p>
        </div>
      </div>

      {/* Status insight */}
      <div className="relative mt-3 border-t border-white/[0.05] pt-3">
        <p className="text-[11px] leading-snug text-zinc-500">
          Mit dir im Terminal ·{' '}
          <span className="font-medium text-zinc-300">Nächste Mission: Übungsblatt 9</span>
        </p>
      </div>
    </motion.div>
  );
}
