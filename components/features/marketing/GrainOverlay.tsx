'use client';

/**
 * GrainOverlay — Lightweight CSS-only noise texture.
 *
 * Uses a tiny repeating background pattern instead of SVG feTurbulence
 * which was causing extreme GPU load on full-screen elements.
 */
export function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.04]"
      style={{
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '180px 180px',
      }}
      aria-hidden="true"
    />
  );
}
