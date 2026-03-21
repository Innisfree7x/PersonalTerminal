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
      className={`terminal-frame group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113] shadow-[0_32px_100px_rgba(0,0,0,0.7)] ${className}`}
    >
      {/* Gold glow on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" style={{ background: 'linear-gradient(180deg, rgba(232,185,48,0.06) 0%, transparent 40%)' }} />

      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#0D0D0F] px-4 py-3">
        {/* Traffic lights */}
        <div className="flex gap-[7px]">
          <div className="h-[11px] w-[11px] rounded-full bg-[#FF5F57]" />
          <div className="h-[11px] w-[11px] rounded-full bg-[#FEBC2E]" />
          <div className="h-[11px] w-[11px] rounded-full bg-[#28C840]" />
        </div>

        {/* URL bar */}
        <div className="flex-1">
          <div className="mx-auto w-fit rounded-md bg-white/[0.04] px-4 py-1">
            <span className="text-[11px] text-zinc-500">{url}</span>
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
