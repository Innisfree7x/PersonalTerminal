'use client';

import { useEffect, useRef } from 'react';

/**
 * FloatingParticles — Subtle drifting gold particles on canvas.
 *
 * Lightweight: ~40 particles, requestAnimationFrame driven.
 * Fades in after mount to avoid flash. Pauses when tab is hidden.
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

const PARTICLE_COUNT = 40;
const GOLD_R = 232;
const GOLD_G = 185;
const GOLD_B = 48;

export function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Init particles
    const w = window.innerWidth;
    const h = window.innerHeight;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.2 - 0.05,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5,
      opacitySpeed: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
    }));

    const draw = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      ctx.clearRect(0, 0, cw, ch);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacitySpeed;

        // Bounce opacity
        if (p.opacity > 0.6 || p.opacity < 0) {
          p.opacitySpeed *= -1;
          p.opacity = Math.max(0, Math.min(0.6, p.opacity));
        }

        // Wrap around
        if (p.y < -10) p.y = ch + 10;
        if (p.x < -10) p.x = cw + 10;
        if (p.x > cw + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GOLD_R},${GOLD_G},${GOLD_B},${p.opacity})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[41]"
      style={{ opacity: 0.7 }}
      aria-hidden="true"
    />
  );
}
