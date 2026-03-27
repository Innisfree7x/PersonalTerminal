'use client';

/**
 * GrainOverlay — Ultra-lightweight noise texture.
 *
 * Static CSS background-image with repeating-conic-gradient pattern.
 * No SVG filters, no canvas, no external assets. Pure CSS.
 */
export function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035]"
      style={{
        mixBlendMode: 'overlay',
        backgroundImage:
          'repeating-conic-gradient(rgba(255,255,255,0.06) 0% 25%, transparent 0% 50%)',
        backgroundSize: '3px 3px',
      }}
      aria-hidden="true"
    />
  );
}
