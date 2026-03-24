'use client';

/**
 * GrainOverlay — Subtle film-grain texture over the marketing background.
 *
 * Uses a tiny inline SVG noise filter for a tactile, premium feel.
 * No canvas, no external assets — pure CSS + SVG filter.
 */
export function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035]"
      style={{ mixBlendMode: 'overlay' }}
    >
      <svg className="hidden">
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        className="h-full w-full"
        style={{ filter: 'url(#grain-filter)' }}
      />
    </div>
  );
}
