'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { TerminalFrame } from './TerminalFrame';
import { TrajectoryMockup } from './mockups/TrajectoryMockup';

/**
 * ProblemStrip — "The Collision" section with Trajectory terminal.
 *
 * Left: Typography revealing the problem.
 * Right: Terminal showing the actual Trajectory dashboard with collision zone.
 */
export function ProblemStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const textOpacity = useTransform(scrollYProgress, [0.1, 0.25, 0.7, 0.85], [0, 1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0.1, 0.25], [50, 0]);
  const terminalOpacity = useTransform(scrollYProgress, [0.15, 0.35, 0.7, 0.85], [0, 1, 1, 0]);
  const terminalY = useTransform(scrollYProgress, [0.15, 0.35], [80, 0]);
  const terminalRotateY = useTransform(scrollYProgress, [0.15, 0.4], [8, 0]);

  return (
    <section ref={ref} className="relative min-h-[150vh] py-32">
      <div className="sticky top-0 flex min-h-screen items-center">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            {/* Text side */}
            <motion.div style={{ opacity: textOpacity, y: textY }}>
              <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-[#E8B930]">
                Trajectory
              </p>
              <h2 className="premium-heading text-[clamp(1.8rem,4vw,3.2rem)] font-semibold text-white">
                Drei Ziele.
                <br />
                Zwei kollidieren.
                <br />
                <span className="bg-gradient-to-r from-[#E8B930] via-[#F5D565] to-[#E8B930] bg-clip-text text-transparent">
                  Du siehst es sofort.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-[1.8] text-zinc-500">
                Backward Planning berechnet Startfenster, Buffer und Risiko für jedes Ziel.
                Wenn sich zwei Prep-Blöcke überlappen, zeigt INNIS die Kollision — nicht erst die verpasste Deadline.
              </p>
            </motion.div>

            {/* Terminal */}
            <TerminalFrame
              url="innis.io/trajectory"
              style={{
                opacity: terminalOpacity,
                y: terminalY,
                rotateY: terminalRotateY,
                perspective: 1200,
              }}
            >
              <TrajectoryMockup />
            </TerminalFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
