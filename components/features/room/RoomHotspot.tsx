'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';

interface RoomHotspotProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  href?: string;
  onClick?: () => void;
}

export default function RoomHotspot({
  x,
  y,
  width,
  height,
  label,
  href,
  onClick,
}: RoomHotspotProps) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="cursor-pointer"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        stroke={hovered ? 'rgba(255,255,255,0.15)' : 'transparent'}
        strokeWidth={1}
        rx={4}
      />
      {hovered && (
        <>
          {prefersReduced ? (
            <g>
              <rect
                x={x + width / 2 - Math.max(label.length * 7.5 + 20, 80) / 2}
                y={y - 26}
                width={Math.max(label.length * 7.5 + 20, 80)}
                height={22}
                rx={6}
                fill="rgba(20,20,28,0.92)"
                stroke="rgba(40,40,55,0.7)"
                strokeWidth={0.5}
              />
              <text
                x={x + width / 2}
                y={y - 12}
                textAnchor="middle"
                fill="#a0a3bd"
                fontSize={11}
                fontFamily="var(--font-inter), sans-serif"
              >
                {label}
              </text>
            </g>
          ) : (
            <motion.g
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <rect
                x={x + width / 2 - Math.max(label.length * 7.5 + 20, 80) / 2}
                y={y - 26}
                width={Math.max(label.length * 7.5 + 20, 80)}
                height={22}
                rx={6}
                fill="rgba(20,20,28,0.92)"
                stroke="rgba(40,40,55,0.7)"
                strokeWidth={0.5}
              />
              <text
                x={x + width / 2}
                y={y - 12}
                textAnchor="middle"
                fill="#a0a3bd"
                fontSize={11}
                fontFamily="var(--font-inter), sans-serif"
              >
                {label}
              </text>
            </motion.g>
          )}
        </>
      )}
    </g>
  );
}
