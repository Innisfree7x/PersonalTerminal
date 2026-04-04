'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { RoomState, ActiveRoomItems } from '@/lib/room/roomState';
import type { LucianOutfit } from '@/lib/lucian/outfits';
import RoomHotspot from './RoomHotspot';
import RoomLucian from './RoomLucian';
import StreakFlame from './StreakFlame';

interface LucianRoomProps {
  state: RoomState;
  className?: string | undefined;
  onLucianClick?: (() => void) | undefined;
  lucianOutfit?: LucianOutfit | undefined;
  roomItems?: ActiveRoomItems | undefined;
}

const WINDOW_GRADIENTS: Record<RoomState['windowGlow'], [string, string]> = {
  dawn: ['#3d1f00', '#7a3f10'],
  day: ['#0a1520', '#1a3a5c'],
  dusk: ['#1a0a1a', '#4a1a3a'],
  night: ['#050508', '#050508'],
};

const BOOK_COLORS = ['#7c3aed', '#1d4ed8', '#047857', '#b45309', '#9f1239'];
const BOOK_HEIGHTS = [50, 45, 52, 48, 55];

const LIGHT_RADII = [0, 150, 200, 250, 300, 350] as const;
const LIGHT_OPACITIES = [0, 0.03, 0.05, 0.07, 0.09, 0.12] as const;

function WindowLayer({ glow }: { glow: RoomState['windowGlow'] }) {
  const reduced = useReducedMotion();
  const [c1, c2] = WINDOW_GRADIENTS[glow];
  const showStars = glow === 'night' || glow === 'dawn';

  return (
    <g>
      <rect x={60} y={40} width={160} height={130} rx={4} fill="#0a0a12" stroke="#282837" strokeWidth={1.5} />
      <defs>
        <linearGradient id="window-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      {reduced ? (
        <rect x={68} y={48} width={144} height={114} rx={2} fill="url(#window-glass)" />
      ) : (
        <motion.rect
          x={68} y={48} width={144} height={114} rx={2}
          fill="url(#window-glass)"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <line x1={140} y1={48} x2={140} y2={162} stroke="#282837" strokeWidth={1} />
      <line x1={68} y1={105} x2={212} y2={105} stroke="#282837" strokeWidth={1} />
      {showStars && (
        <>
          <circle cx={90} cy={65} r={1.2} fill="white" opacity={0.6} />
          <circle cx={175} cy={80} r={1} fill="white" opacity={0.4} />
          <circle cx={120} cy={140} r={0.8} fill="white" opacity={0.3} />
        </>
      )}
    </g>
  );
}

function ShelfLayer({ bookCount }: { bookCount: number }) {
  return (
    <g>
      <rect x={678} y={80} width={10} height={92} fill="#282830" />
      <rect x={856} y={80} width={10} height={92} fill="#282830" />
      <rect x={680} y={80} width={180} height={12} rx={2} fill="#1e1520" />
      <rect x={680} y={160} width={180} height={12} rx={2} fill="#1e1520" />
      {Array.from({ length: bookCount }).map((_, i) => {
        const h = BOOK_HEIGHTS[i % 5] ?? 50;
        return (
          <rect
            key={i}
            x={690 + i * 28}
            y={80 - h}
            width={20}
            height={h}
            rx={2}
            fill={BOOK_COLORS[i % 5]}
            opacity={0.85}
          />
        );
      })}
    </g>
  );
}

