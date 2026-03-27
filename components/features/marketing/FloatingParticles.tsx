'use client';

/**
 * FloatingParticles — Pure CSS floating dots. Zero JavaScript, zero Canvas.
 *
 * 12 tiny gold dots with CSS keyframe animations.
 * GPU-composited via translate3d, no repaints.
 */

const DOTS = [
  { x: '12%', y: '18%', size: 2, duration: 28, delay: 0, opacity: 0.25 },
  { x: '85%', y: '25%', size: 1.5, duration: 32, delay: 4, opacity: 0.2 },
  { x: '45%', y: '72%', size: 2.5, duration: 26, delay: 2, opacity: 0.15 },
  { x: '72%', y: '55%', size: 1, duration: 35, delay: 6, opacity: 0.3 },
  { x: '28%', y: '42%', size: 2, duration: 30, delay: 1, opacity: 0.2 },
  { x: '92%', y: '68%', size: 1.5, duration: 24, delay: 5, opacity: 0.25 },
  { x: '8%', y: '82%', size: 2, duration: 33, delay: 3, opacity: 0.15 },
  { x: '55%', y: '15%', size: 1, duration: 29, delay: 7, opacity: 0.2 },
  { x: '35%', y: '88%', size: 2, duration: 27, delay: 2, opacity: 0.18 },
  { x: '68%', y: '35%', size: 1.5, duration: 31, delay: 4, opacity: 0.22 },
  { x: '18%', y: '58%', size: 1, duration: 34, delay: 6, opacity: 0.15 },
  { x: '78%', y: '82%', size: 2, duration: 28, delay: 1, opacity: 0.2 },
];

export function FloatingParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[41]" aria-hidden="true">
      {DOTS.map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            backgroundColor: `rgba(232,185,48,${dot.opacity})`,
            animation: `floatDot ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
