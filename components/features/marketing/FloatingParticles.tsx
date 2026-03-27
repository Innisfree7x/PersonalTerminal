'use client';

import { useEffect, useRef } from 'react';

/**
 * FloatingParticles — Subtle drifting gold particles on canvas.
 *
 * Performance-optimized: DPR capped at 1, pauses when tab is hidden,
 * reduced particle count. Throttled to ~30fps to save battery.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  opacitySpeed: number;
}

const PARTICLE_COUNT = 25;

export function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cap DPR at 1 — particles are tiny, no need for Retina resolution
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Pause when tab hidden
    let paused = false;
    const onVisibility = () => { paused = document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);

    const w = window.innerWidth;
    const h = window.innerHeight;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.15 - 0.03,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4,
      opacitySpeed: (Math.random() * 0.002 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
    }));

    const draw = (now: number) => {
      animRef.current = requestAnimationFrame(draw);

      if (paused) return;

      // Throttle to ~30fps
      if (now - lastFrameRef.current < 33) return;
      lastFrameRef.current = now;

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacitySpeed;

        if (p.opacity > 0.5 || p.opacity < 0) {
          p.opacitySpeed *= -1;
          p.opacity = Math.max(0, Math.min(0.5, p.opacity));
        }

        if (p.y < -10) p.y = ch + 10;
        if (p.x < -10) p.x = cw + 10;
        if (p.x > cw + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,185,48,${p.opacity})`;
        ctx.fill();
      }
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[41]"
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  );
}