function DeskLayer() {
  const reduced = useReducedMotion();

  return (
    <g>
      <rect x={350} y={260} width={300} height={16} rx={3} fill="#1a1020" stroke="#282837" strokeWidth={0.5} />
      <rect x={365} y={276} width={12} height={44} fill="#14101a" />
      <rect x={625} y={276} width={12} height={44} fill="#14101a" />

      {/* Monitor */}
      <rect x={470} y={190} width={120} height={75} rx={4} fill="#0d0d14" stroke="rgba(40,40,55,0.8)" strokeWidth={1} />
      <rect x={522} y={265} width={16} height={12} fill="#1a1a24" />
      <rect x={512} y={276} width={36} height={6} rx={2} fill="#282837" />
      {reduced ? (
        <rect x={476} y={196} width={108} height={63} rx={2} fill="#080810" />
      ) : (
        <motion.rect
          x={476} y={196} width={108} height={63} rx={2} fill="#080810"
          animate={{ opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
        />
      )}
      {/* Code lines */}
      <rect x={482} y={206} width={48} height={3} rx={1} fill="rgba(234,179,8,0.15)" />
      <rect x={482} y={215} width={72} height={3} rx={1} fill="rgba(100,103,135,0.2)" />
      <rect x={482} y={224} width={56} height={3} rx={1} fill="rgba(234,179,8,0.15)" />
      <rect x={482} y={233} width={38} height={3} rx={1} fill="rgba(100,103,135,0.2)" />

      {/* Coffee mug */}
      <ellipse cx={430} cy={258} rx={14} ry={8} fill="#1a1a24" stroke="#282837" strokeWidth={0.5} />
      <path d="M444 254 C450 254, 450 262, 444 262" fill="none" stroke="#282837" strokeWidth={1} />

      {/* Steam */}
      {!reduced && (
        <>
          <motion.path
            d="M426 248 C426 244, 430 244, 430 248"
            fill="none" stroke="rgba(100,103,135,0.4)" strokeWidth={0.8}
            animate={{ opacity: [0.2, 0.5, 0.2], y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M432 248 C432 244, 436 244, 436 248"
            fill="none" stroke="rgba(100,103,135,0.3)" strokeWidth={0.8}
            animate={{ opacity: [0.15, 0.4, 0.15], y: [0, -3, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Notebook */}
      <rect x={385} y={249} width={30} height={22} rx={2} fill="#1e1428" stroke="rgba(61,42,92,0.6)" strokeWidth={0.5} />
      <rect x={390} y={253} width={20} height={1} fill="rgba(61,42,92,0.4)" />
      <rect x={390} y={258} width={20} height={1} fill="rgba(61,42,92,0.4)" />
      <rect x={390} y={263} width={20} height={1} fill="rgba(61,42,92,0.4)" />
    </g>
  );
}

function PlantLayer({ stage }: { stage: RoomState['plantStage'] }) {
  const reduced = useReducedMotion();
  const shouldAnimate = !reduced && stage > 0;

  const inner = (
    <>
      {/* Pot */}
      <rect x={620} y={245} width={28} height={18} rx={3} fill="#2a1a10" stroke="#3a2a18" strokeWidth={0.5} />
      <rect x={622} y={244} width={24} height={4} rx={1} fill="#1a1008" />

      {stage >= 1 && (
        <>
          <ellipse cx={630} cy={238} rx={5} ry={10} fill="rgba(20,83,45,0.8)" transform="rotate(-15,630,238)" />
          <ellipse cx={638} cy={236} rx={4} ry={9} fill="rgba(20,83,45,0.7)" transform="rotate(10,638,236)" />
        </>
      )}
      {stage >= 2 && (
        <>
          <ellipse cx={626} cy={232} rx={5} ry={11} fill="rgba(21,128,61,0.75)" transform="rotate(-30,626,232)" />
          <ellipse cx={642} cy={230} rx={4.5} ry={10} fill="rgba(21,128,61,0.7)" transform="rotate(25,642,230)" />
          <ellipse cx={634} cy={228} rx={4} ry={9} fill="rgba(20,83,45,0.65)" transform="rotate(5,634,228)" />
        </>
      )}
      {stage >= 3 && (
        <>
          <ellipse cx={622} cy={226} rx={5.5} ry={12} fill="#15803d" transform="rotate(-40,622,226)" />
          <ellipse cx={646} cy={224} rx={5} ry={11} fill="#15803d" transform="rotate(35,646,224)" />
        </>
      )}
    </>
  );

  if (shouldAnimate) {
    return (
      <motion.g
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '634px 245px' }}
      >
        {inner}
      </motion.g>
    );
  }

  return <g>{inner}</g>;
}

export default function LucianRoom({ state, className, onLucianClick, lucianOutfit, roomItems }: LucianRoomProps) {
  const reduced = useReducedMotion();
  const effectiveBookCount = roomItems?.hasFullBookshelf ? 5 : state.bookCount;
  const effectivePlantStage = roomItems?.hasDeskPlantLarge ? 3 : state.plantStage;

  const svgContent = (
    <>
      {/* Layer 1 — Background wall (uses CSS var from room style picker) */}
      <rect x={0} y={0} width={900} height={420} fill="var(--room-wall, #0f0f18)" />
      <line x1={0} y1={300} x2={900} y2={300} stroke="#282837" strokeWidth={0.5} />

      {/* Layer 2 — Window */}
      <WindowLayer glow={state.windowGlow} />

      {/* Layer 3 — Shelf */}
      <ShelfLayer bookCount={effectiveBookCount} />
      {/* Full bookshelf bonus: lying books on shelf 2 */}
      {roomItems?.hasFullBookshelf && (
        <g>
          <rect x={695} y={155} width={35} height={8} rx={1} fill="#2a1a10" />
          <rect x={735} y={153} width={30} height={8} rx={1} fill="#1e1428" />
          <rect x={770} y={155} width={28} height={8} rx={1} fill="#1a2a18" />
        </g>
      )}

      {/* Layer 4 — Desk + objects */}
      <DeskLayer />

      {/* Layer 5 — Plant */}
      <PlantLayer stage={effectivePlantStage} />
      {/* Desk plant large bonus: small second plant on desk */}
      {roomItems?.hasDeskPlantLarge && (
        <g>
          <rect x={355} y={252} width={18} height={12} rx={2} fill="#2a1a10" />
          <ellipse cx={361} cy={244} rx={3} ry={6} fill="rgba(21,128,61,0.8)" transform="rotate(-10,361,244)" />
          <ellipse cx={367} cy={244} rx={3} ry={6} fill="rgba(21,128,61,0.8)" transform="rotate(15,367,244)" />
        </g>
      )}

      {/* Legendary flame stand */}
      {roomItems?.hasLegendaryFlameStand && (
        <g>
          <rect x={414} y={276} width={32} height={6} rx={2} fill="#1a1020" stroke="rgba(234,179,8,0.3)" strokeWidth={0.5} />
          <circle cx={430} cy={246} r={18} fill="none" stroke="rgba(234,179,8,0.12)" strokeWidth={12} />
        </g>
      )}

      {/* Layer 7 — Streak flame */}
      <foreignObject x={418} y={210} width={24} height={72} overflow="visible">
        <StreakFlame level={state.streakFlameLevel} />
      </foreignObject>

      {/* Layer 8 — Floor (uses CSS var from room style picker) */}
      <rect x={0} y={300} width={900} height={120} fill="var(--room-floor, #0b0b14)" />
      <ellipse cx={500} cy={320} rx={130} ry={12} fill="rgba(0,0,0,0.3)" />

      {/* Layer 9 — Light overlay */}
      {state.lightLevel > 0 && (
        <circle
          cx={500}
          cy={240}
          r={LIGHT_RADII[state.lightLevel]}
          fill={`rgba(234,179,8,${LIGHT_OPACITIES[state.lightLevel]})`}
        />
      )}

      {/* Layer 10 — Lucian */}
      <foreignObject x={460} y={175} width={80} height={80}>
        <RoomLucian pose={state.lucianPose} size={80} outfit={lucianOutfit} />
      </foreignObject>

      {/* Layer 11 — Hotspots */}
      <RoomHotspot x={680} y={30} width={180} height={145} label="Kurse öffnen" href="/uni/courses" />
      <RoomHotspot x={470} y={190} width={120} height={75} label="Tasks ansehen" href="/workspace/tasks" />
      <RoomHotspot x={60} y={40} width={160} height={130} label="Analytics" href="/reflect/analytics" />
      {onLucianClick && (
        <RoomHotspot x={460} y={175} width={80} height={80} label="Lucian" onClick={onLucianClick} />
      )}
    </>
  );

  if (reduced) {
    return (
      <svg
        viewBox="0 0 900 420"
        className={className}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Lucians Raum"
      >
        {svgContent}
      </svg>
    );
  }

  return (
    <motion.svg
      viewBox="0 0 900 420"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      role="img"
      aria-label="Lucians Raum"
    >
      {svgContent}
    </motion.svg>
  );
}
