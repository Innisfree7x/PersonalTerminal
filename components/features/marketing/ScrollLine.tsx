'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * ScrollLine — A single trajectory line that runs through the entire landing page.
 *
 * Inspired by PRISMA's scroll-driven storytelling. The line represents the user's
 * career trajectory — starting thin and uncertain, gaining confidence, hitting
 * inflection points, and arriving at clarity.
 *
 * Uses Framer Motion's useScroll + SVG pathLength for buttery smooth animation.
 */
export function ScrollLine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Line draws as you scroll
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  // Glow intensifies at key moments
  const glowOpacity = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.3, 0.6, 0.4, 0.8, 1]);

  return (
    <div ref={containerRef} className="scroll-line-container">
      <svg
        className="scroll-line-svg"
        viewBox="0 0 100 6000"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          {/* Gold gradient for key moments */}
          <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="15%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="35%" stopColor="#E8B930" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="70%" stopColor="#E8B930" />
            <stop offset="85%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="#E8B930" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="line-glow" x="-50%" y="-2%" width="200%" height="104%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* Glow layer (behind) */}
        <motion.path
          d={TRAJECTORY_PATH}
          stroke="url(#line-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#line-glow)"
          style={{
            pathLength,
            opacity: glowOpacity,
          }}
        />

        {/* Main line */}
        <motion.path
          d={TRAJECTORY_PATH}
          stroke="url(#line-gradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ pathLength }}
        />
      </svg>
    </div>
  );
}

/**
 * The trajectory path — flows through the page with natural curves.
 *
 * Coordinates in a 100x6000 viewBox:
 * - x: 0-100 (left to right)
 * - y: 0-6000 (top to bottom, matching page scroll)
 *
 * Key inflection points align with section transitions:
 * - y=0-600: Hero entry (line starts center, moves right)
 * - y=600-1500: Problem section (line dips, showing "the struggle")
 * - y=1500-2800: Features (line ascends with confident curves)
 * - y=2800-4200: Proof (line stabilizes, gold moments)
 * - y=4200-5200: Trajectory demo (line sweeps across)
 * - y=5200-6000: CTA (line arrives at destination)
 */
const TRAJECTORY_PATH = [
  'M 50 0',
  // Hero: gentle start, line emerges
  'C 50 100, 55 200, 58 400',
  'C 61 600, 65 700, 60 900',
  // Problem: the dip — things get uncertain
  'C 55 1100, 35 1200, 30 1400',
  'C 25 1600, 28 1700, 35 1800',
  // Recovery: line finds direction
  'C 42 1900, 55 2000, 60 2200',
  // Features: confident ascending curves
  'C 65 2400, 70 2600, 68 2800',
  'C 66 3000, 60 3100, 55 3200',
  // Proof: stabilization with gold moments
  'C 50 3400, 48 3600, 50 3800',
  'C 52 4000, 58 4100, 62 4200',
  // Trajectory demo: sweeping across
  'C 66 4400, 72 4600, 68 4800',
  'C 64 5000, 55 5100, 50 5200',
  // CTA: line arrives with certainty
  'C 45 5400, 48 5600, 50 5800',
  'L 50 6000',
].join(' ');
