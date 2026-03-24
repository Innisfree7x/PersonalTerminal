'use client';

import { motion, type MotionStyle } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * TerminalFrame — Premium browser chrome wrapper for feature mockups.
 *
 * Renders a realistic macOS-style window frame with traffic lights,
 * URL bar, and a subtle gold glow. Content is passed as children.
 */
interface TerminalFrameProps {
  url: string;
  children: ReactNode;
  className?: string;
  style?: MotionStyle | undefined;
}

export function TerminalFrame({ url, children, className = '', style }: TerminalFrameProps) {
  return (
    <motion.div
      {...(style ? { style } : {})}
      className={`terminal-frame group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0e14] shadow-[0_32px_100px_rgba(0,0,0,0.7)] ${className}`}
    >
      {/* Gold glow on hover — enhanced */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(180deg, rgba(232,185,48,0.08) 0%, transparent 40%)',
          boxShadow: '0 0 40px rgba(232,185,48,0.06)',
        }}
      />

      {/* Top highlight line */}
      <div className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-[1px] bg-gradient-to-r from-transparent via-[#E8B930]/20 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#0b0a12] px-4 py-3">
        {/* Traffic lights */}
        <div className="flex gap-[7px]">
          <div className="h-[11px] w-[11px] rounded-full bg-[#FF5F57] transition-transform duration-200 group-hover:scale-110" />
          <div className="h-[11px] w-[11px] rounded-full bg-[#FEBC2E] transition-transform duration-200 group-hover:scale-110" />
          <div className="h-[11px] w-[11px] rounded-full bg-[#28C840] transition-transform duration-200 group-hover:scale-110" />
        </div>

        {/* URL bar */}
        <div className="flex-1">
          <div className="mx-auto w-fit rounded-md bg-white/[0.04] px-4 py-1">
            <div className="flex items-center gap-1.5">
              <svg className="h-2.5 w-2.5 text-emerald-500/60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              <span className="text-[11px] text-zinc-500">{url}</span>
            </div>
          </div>
        </div>

        {/* Spacer for symmetry */}
        <div className="w-[52px]" />
      </div>

      {/* Content area */}
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}
