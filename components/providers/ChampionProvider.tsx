'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { isTypingTarget } from '@/lib/hotkeys/guards';
import { dispatchChampionEvent, subscribeChampionEvent, type ChampionEvent } from '@/lib/champion/championEvents';
import { CHAMPION_CONFIG } from '@/lib/champion/config';
import { CHAMPION_VFX_CONFIG } from '@/lib/champion/vfxConfig';
import {
  DEFAULT_CHAMPION_SETTINGS,
  sanitizeChampionSettings,
  type ChampionScale,
  type ChampionSettings,
} from '@/lib/champion/settings';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { trackAppEvent } from '@/lib/analytics/client';
import { LEGACY_STORAGE_KEYS, readStorageValueWithLegacy, STORAGE_KEYS } from '@/lib/storage/keys';

type ChampionMode = 'passive' | 'active';
type ChampionAnimation =
  | 'idle'
  | 'walk'
  | 'cast_q'
  | 'cast_w'
  | 'cast_e'
  | 'cast_r'
  | 'victory'
  | 'panic'
  | 'meditate'
  | 'recall';

type AbilityKey = 'q' | 'w' | 'e' | 'r';

interface ChampionStats {
  level: number;
  xp: number;
  nextLevelXp: number;
}

interface ChampionContextValue {
  settings: ChampionSettings;
  updateSettings: (next: Partial<ChampionSettings>) => void;
  resetPosition: () => void;
  restoreDefaults: () => void;
  stats: ChampionStats;
  mode: ChampionMode;
}

interface Position {
  x: number;
  y: number;
}

interface EffectState {
  id: string;
  type:
    | 'q'
    | 'q-arc'
    | 'q-spark'
    | 'q-flare'
    | 'w'
    | 'w-bolt'
    | 'w-mark'
    | 'w-shockwave'
    | 'e'
    | 'e-streak'
    | 'dash-ghost'
    | 'r'
    | 'r-lane'
    | 'r-bullet'
    | 'r-muzzle'
    | 'pentakill'
    | 'origin-flash'
    | 'landing-ring'
    | 'screen-flash'
    | 'q-spark'
    | 'move';
  x: number;
  y: number;
  angle?: number;
  distance?: number;
  size?: number;
  tone?: string;
}

const SETTINGS_KEY = STORAGE_KEYS.championSettings;
const STATS_KEY = STORAGE_KEYS.championStats;
const POSITION_KEY = STORAGE_KEYS.championPosition;
const BASE_SPEED = 200;
const SCALE_TO_SIZE: Record<ChampionScale, number> = {
  small: 132,
  normal: 172,
  large: 212,
};

const ABILITY_COOLDOWNS: Record<AbilityKey, number> = CHAMPION_VFX_CONFIG.abilityCooldownSeconds;
const ABILITY_CAST_ANIMATION: Record<AbilityKey, ChampionAnimation> = CHAMPION_VFX_CONFIG.castAnimations;
const ABILITY_ANIMATION_LOCK_MS: Record<AbilityKey, number> = CHAMPION_VFX_CONFIG.castAnimationLockMs;
const REACTION_ANIMATION_DURATION_MS = CHAMPION_VFX_CONFIG.reactionAnimationDurationMs;
const MOVE_COMMAND_COLOR = '#22C55E';
const INITIAL_POSITION: Position = { x: 120, y: 120 };

const DEFAULT_SETTINGS = DEFAULT_CHAMPION_SETTINGS;

const XP_FOR_ACTION: Record<string, number> = {
  TASK_COMPLETED: 10,
  GOAL_CREATED: 25,
  EXERCISE_COMPLETED: 15,
  APPLICATION_SENT: 30,
  FOCUS_END: 50,
  DONE_FOR_TODAY: 35,
};

const ChampionContext = createContext<ChampionContextValue | undefined>(undefined);

function levelFromXp(xp: number): ChampionStats {
  const normalizedXp = Math.max(0, Math.floor(xp));
  const level = Math.floor(Math.sqrt(normalizedXp / 45)) + 1;
  const nextLevelXp = Math.pow(level, 2) * 45;
  return {
    level,
    xp: normalizedXp,
    nextLevelXp,
  };
}

function cleanupInteractiveAttrs() {
  if (typeof document === 'undefined') return;
  const elements = document.querySelectorAll<HTMLElement>('[data-interactive]');
  elements.forEach((element) => {
    element.removeAttribute('data-champion-in-range');
    element.removeAttribute('data-champion-targeted');
    element.removeAttribute('data-champion-focus');
    element.removeAttribute('data-champion-dimmed');
  });
}

function nearestViewportPosition(): Position {
  if (typeof window === 'undefined') return { x: 120, y: 120 };
  return { x: 120, y: window.innerHeight - 220 };
}

function clampToViewport(pos: Position, size: number): Position {
  if (typeof window === 'undefined') return pos;
  const pad = 8;
  return {
    x: Math.max(pad, Math.min(window.innerWidth - size - pad, pos.x)),
    y: Math.max(60, Math.min(window.innerHeight - size - pad, pos.y)),
  };
}

function getPointerPosition(event: MouseEvent): Position {
  return { x: event.clientX, y: event.clientY };
}

function animationRow(animation: ChampionAnimation): number {
  switch (animation) {
    case 'idle': return 0;
    case 'walk': return 1;
    case 'cast_q': return 2;
    case 'cast_w': return 3;
    case 'cast_e': return 4;
    case 'cast_r': return 5;
    case 'victory': return 6;
    case 'panic': return 7;
    case 'meditate': return 8;
    case 'recall': return 9;
    default: return 0;
  }
}

function frameCount(animation: ChampionAnimation): number {
  switch (animation) {
    case 'walk': return 6;
    case 'cast_w': return 3;
    case 'cast_r': return 8;
    case 'victory':
    case 'recall': return 6;
    default: return 4;
  }
}

function frameDuration(animation: ChampionAnimation): number {
  switch (animation) {
    case 'walk': return 100;
    case 'cast_q':
    case 'cast_e':
    case 'cast_r': return 80;
    case 'cast_w': return 100;
    case 'victory': return 150;
    case 'panic': return 150;
    case 'meditate': return 200;
    case 'recall': return 150;
    default: return 200;
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const safe = hex.replace('#', '');
  const normalized = safe.length === 3
    ? safe.split('').map((ch) => ch + ch).join('')
    : safe;
  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useChampion(): ChampionContextValue {
  const context = useContext(ChampionContext);
  const [fallbackSettings, setFallbackSettings] = useState<ChampionSettings>(DEFAULT_SETTINGS);
  const [fallbackStats, setFallbackStats] = useState<ChampionStats>(() => levelFromXp(0));

  useEffect(() => {
    if (context) return;
    try {
      const rawSettings = localStorage.getItem(SETTINGS_KEY);
      if (rawSettings) setFallbackSettings(sanitizeChampionSettings(JSON.parse(rawSettings)));
      const rawStats = localStorage.getItem(STATS_KEY);
      if (rawStats) {
        const parsed = JSON.parse(rawStats) as { xp?: number };
        if (typeof parsed.xp === 'number') setFallbackStats(levelFromXp(parsed.xp));
      }
    } catch {
      // ignore
    }
  }, [context]);

  const fallbackUpdate = useCallback((next: Partial<ChampionSettings>) => {
    setFallbackSettings((prev) => {
      const merged = sanitizeChampionSettings({ ...prev, ...next });
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  }, []);

  const fallbackRestore = useCallback(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // ignore
    }
    setFallbackSettings(DEFAULT_SETTINGS);
  }, []);

  if (context) return context;

  return {
    settings: fallbackSettings,
    updateSettings: fallbackUpdate,
    resetPosition: () => {},
    restoreDefaults: fallbackRestore,
    stats: fallbackStats,
    mode: 'passive',
  };
}

function ChampionOverlay({
  enabled,
  mode,
  settings,
  stats,
  position,
  direction,
  animation,
  frame,
  effects,
  cooldowns,
  rangeActive,
  onChampionClick,
}: {
  enabled: boolean;
  mode: ChampionMode;
  settings: ChampionSettings;
  stats: ChampionStats;
  position: Position;
  direction: 'left' | 'right';
  animation: ChampionAnimation;
  frame: number;
  effects: EffectState[];
  cooldowns: Record<AbilityKey, number>;
  rangeActive: boolean;
  onChampionClick: () => void;
}) {
  if (!enabled) return null;

  const championSize = SCALE_TO_SIZE[settings.renderScale];
  const championConfig = CHAMPION_CONFIG[settings.champion];
  const spriteRow = animationRow(animation);
  // Guard against transient out-of-range frames when animations switch rows
  // (e.g. walk -> cast_w with fewer frames), which otherwise causes a brief blank sprite.
  const activeFrame = frame % Math.max(1, frameCount(animation));
  const abilityColors = championConfig.colors;
  const presetProfile = CHAMPION_VFX_CONFIG.presets[settings.vfxPreset];
  const isWalking = animation === 'walk';
  const isCasting = animation.startsWith('cast_');
  const auraColor = (() => {
    if (animation === 'panic') return hexToRgba('#ef4444', 0.38);
    if (animation === 'victory') return hexToRgba('#f59e0b', 0.3);
    if (animation === 'cast_q') return hexToRgba(abilityColors.q, 0.52);
    if (animation === 'cast_w') return hexToRgba(abilityColors.w, 0.48);
    if (animation === 'cast_e') return hexToRgba(abilityColors.e, 0.42);
    if (animation === 'cast_r') return hexToRgba(abilityColors.r, 0.56);
    if (animation === 'recall') return hexToRgba('#a78bfa', 0.28);
    if (animation === 'meditate') return hexToRgba(abilityColors.e, 0.22);
    return hexToRgba(abilityColors.q, 0.2);
  })();
  const ultCinematicActive = effects.some((effect) => effect.type === 'r' || effect.type === 'r-lane');
  const championCenterX = position.x + championSize / 2;
  const championCenterY = position.y + championSize / 2;
  const visibleRangeRadius = (() => {
    if (typeof window === 'undefined') return settings.rangeRadius;
    const viewportPad = 10;
    const maxFullyVisibleRadius = Math.min(
      championCenterX - viewportPad,
      window.innerWidth - championCenterX - viewportPad,
      championCenterY - viewportPad,
      window.innerHeight - championCenterY - viewportPad
    );
    return Math.min(settings.rangeRadius, Math.max(96, Math.floor(maxFullyVisibleRadius)));
  })();
  const spriteStyle = {
    width: championSize,
    height: championSize,
    backgroundImage: `url(${championConfig.spriteSheet})`,
    // Render exactly one sprite frame and scale it up to championSize.
    backgroundSize: `${championSize * championConfig.sheetColumns}px ${championSize * championConfig.sheetRows}px`,
    backgroundPosition: `-${activeFrame * championSize}px -${spriteRow * championSize}px`,
    backgroundRepeat: 'no-repeat' as const,
    imageRendering: 'pixelated' as const,
    transform: direction === 'left' ? 'scaleX(-1) rotate(-1.5deg)' : 'scaleX(1) rotate(1.5deg)',
    transformOrigin: 'center',
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[68] select-none">
      {mode === 'active' && (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            boxShadow: `inset 0 0 0 1px ${hexToRgba(abilityColors.q, 0.18)}`,
          }}
        />
      )}

      {mode === 'active' && ultCinematicActive && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.12, 0.08, 0] }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{
            background: `radial-gradient(circle at center, ${hexToRgba(abilityColors.r, 0.2)} 0%, ${hexToRgba('#02040a', 0.72)} 70%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {mode === 'active' && presetProfile.ambientAbilityFlashes && effects.some((effect) => effect.type === 'q' || effect.type === 'q-arc') && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.08, 0] }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${hexToRgba(abilityColors.q, 0.16)} 0%, transparent 62%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {mode === 'active' && presetProfile.ambientAbilityFlashes && effects.some((effect) => effect.type === 'w' || effect.type === 'w-bolt' || effect.type === 'w-shockwave') && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.06, 0] }}
          transition={{ duration: 0.26, ease: 'easeOut' }}
          style={{
            background: `radial-gradient(circle at 50% 45%, ${hexToRgba(abilityColors.w, 0.12)} 0%, transparent 65%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {mode === 'active' && presetProfile.ambientAbilityFlashes && effects.some((effect) => effect.type === 'e' || effect.type === 'e-streak') && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.06, 0] }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            background: `radial-gradient(circle at 50% 55%, ${hexToRgba(abilityColors.e, 0.14)} 0%, transparent 66%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {mode === 'active' && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[69] flex justify-center">
          <div
            data-hotkeys-disabled="true"
            className="rounded-lg bg-surface/95 px-4 py-2 text-xs tracking-wide shadow-xl"
            style={{
              border: `1px solid ${hexToRgba(abilityColors.q, 0.5)}`,
              color: hexToRgba(abilityColors.q, 0.95),
            }}
          >
            CHAMPION MODE · ESC to exit
          </div>
        </div>
      )}

      {mode === 'active' && rangeActive && (
        <div
          className="absolute rounded-full champion-range-ring"
          style={{
            width: visibleRangeRadius * 2,
            height: visibleRangeRadius * 2,
            left: championCenterX - visibleRangeRadius,
            top: championCenterY - visibleRangeRadius,
            border: `2px solid ${hexToRgba(abilityColors.q, 0.82)}`,
            backgroundColor: hexToRgba(abilityColors.q, 0.12),
            boxShadow: `0 0 24px ${hexToRgba(abilityColors.q, 0.42)}, inset 0 0 22px ${hexToRgba(abilityColors.q, 0.16)}`,
          }}
        />
      )}

      <motion.button
        onClick={onChampionClick}
        data-champion-sprite="true"
        className="pointer-events-auto absolute"
        style={{ left: position.x, top: position.y }}
        animate={{ x: 0, y: 0 }}
      >
        {/* Ambient aura — pulses and shifts colour with animation state */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{
            opacity: [
              0.48 * presetProfile.auraOpacityMultiplier,
              0.78 * presetProfile.auraOpacityMultiplier,
              0.48 * presetProfile.auraOpacityMultiplier,
            ],
            scale: [
              1.28 * presetProfile.auraScaleMultiplier,
              1.46 * presetProfile.auraScaleMultiplier,
              1.28 * presetProfile.auraScaleMultiplier,
            ],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: auraColor, filter: 'blur(24px)' }}
        />

        {/* Secondary soft halo ring */}
        {presetProfile.showSecondaryHalo && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full"
            animate={{
              opacity: [
                0.18 * presetProfile.auraOpacityMultiplier,
                0.32 * presetProfile.auraOpacityMultiplier,
                0.18 * presetProfile.auraOpacityMultiplier,
              ],
              scale: [
                1.55 * presetProfile.auraScaleMultiplier,
                1.7 * presetProfile.auraScaleMultiplier,
                1.55 * presetProfile.auraScaleMultiplier,
              ],
            }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            style={{ backgroundColor: auraColor, filter: 'blur(38px)' }}
          />
        )}

        {/* Ground shadow ellipse */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: championSize * 0.68,
            height: championSize * 0.1,
            bottom: 0,
            left: '50%',
            transform: 'translate(-50%, 48%)',
            backgroundColor: 'rgba(0,0,0,0.65)',
            filter: 'blur(7px)',
          }}
        />

        {/* Active mode gun barrel */}
        {mode === 'active' && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: championSize / 2 + (direction === 'left' ? -26 : 26),
              top: championSize * 0.6,
              width: 12,
              height: 4,
              backgroundColor: hexToRgba('#84DEFF', 0.7),
              boxShadow: `0 0 8px ${hexToRgba('#84DEFF', 0.55)}`,
              transform: `translate(-50%, -50%) ${direction === 'left' ? 'rotate(175deg)' : 'rotate(5deg)'}`,
            }}
          />
        )}

        {/* Sprite — dark atmospheric container, no gradient ball */}
        <motion.div
          className="relative rounded-full border border-white/[0.07] bg-[#060912]/85"
          style={spriteStyle}
          animate={{
            y: isWalking ? [0, -3, 0, -1.5, 0] : [0, -3.5, 0],
            scale: isCasting ? [1, 1.05, 1] : 1,
            rotate: isWalking ? 0 : [0, 0.5, 0, -0.5, 0],
          }}
          transition={{
            duration: isWalking ? 0.42 : 2.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Inner atmospheric highlight */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(ellipse at 32% 22%, ${hexToRgba(abilityColors.q, 0.16)} 0%, transparent 50%)`,
            }}
          />
          <div className="absolute inset-0 rounded-full border border-white/[0.1]" />

          {mode === 'active' && !rangeActive && (
            <motion.div
              className="absolute rounded-full border"
              animate={{ opacity: [0.18, 0.32, 0.18], scale: [0.96, 1.01, 0.96] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{
                borderColor: hexToRgba(abilityColors.q, 0.38),
                backgroundColor: hexToRgba(abilityColors.q, 0.05),
                inset: '4%',
              }}
            />
          )}

          {mode === 'active' && (
            <div
              className="absolute left-1/2 top-[92%] h-[2px] w-9 -translate-x-1/2 rounded-full"
              style={{
                backgroundColor: hexToRgba('#D8ECFF', 0.45),
                transform: `translateX(-50%) rotate(${direction === 'left' ? 170 : 10}deg)`,
              }}
            />
          )}

          {/* Level badge — HUD style */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-400/20 bg-black/90 px-2 py-[2px]"
            style={{
              top: '-24px',
              boxShadow: '0 0 14px rgba(251,191,36,0.22), 0 0 0 1px rgba(251,191,36,0.06)',
            }}
          >
            <span className="text-[8px] font-medium uppercase tracking-wider text-amber-500/55">Lv</span>
            <span className="text-xs font-bold text-amber-300">{stats.level}</span>
          </div>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {effects.map((effect) => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="absolute"
            style={{ left: effect.x, top: effect.y }}
          >
            {/* Q — Piercing Light: sharp laser line */}
            {effect.type === 'q' && (
              <motion.div
                className="absolute"
                initial={{ scaleX: 0, rotate: effect.angle ?? 0 }}
                animate={{ scaleX: 1, rotate: effect.angle ?? 0 }}
                transition={{ duration: 0.08, ease: 'easeOut' }}
                style={{ transformOrigin: 'left center' }}
              >
                {/* Wide atmospheric glow */}
                <div
                  className="absolute"
                  style={{
                    width: effect.distance ?? 640,
                    height: 24,
                    top: -8,
                    left: 0,
                    borderRadius: 999,
                    background: `linear-gradient(to right, ${hexToRgba(abilityColors.q, 0.4)}, ${hexToRgba(abilityColors.q, 0.15)}, transparent 85%)`,
                    filter: 'blur(6px)',
                  }}
                />
                {/* Outer glow */}
                <div
                  className="absolute"
                  style={{
                    width: effect.distance ?? 640,
                    height: 14,
                    top: -3,
                    left: 0,
                    borderRadius: 999,
                    background: `linear-gradient(to right, ${hexToRgba(abilityColors.q, 0.6)}, ${hexToRgba(abilityColors.q, 0.3)}, transparent 90%)`,
                    filter: 'blur(3px)',
                  }}
                />
                {/* Main laser beam */}
                <div
                  className="absolute"
                  style={{
                    width: effect.distance ?? 640,
                    height: 7,
                    top: 0,
                    left: 0,
                    borderRadius: 999,
                    background: `linear-gradient(to right, ${hexToRgba('#FFFFFF', 0.98)}, ${hexToRgba(abilityColors.q, 0.95)}, ${hexToRgba(abilityColors.q, 0.5)}, transparent 92%)`,
                    boxShadow: `0 0 16px ${hexToRgba(abilityColors.q, 0.9)}, 0 0 32px ${hexToRgba(abilityColors.q, 0.3)}`,
                  }}
                />
                {/* White-hot core */}
                <div
                  className="absolute"
                  style={{
                    width: (effect.distance ?? 640) * 0.75,
                    height: 2,
                    top: 2.5,
                    left: 0,
                    borderRadius: 999,
                    background: `linear-gradient(to right, ${hexToRgba('#FFFFFF', 1)}, ${hexToRgba('#FFFFFF', 0.7)}, transparent 80%)`,
                  }}
                />
                {/* Impact point glow at beam end */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 18,
                    height: 18,
                    top: -5,
                    left: (effect.distance ?? 640) - 12,
                    backgroundColor: hexToRgba(abilityColors.q, 0.5),
                    boxShadow: `0 0 16px ${hexToRgba(abilityColors.q, 0.6)}`,
                    filter: 'blur(3px)',
                  }}
                />
              </motion.div>
            )}
            {/* W — Ardent Blaze: projectile + star explosion */}
            {effect.type === 'w-bolt' && (
              <motion.div
                className="origin-left"
                initial={{ opacity: 0.95, scaleX: 0.1 }}
                animate={{ opacity: [0.95, 0.6, 0], scaleX: [0.1, 1, 1.02] }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                style={{
                  transform: `rotate(${effect.angle ?? 0}deg)`,
                  width: effect.distance ?? 320,
                  height: 8,
                  borderRadius: 999,
                  background: `linear-gradient(to right, ${hexToRgba('#FFFFFF', 0.95)}, ${hexToRgba(abilityColors.w, 0.9)}, ${hexToRgba(abilityColors.w, 0.3)}, transparent)`,
                  boxShadow: `0 0 14px ${hexToRgba(abilityColors.w, 0.7)}`,
                }}
              />
            )}
            {effect.type === 'w-mark' && (
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 1, scale: 0.2 }}
                animate={{ opacity: 0, scale: 1.8 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {/* Star burst — 6 rays radiating outward, staggered */}
                <div className="relative" style={{ width: 72, height: 72 }}>
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <motion.div
                      key={`w-ray-${deg}`}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      initial={{ scaleY: 0.3, opacity: 0.5 }}
                      animate={{ scaleY: [0.3, 1.2, 0.9], opacity: [0.5, 1, 0] }}
                      transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.02 }}
                      style={{
                        width: 3,
                        height: 36,
                        borderRadius: 999,
                        transform: `rotate(${deg}deg)`,
                        transformOrigin: 'center center',
                        background: `linear-gradient(to bottom, ${hexToRgba(abilityColors.w, 0.95)}, ${hexToRgba('#FFFFFF', 0.9)}, ${hexToRgba(abilityColors.w, 0.3)})`,
                        boxShadow: `0 0 10px ${hexToRgba(abilityColors.w, 0.7)}, 0 0 20px ${hexToRgba(abilityColors.w, 0.25)}`,
                      }}
                    />
                  ))}
                  {/* Secondary thin rays (offset) */}
                  {[30, 90, 150, 210, 270, 330].map((deg) => (
                    <div
                      key={`w-ray2-${deg}`}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        width: 2,
                        height: 20,
                        borderRadius: 999,
                        transform: `rotate(${deg}deg)`,
                        background: `linear-gradient(to bottom, ${hexToRgba(abilityColors.w, 0.5)}, transparent)`,
                      }}
                    />
                  ))}
                  {/* Center glow — multi-layer -->*/}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor: hexToRgba(abilityColors.w, 0.4),
                      boxShadow: `0 0 24px ${hexToRgba(abilityColors.w, 0.6)}`,
                      filter: 'blur(3px)',
                    }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: hexToRgba('#FFFFFF', 0.95),
                      boxShadow: `0 0 14px ${hexToRgba(abilityColors.w, 0.95)}, 0 0 32px ${hexToRgba(abilityColors.w, 0.5)}`,
                    }}
                  />
                </div>
              </motion.div>
            )}
            {/* E — Relentless Pursuit: dash */}
            {effect.type === 'e' && (
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                initial={{ opacity: 0.8, scale: 0.3 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: hexToRgba(abilityColors.e, 0.2),
                  boxShadow: `0 0 16px ${hexToRgba(abilityColors.e, 0.5)}`,
                }}
              />
            )}
            {effect.type === 'e-streak' && (
              <motion.div
                className="absolute origin-left"
                initial={{ opacity: 0.9, scaleX: 0.05 }}
                animate={{ opacity: [0.9, 0.4, 0], scaleX: [0.05, 1, 1.01] }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  transform: `rotate(${effect.angle ?? 0}deg)`,
                  width: effect.distance ?? 220,
                  height: 4,
                  borderRadius: 999,
                  background: `linear-gradient(to right, ${hexToRgba('#FFFFFF', 0.8)}, ${hexToRgba(abilityColors.e, 0.7)}, transparent)`,
                  boxShadow: `0 0 10px ${hexToRgba(abilityColors.e, 0.5)}`,
                }}
              />
            )}
            {effect.type === 'dash-ghost' && (
              <motion.div
                className="-translate-x-1/2 -translate-y-1/2 rounded-sm"
                initial={{ opacity: 0.5, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{
                  width: 28,
                  height: 36,
                  background: `linear-gradient(to bottom, ${hexToRgba(abilityColors.e, 0.4)}, ${hexToRgba(abilityColors.e, 0.1)})`,
                  boxShadow: `0 0 10px ${hexToRgba(abilityColors.e, 0.3)}`,
                }}
              />
            )}
            {/* R — The Culling: rapid-fire bullets — larger with trail */}
            {effect.type === 'r-bullet' && (
              <motion.div
                className="origin-left"
                initial={{ opacity: 1, x: 0, y: 0 }}
                animate={{
                  opacity: [1, 0.9, 0],
                  x: Math.cos(((effect.angle ?? 0) * Math.PI) / 180) * (effect.distance ?? 480),
                  y: Math.sin(((effect.angle ?? 0) * Math.PI) / 180) * (effect.distance ?? 480),
                }}
                transition={{ duration: 0.24, ease: 'linear' }}
              >
                {/* Trailing glow */}
                <div
                  style={{
                    position: 'absolute',
                    width: 32,
                    height: 6,
                    left: -28,
                    top: -1,
                    borderRadius: 999,
                    transform: `rotate(${effect.angle ?? 0}deg)`,
                    background: `linear-gradient(to right, transparent, ${hexToRgba(abilityColors.r, 0.3)}, ${hexToRgba(abilityColors.r, 0.1)})`,
                    filter: 'blur(2px)',
                  }}
                />
                {/* Bullet head */}
                <div
                  style={{
                    width: 20,
                    height: 4,
                    borderRadius: 999,
                    transform: `rotate(${effect.angle ?? 0}deg)`,
                    background: `linear-gradient(to right, ${hexToRgba('#FFFFFF', 1)}, ${hexToRgba(abilityColors.r, 0.95)}, ${hexToRgba(abilityColors.r, 0.6)})`,
                    boxShadow: `0 0 10px ${hexToRgba(abilityColors.r, 0.85)}, 0 0 4px ${hexToRgba('#FFFFFF', 0.7)}, 0 0 20px ${hexToRgba(abilityColors.r, 0.3)}`,
                  }}
                />
              </motion.div>
            )}
            {effect.type === 'r-muzzle' && (
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 1, scale: 0.4 }}
                animate={{ opacity: 0, scale: 2.2 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {/* Muzzle flash — multi-layer for premium feel */}
                <div
                  className="rounded-full"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: hexToRgba('#FFFFFF', 0.92),
                    boxShadow: `0 0 24px ${hexToRgba(abilityColors.r, 0.95)}, 0 0 48px ${hexToRgba(abilityColors.r, 0.5)}, 0 0 8px ${hexToRgba('#FFFFFF', 0.8)}`,
                  }}
                />
                {/* Directional flash streak */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: 40,
                    height: 6,
                    borderRadius: 999,
                    transform: `translate(-50%, -50%) rotate(${effect.angle ?? 0}deg)`,
                    background: `linear-gradient(to right, transparent, ${hexToRgba('#FFFFFF', 0.6)}, transparent)`,
                  }}
                />
              </motion.div>
            )}
            {effect.type === 'move' && (
              <motion.div
                className="relative h-11 w-11 -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0.95, scale: 0.82 }}
                animate={{ opacity: [0.95, 0.75, 0], scale: [0.82, 1, 1.06] }}
                transition={{ duration: 0.34, ease: 'easeOut' }}
              >
                <div
                  className="absolute inset-0 rounded-full border"
                  style={{
                    borderColor: hexToRgba(MOVE_COMMAND_COLOR, 0.42),
                    boxShadow: `0 0 12px ${hexToRgba(MOVE_COMMAND_COLOR, 0.35)}`,
                  }}
                />
                {[0, 90, 180, 270].map((deg) => (
                  <div
                    key={`move-chevron-${deg}`}
                    className="absolute left-1/2 top-1/2 h-0 w-0"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-14px)`,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: `8px solid ${hexToRgba(MOVE_COMMAND_COLOR, 0.95)}`,
                      filter: `drop-shadow(0 0 4px ${hexToRgba(MOVE_COMMAND_COLOR, 0.75)})`,
                    }}
                  />
                ))}
                <div
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: hexToRgba('#D9FFD9', 0.95) }}
                />
              </motion.div>
            )}
            {effect.type === 'pentakill' && (
              <motion.div
                className="pointer-events-none -translate-x-1/2 -translate-y-1/2 text-4xl font-black tracking-[0.25em] text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,0.8)]"
                initial={{ opacity: 0, scale: 0.55, y: 10 }}
                animate={{ opacity: [0, 1, 1, 0.85], scale: [0.55, 1.18, 0.97, 1], y: [10, -5, 1, 0] }}
                transition={{ duration: 0.52, ease: 'easeOut', times: [0, 0.28, 0.55, 1] }}
              >
                PENTAKILL
              </motion.div>
            )}
            {effect.type === 'origin-flash' && (
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                initial={{ opacity: 1, scale: 0.3 }}
                animate={{ opacity: 0, scale: 2.2 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
                style={{
                  width: effect.size ?? 44,
                  height: effect.size ?? 44,
                  backgroundColor: hexToRgba('#FFFFFF', 0.92),
                  boxShadow: `0 0 40px ${hexToRgba(effect.tone ?? abilityColors.q, 0.95)}, 0 0 80px ${hexToRgba(effect.tone ?? abilityColors.q, 0.45)}, 0 0 120px ${hexToRgba(effect.tone ?? abilityColors.q, 0.18)}`,
                }}
              />
            )}
            {effect.type === 'landing-ring' && (
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px]"
                initial={{ opacity: 1, scale: 0.25 }}
                animate={{ opacity: 0, scale: 1.8 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  width: effect.size ?? 80,
                  height: effect.size ?? 80,
                  borderColor: hexToRgba(abilityColors.e, 0.95),
                  boxShadow: `0 0 28px ${hexToRgba(abilityColors.e, 0.7)}, inset 0 0 20px ${hexToRgba(abilityColors.e, 0.35)}`,
                }}
              />
            )}
            {/* Screen flash — full-viewport momentary white flash */}
            {effect.type === 'screen-flash' && (
              <motion.div
                className="pointer-events-none fixed inset-0"
                style={{ zIndex: 9999 }}
                initial={{ opacity: 0.25 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at 50% 50%, ${hexToRgba(effect.tone ?? '#FFFFFF', 0.18)} 0%, ${hexToRgba('#FFFFFF', 0.08)} 40%, transparent 70%)`,
                  }}
                />
              </motion.div>
            )}
            {/* Q sparks — small bright dots along beam path */}
            {effect.type === 'q-spark' && (
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 2.5, y: (Math.random() - 0.5) * 16 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  width: effect.size ?? 6,
                  height: effect.size ?? 6,
                  backgroundColor: hexToRgba('#FFFFFF', 0.95),
                  boxShadow: `0 0 8px ${hexToRgba(abilityColors.q, 0.9)}, 0 0 16px ${hexToRgba(abilityColors.q, 0.4)}`,
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {mode === 'active' && settings.showCooldowns && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[69] flex -translate-x-1/2 gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-xl">
          {(['q', 'w', 'e', 'r'] as AbilityKey[]).map((key) => (
            <div
              key={key}
              className="relative h-14 w-14 rounded-lg border bg-background/70 text-center"
              style={{
                borderColor: hexToRgba(
                  key === 'q' ? abilityColors.q : key === 'w' ? abilityColors.w : key === 'e' ? abilityColors.e : abilityColors.r,
                  0.5
                ),
              }}
            >
              <div
                className="pt-1 text-xs font-semibold uppercase"
                style={{
                  color: key === 'q'
                    ? abilityColors.q
                    : key === 'w'
                      ? abilityColors.w
                      : key === 'e'
                        ? abilityColors.e
                        : abilityColors.r,
                }}
              >
                {key}
              </div>
              <div className="text-[11px] text-text-tertiary">
                {key === 'q' ? 'Light' : key === 'w' ? 'Mark' : key === 'e' ? 'Dash' : 'Ult'}
              </div>
              {cooldowns[key] > 0 && (
                <div className="absolute inset-0 grid place-items-center rounded-lg bg-black/60 text-sm font-bold text-amber-200">
                  {cooldowns[key]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChampionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { play } = useAppSound();

  const [settings, setSettings] = useState<ChampionSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<ChampionStats>(() => levelFromXp(0));
  const [mode, setMode] = useState<ChampionMode>('passive');
  const [position, setPosition] = useState<Position>(INITIAL_POSITION);
  const [targetPosition, setTargetPosition] = useState<Position>(INITIAL_POSITION);
  const [isMoving, setIsMoving] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [animation, setAnimation] = useState<ChampionAnimation>('idle');
  const [frame, setFrame] = useState(0);
  const [effects, setEffects] = useState<EffectState[]>([]);
  const [rangeActive, setRangeActive] = useState(false);
  const [cooldownReadyAt, setCooldownReadyAt] = useState<Record<AbilityKey, number>>({
    q: 0,
    w: 0,
    e: 0,
    r: 0,
  });
  const [cooldowns, setCooldowns] = useState<Record<AbilityKey, number>>({
    q: 0,
    w: 0,
    e: 0,
    r: 0,
  });

  const pointerRef = useRef<Position>({ x: 0, y: 0 });
  const positionRef = useRef<Position>(INITIAL_POSITION);
  const randomWalkTimeoutRef = useRef<number | null>(null);
  const moveRafRef = useRef<number | null>(null);
  const taskStreakRef = useRef(0);
  const isMovingRef = useRef(false);
  const animationLockUntilRef = useRef(0);
  const animationSequenceRef = useRef(0);
  const animationTimeoutsRef = useRef<number[]>([]);

  const championSize = SCALE_TO_SIZE[settings.renderScale];
  const abilityColors = CHAMPION_CONFIG[settings.champion].colors;
  const vfxPresetProfile = CHAMPION_VFX_CONFIG.presets[settings.vfxPreset];

  const updateSettings = useCallback((next: Partial<ChampionSettings>) => {
    setSettings((prev) => {
      const merged = sanitizeChampionSettings({ ...prev, ...next });
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const resetPosition = useCallback(() => {
    const nextPosition = clampToViewport(nearestViewportPosition(), championSize);
    positionRef.current = nextPosition;
    setPosition(nextPosition);
    setTargetPosition(nextPosition);
    localStorage.setItem(POSITION_KEY, JSON.stringify(nextPosition));
  }, [championSize]);

  const restoreDefaults = useCallback(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSettings(DEFAULT_SETTINGS);
    setMode('passive');
    setRangeActive(false);
    resetPosition();
  }, [resetPosition]);

  const addEffect = useCallback((effect: Omit<EffectState, 'id'>, ttl = 700) => {
    const id = `${effect.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextEffect: EffectState = { ...effect, id };
    setEffects((prev) => [...prev, nextEffect]);
    window.setTimeout(() => {
      setEffects((prev) => prev.filter((entry) => entry.id !== id));
    }, ttl);
  }, []);

  const scaleEffectTtl = useCallback(
    (baseTtl: number) => Math.max(120, Math.round(baseTtl * vfxPresetProfile.effectTtlMultiplier)),
    [vfxPresetProfile.effectTtlMultiplier]
  );

  const setBaseAnimation = useCallback(() => {
    setAnimation(isMovingRef.current ? 'walk' : 'idle');
  }, []);

  const clearAnimationTimeouts = useCallback(() => {
    animationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    animationTimeoutsRef.current = [];
  }, []);

  const scheduleAnimationTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(callback, delayMs);
    animationTimeoutsRef.current.push(timeoutId);
  }, []);

  const startLockedAnimation = useCallback((next: ChampionAnimation, durationMs: number) => {
    animationSequenceRef.current += 1;
    const token = animationSequenceRef.current;
    animationLockUntilRef.current = Date.now() + durationMs;
    clearAnimationTimeouts();
    setAnimation(next);
    scheduleAnimationTimeout(() => {
      if (animationSequenceRef.current !== token) return;
      animationLockUntilRef.current = 0;
      setBaseAnimation();
    }, durationMs);
    return token;
  }, [clearAnimationTimeouts, scheduleAnimationTimeout, setBaseAnimation]);

  const scheduleAnimationTransition = useCallback((token: number, next: ChampionAnimation, delayMs: number) => {
    scheduleAnimationTimeout(() => {
      if (animationSequenceRef.current !== token) return;
      setAnimation(next);
    }, delayMs);
  }, [scheduleAnimationTimeout]);

  const playReactionAnimation = useCallback((next: ChampionAnimation, durationMs = 900) => {
    if (Date.now() < animationLockUntilRef.current) return false;
    animationSequenceRef.current += 1;
    const token = animationSequenceRef.current;
    clearAnimationTimeouts();
    setAnimation(next);
    scheduleAnimationTimeout(() => {
      if (animationSequenceRef.current !== token) return;
      setBaseAnimation();
    }, durationMs);
    return true;
  }, [clearAnimationTimeouts, scheduleAnimationTimeout, setBaseAnimation]);

  const markElementsInRange = useCallback((radius: number) => {
    const elements = document.querySelectorAll<HTMLElement>('[data-interactive]');
    const center = {
      x: positionRef.current.x + championSize / 2,
      y: positionRef.current.y + championSize / 2,
    };

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elementCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const distance = Math.hypot(elementCenter.x - center.x, elementCenter.y - center.y);
      if (distance <= radius) {
        element.setAttribute('data-champion-in-range', 'true');
      } else {
        element.removeAttribute('data-champion-in-range');
      }
    });

    elements.forEach((element) => {
      element.removeAttribute('data-champion-focus');
      element.removeAttribute('data-champion-dimmed');
    });
  }, [championSize]);

  const fireLightslinger = useCallback((center: Position, baseAngle: number, ttlMs: number) => {
    for (let i = 0; i < 2; i += 1) {
      window.setTimeout(() => {
        addEffect(
          {
            type: 'r-bullet',
            x: center.x,
            y: center.y,
            angle: baseAngle + (i === 0 ? -3 : 3),
            distance: 240 + Math.random() * 60,
          },
          ttlMs
        );
      }, i * 95);
    }
  }, [addEffect]);

  const markElementsOnBeam = useCallback((angleDeg: number) => {
    const elements = document.querySelectorAll<HTMLElement>('[data-interactive]');
    const start = {
      x: positionRef.current.x + championSize / 2,
      y: positionRef.current.y + championSize / 2,
    };
    const rad = (angleDeg * Math.PI) / 180;
    const end = {
      x: start.x + Math.cos(rad) * 1000,
      y: start.y + Math.sin(rad) * 1000,
    };

    const distToSegment = (point: Position): number => {
      const vx = end.x - start.x;
      const vy = end.y - start.y;
      const wx = point.x - start.x;
      const wy = point.y - start.y;
      const c1 = vx * wx + vy * wy;
      if (c1 <= 0) return Math.hypot(point.x - start.x, point.y - start.y);
      const c2 = vx * vx + vy * vy;
      if (c2 <= c1) return Math.hypot(point.x - end.x, point.y - end.y);
      const b = c1 / c2;
      const px = start.x + b * vx;
      const py = start.y + b * vy;
      return Math.hypot(point.x - px, point.y - py);
    };

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      if (distToSegment(center) < 42) {
        element.setAttribute('data-champion-targeted', 'true');
        window.setTimeout(() => {
          element.removeAttribute('data-champion-targeted');
        }, 2800);
      }
    });
  }, [championSize]);

  const awardXp = useCallback((xpDelta: number) => {
    if (!xpDelta) return;
    setStats((prev) => {
      const next = levelFromXp(prev.xp + xpDelta);
      localStorage.setItem(STATS_KEY, JSON.stringify(next));
      if (next.level > prev.level) {
        dispatchChampionEvent({ type: 'LEVEL_UP', newLevel: next.level });
      }
      return next;
    });
  }, []);

  const startCooldown = useCallback((ability: AbilityKey) => {
    setCooldownReadyAt((prev) => ({ ...prev, [ability]: Date.now() + ABILITY_COOLDOWNS[ability] * 1000 }));
  }, []);

  const castAbility = useCallback((ability: AbilityKey) => {
    const readyAt = cooldownReadyAt[ability];
    if (readyAt > Date.now()) return;
    void trackAppEvent('lucian_spell_cast', {
      route: pathname,
      source: 'champion_provider',
      ability,
    });

    if (settings.soundsEnabled) {
      if (ability === 'q') play('champ-q');
      if (ability === 'w') play('champ-w');
      if (ability === 'e') play('champ-e');
      if (ability === 'r') play('champ-r');
    }

    if (ability === 'q') {
      // Piercing Light — sharp laser line, fast and clean
      startLockedAnimation(ABILITY_CAST_ANIMATION.q, ABILITY_ANIMATION_LOCK_MS.q);
      const center = { x: positionRef.current.x + championSize / 2, y: positionRef.current.y + championSize / 2 };
      const angle = (Math.atan2(pointerRef.current.y - center.y, pointerRef.current.x - center.x) * 180) / Math.PI;
      const beamDistance = 640;
      // Screen flash — brief white flash for impact
      addEffect({ type: 'screen-flash', x: 0, y: 0, tone: abilityColors.q }, scaleEffectTtl(180));
      // Muzzle flash at gun
      addEffect({ type: 'origin-flash', x: center.x, y: center.y, size: 32, tone: abilityColors.q }, scaleEffectTtl(150));
      // Single sharp laser beam
      addEffect({ type: 'q', x: center.x, y: center.y, angle, distance: beamDistance }, scaleEffectTtl(350));
      // Sparks along the beam
      const rad = (angle * Math.PI) / 180;
      for (let i = 1; i <= 4; i += 1) {
        const sparkDist = beamDistance * (i / 5) * (0.8 + Math.random() * 0.4);
        addEffect(
          {
            type: 'q-spark',
            x: center.x + Math.cos(rad) * sparkDist,
            y: center.y + Math.sin(rad) * sparkDist,
            size: 6 + Math.random() * 4,
          },
          scaleEffectTtl(180 + i * 40)
        );
      }
      markElementsOnBeam(angle);
      fireLightslinger(center, angle, scaleEffectTtl(320));
      startCooldown('q');
      return;
    }

    if (ability === 'w') {
      // Ardent Blaze — projectile that explodes in a star shape
      startLockedAnimation(ABILITY_CAST_ANIMATION.w, ABILITY_ANIMATION_LOCK_MS.w);
      const center = { x: positionRef.current.x + championSize / 2, y: positionRef.current.y + championSize / 2 };
      const angle = (Math.atan2(pointerRef.current.y - center.y, pointerRef.current.x - center.x) * 180) / Math.PI;
      const distToPointer = Math.hypot(pointerRef.current.x - center.x, pointerRef.current.y - center.y);
      const boltDistance = Math.min(420, Math.max(160, distToPointer));
      const rad = (angle * Math.PI) / 180;
      const hitX = center.x + Math.cos(rad) * boltDistance;
      const hitY = center.y + Math.sin(rad) * boltDistance;

      // Muzzle flash
      addEffect({ type: 'origin-flash', x: center.x, y: center.y, size: 22, tone: abilityColors.w }, scaleEffectTtl(150));
      // Projectile trail
      addEffect({ type: 'w-bolt', x: center.x, y: center.y, angle, distance: boltDistance }, scaleEffectTtl(320));
      // Star explosion at impact
      addEffect({ type: 'origin-flash', x: hitX, y: hitY, size: 36, tone: abilityColors.w }, scaleEffectTtl(350));
      addEffect({ type: 'w-mark', x: hitX, y: hitY }, scaleEffectTtl(500));
      fireLightslinger(center, angle, scaleEffectTtl(320));
      startCooldown('w');
      return;
    }

    if (ability === 'e') {
      startLockedAnimation(ABILITY_CAST_ANIMATION.e, ABILITY_ANIMATION_LOCK_MS.e);
      const currentCenter = { x: positionRef.current.x + championSize / 2, y: positionRef.current.y + championSize / 2 };
      const target = clampToViewport(
        { x: pointerRef.current.x - championSize / 2, y: pointerRef.current.y - championSize / 2 },
        championSize
      );
      const targetCenter = { x: target.x + championSize / 2, y: target.y + championSize / 2 };
      const dashAngle = (Math.atan2(targetCenter.y - currentCenter.y, targetCenter.x - currentCenter.x) * 180) / Math.PI;
      const dashDistance = Math.hypot(targetCenter.x - currentCenter.x, targetCenter.y - currentCenter.y);
      addEffect({ type: 'e-streak', x: currentCenter.x, y: currentCenter.y, angle: dashAngle, distance: dashDistance }, scaleEffectTtl(340));
      const dashGhostCount = vfxPresetProfile.dashGhostCount;
      for (let i = 1; i <= dashGhostCount; i += 1) {
        const ratio = i / (dashGhostCount + 1);
        addEffect(
          {
            type: 'dash-ghost',
            x: currentCenter.x + (targetCenter.x - currentCenter.x) * ratio,
            y: currentCenter.y + (targetCenter.y - currentCenter.y) * ratio,
          },
          scaleEffectTtl(220 + i * 30)
        );
      }
      addEffect({ type: 'e', x: positionRef.current.x + championSize / 2, y: positionRef.current.y + championSize / 2 }, scaleEffectTtl(400));
      addEffect({ type: 'landing-ring', x: targetCenter.x, y: targetCenter.y, size: 76 }, scaleEffectTtl(340));
      addEffect({ type: 'landing-ring', x: targetCenter.x, y: targetCenter.y, size: 48 }, scaleEffectTtl(420));
      fireLightslinger(targetCenter, dashAngle, scaleEffectTtl(320));
      positionRef.current = target;
      setPosition(target);
      setTargetPosition(target);
      localStorage.setItem(POSITION_KEY, JSON.stringify(target));
      startCooldown('e');
      return;
    }

    if (ability === 'r') {
      // The Culling — rapid-fire machine gun barrage in one direction
      const castToken = startLockedAnimation(ABILITY_CAST_ANIMATION.r, ABILITY_ANIMATION_LOCK_MS.r);
      const center = { x: positionRef.current.x + championSize / 2, y: positionRef.current.y + championSize / 2 };
      const baseAngle = (Math.atan2(pointerRef.current.y - center.y, pointerRef.current.x - center.x) * 180) / Math.PI;
      // Screen flash — dramatic ult activation
      addEffect({ type: 'screen-flash', x: 0, y: 0, tone: abilityColors.r }, scaleEffectTtl(220));
      // Initial muzzle flash burst
      addEffect({ type: 'origin-flash', x: center.x, y: center.y, size: 48, tone: abilityColors.r }, scaleEffectTtl(160));
      addEffect({ type: 'r-muzzle', x: center.x, y: center.y, angle: baseAngle }, scaleEffectTtl(220));
      // Rapid-fire bullets — tight spread, fast interval (machine gun feel)
      const bulletCount = vfxPresetProfile.rBulletCount;
      for (let i = 0; i < bulletCount; i += 1) {
        const angle = baseAngle + (Math.random() - 0.5) * 4;
        const laneOffset = (Math.random() - 0.5) * 10;
        window.setTimeout(() => {
          addEffect(
            {
              type: 'r-bullet',
              x: center.x + Math.cos(((baseAngle + 90) * Math.PI) / 180) * laneOffset,
              y: center.y + Math.sin(((baseAngle + 90) * Math.PI) / 180) * laneOffset,
              angle,
              distance: 480 + Math.random() * 120,
            },
            scaleEffectTtl(380)
          );
          // Repeating muzzle flash every few bullets
          if (i % 4 === 0) {
            addEffect({ type: 'r-muzzle', x: center.x, y: center.y, angle: baseAngle }, scaleEffectTtl(140));
          }
        }, i * 55);
      }
      const elements = document.querySelectorAll<HTMLElement>('[data-interactive]');
      elements.forEach((element) => {
        element.setAttribute('data-champion-targeted', 'true');
        window.setTimeout(() => element.removeAttribute('data-champion-targeted'), 1200);
      });
      if (taskStreakRef.current >= 5) {
        addEffect({ type: 'pentakill', x: window.innerWidth / 2, y: window.innerHeight / 3 }, scaleEffectTtl(1700));
        dispatchChampionEvent({ type: 'PENTAKILL', count: taskStreakRef.current });
        if (settings.soundsEnabled) play('champ-pentakill');
        taskStreakRef.current = 0;
      }
      startCooldown('r');
      scheduleAnimationTransition(castToken, 'victory', 260);
    }
  }, [
    addEffect,
    abilityColors,
    championSize,
    cooldownReadyAt,
    fireLightslinger,
    markElementsOnBeam,
    pathname,
    play,
    scaleEffectTtl,
    scheduleAnimationTransition,
    settings.soundsEnabled,
    startCooldown,
    startLockedAnimation,
    vfxPresetProfile.dashGhostCount,
    vfxPresetProfile.rBulletCount,
  ]);

  useEffect(() => {
    const savedSettings = readStorageValueWithLegacy(
      localStorage,
      SETTINGS_KEY,
      LEGACY_STORAGE_KEYS.championSettings
    );
    const savedStats = readStorageValueWithLegacy(
      localStorage,
      STATS_KEY,
      LEGACY_STORAGE_KEYS.championStats
    );
    const savedPosition = readStorageValueWithLegacy(
      localStorage,
      POSITION_KEY,
      LEGACY_STORAGE_KEYS.championPosition
    );
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Partial<ChampionSettings>;
        const sanitized = sanitizeChampionSettings(parsed);
        setSettings(sanitized);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitized));
      } catch {
        // ignore
      }
    }
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats) as Partial<ChampionStats>;
        if (typeof parsed.xp === 'number') {
          setStats(levelFromXp(parsed.xp));
        }
      } catch {
        // ignore
      }
    }
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition) as Position;
        const savedPos = clampToViewport(parsed, championSize);
        positionRef.current = savedPos;
        setPosition(savedPos);
        setTargetPosition(savedPos);
      } catch {
        // ignore
      }
    } else {
      const viewportPos = clampToViewport(nearestViewportPosition(), championSize);
      positionRef.current = viewportPos;
      setPosition(viewportPos);
      setTargetPosition(viewportPos);
    }
  }, [championSize]);

  useEffect(() => {
    dispatchChampionEvent({ type: 'PAGE_CHANGE', page: pathname });
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = subscribeChampionEvent((event: ChampionEvent) => {
      if (settings.eventReactions === 'none') return;

      if (event.type === 'TASK_COMPLETED') {
        taskStreakRef.current += 1;
        playReactionAnimation('victory', REACTION_ANIMATION_DURATION_MS.victory);
        if (settings.soundsEnabled) play('champ-victory');
      }

      if (event.type === 'GOAL_CREATED') {
        playReactionAnimation('recall', REACTION_ANIMATION_DURATION_MS.recall);
      }

      if (event.type === 'APPLICATION_SENT') {
        playReactionAnimation('cast_r', REACTION_ANIMATION_DURATION_MS.cast_r);
      }

      if (event.type === 'DEADLINE_WARNING') {
        playReactionAnimation('panic', REACTION_ANIMATION_DURATION_MS.panic);
        if (settings.soundsEnabled) play('champ-panic');
      }

      if (event.type === 'FOCUS_START') {
        playReactionAnimation('meditate', REACTION_ANIMATION_DURATION_MS.meditate);
        if (settings.soundsEnabled) play('champ-focus');
      }

      if (event.type === 'FOCUS_END') {
        if (Date.now() >= animationLockUntilRef.current) {
          setBaseAnimation();
        }
      }

      if (event.type === 'DONE_FOR_TODAY') {
        taskStreakRef.current = 0;
        playReactionAnimation('victory', REACTION_ANIMATION_DURATION_MS.victory);
        if (settings.soundsEnabled) play('champ-victory');
      }

      if (event.type === 'PAGE_CHANGE') {
        addEffect({ type: 'move', x: positionRef.current.x + championSize / 2, y: positionRef.current.y + championSize / 2 }, 240);
      }

      if (event.type === 'LEVEL_UP') {
        playReactionAnimation('recall', REACTION_ANIMATION_DURATION_MS.recall);
        if (settings.soundsEnabled) play('champ-level-up');
      }

      if (event.type === 'STREAK_BROKEN') {
        taskStreakRef.current = 0;
        playReactionAnimation('recall', REACTION_ANIMATION_DURATION_MS.recall);
        if (settings.soundsEnabled) play('champ-panic');
      }

      const xpDelta = XP_FOR_ACTION[event.type] ?? 0;
      if (xpDelta > 0) {
        awardXp(xpDelta);
      }
    });
    return unsubscribe;
  }, [addEffect, awardXp, championSize, play, playReactionAnimation, setBaseAnimation, settings.eventReactions, settings.soundsEnabled]);

  useEffect(() => {
    isMovingRef.current = isMoving;
  }, [isMoving]);

  useEffect(() => {
    return () => {
      clearAnimationTimeouts();
    };
  }, [clearAnimationTimeouts]);

  useEffect(() => {
    // Reset to frame 0 when switching animation rows to avoid brief blank frames.
    setFrame(0);
  }, [animation]);

  useEffect(() => {
    const animationInterval = window.setInterval(() => {
      setFrame((prev) => (prev + 1) % frameCount(animation));
    }, frameDuration(animation));
    return () => window.clearInterval(animationInterval);
  }, [animation]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setCooldowns({
        q: Math.max(0, Math.ceil((cooldownReadyAt.q - now) / 1000)),
        w: Math.max(0, Math.ceil((cooldownReadyAt.w - now) / 1000)),
        e: Math.max(0, Math.ceil((cooldownReadyAt.e - now) / 1000)),
        r: Math.max(0, Math.ceil((cooldownReadyAt.r - now) / 1000)),
      });
    }, 200);
    return () => window.clearInterval(interval);
  }, [cooldownReadyAt]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      pointerRef.current = getPointerPosition(event);
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useEffect(() => {
    if (!settings.enabled || mode !== 'active') return;
    const moveChampionToPointer = (clientX: number, clientY: number) => {
      const target = clampToViewport(
        { x: clientX - championSize / 2, y: clientY - championSize / 2 },
        championSize
      );
      setTargetPosition(target);
      setIsMoving(true);
      setDirection(target.x < positionRef.current.x ? 'left' : 'right');
      if (Date.now() >= animationLockUntilRef.current) {
        setAnimation('walk');
      }
      addEffect({ type: 'move', x: clientX, y: clientY }, 450);
      if (settings.soundsEnabled) play('champ-move');
    };

    const onContextMenu = (event: MouseEvent) => {
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      moveChampionToPointer(event.clientX, event.clientY);
    };

    // Attack-move style: while X-range is active, left-click also issues move command.
    const onPointerDown = (event: MouseEvent) => {
      if (!rangeActive) return;
      if (event.button !== 0) return;
      if (isTypingTarget(event.target)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-champion-sprite="true"]')) return;
      event.preventDefault();
      moveChampionToPointer(event.clientX, event.clientY);
    };

    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mousedown', onPointerDown, true);
    return () => {
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mousedown', onPointerDown, true);
    };
  }, [addEffect, championSize, mode, play, rangeActive, settings.enabled, settings.soundsEnabled]);

  useEffect(() => {
    if (!settings.enabled || mode !== 'active') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === 'escape') {
        const hasDialogOpen = Boolean(document.querySelector('[role="dialog"], [aria-modal="true"]'));
        if (hasDialogOpen) return;
        event.preventDefault();
        setMode('passive');
        setRangeActive(false);
        cleanupInteractiveAttrs();
        return;
      }
      if (key === 'x') {
        event.preventDefault();
        setRangeActive((prev) => {
          const next = !prev;
          if (next) {
            markElementsInRange(settings.rangeRadius);
          } else {
            cleanupInteractiveAttrs();
          }
          return next;
        });
        return;
      }
      if (key === 'q' || key === 'w' || key === 'e' || key === 'r') {
        event.preventDefault();
        castAbility(key as AbilityKey);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [castAbility, markElementsInRange, mode, settings.enabled, settings.rangeRadius]);

  useEffect(() => {
    if (mode !== 'active' || !rangeActive) return;
    const id = window.setInterval(() => {
      markElementsInRange(settings.rangeRadius);
    }, 120);
    return () => window.clearInterval(id);
  }, [markElementsInRange, mode, rangeActive, settings.rangeRadius]);

  useEffect(() => {
    if (rangeActive) return;
    cleanupInteractiveAttrs();
  }, [rangeActive]);

  useEffect(() => {
    // Hard guard: never keep X-range artifacts when mode changes.
    if (mode === 'active') return;
    setRangeActive(false);
    cleanupInteractiveAttrs();
  }, [mode]);

  useEffect(() => {
    if (!settings.enabled || !isMoving) return;

    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPosition((current) => {
        const dx = targetPosition.x - current.x;
        const dy = targetPosition.y - current.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 2) {
          setIsMoving(false);
          if (Date.now() >= animationLockUntilRef.current) {
            setAnimation('idle');
          }
          localStorage.setItem(POSITION_KEY, JSON.stringify(current));
          return current;
        }
        const move = Math.min(distance, BASE_SPEED * dt);
        const next = {
          x: current.x + (dx / distance) * move,
          y: current.y + (dy / distance) * move,
        };
        positionRef.current = next;
        return next;
      });
      moveRafRef.current = requestAnimationFrame(tick);
    };
    moveRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (moveRafRef.current) cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = null;
    };
  }, [isMoving, settings.enabled, targetPosition.x, targetPosition.y]);

  useEffect(() => {
    if (!settings.enabled || settings.passiveBehavior === 'idle-only' || mode !== 'passive') return;
    const schedule = () => {
      const delay = 15000 + Math.random() * 15000;
      randomWalkTimeoutRef.current = window.setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const yMin = height * 0.64;
        const target = clampToViewport(
          {
            x: Math.random() * (width - championSize),
            y: yMin + Math.random() * Math.max(40, height * 0.3),
          },
          championSize
        );
        setTargetPosition(target);
        setDirection(target.x < positionRef.current.x ? 'left' : 'right');
        setIsMoving(true);
        if (Date.now() >= animationLockUntilRef.current) {
          setAnimation('walk');
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (randomWalkTimeoutRef.current) window.clearTimeout(randomWalkTimeoutRef.current);
      randomWalkTimeoutRef.current = null;
    };
  }, [championSize, mode, settings.enabled, settings.passiveBehavior]);

  useEffect(() => {
    if (settings.enabled) return;
    cleanupInteractiveAttrs();
    setMode('passive');
    setRangeActive(false);
  }, [settings.enabled]);

  const contextValue = useMemo<ChampionContextValue>(() => ({
    settings,
    updateSettings,
    resetPosition,
    restoreDefaults,
    stats,
    mode,
  }), [mode, resetPosition, restoreDefaults, settings, stats, updateSettings]);

  return (
    <ChampionContext.Provider value={contextValue}>
      {children}
      <ChampionOverlay
        enabled={settings.enabled}
        mode={mode}
        settings={settings}
        stats={stats}
        position={position}
        direction={direction}
        animation={animation}
        frame={frame}
        effects={effects}
        cooldowns={cooldowns}
        rangeActive={rangeActive}
        onChampionClick={() => {
          setRangeActive(false);
          cleanupInteractiveAttrs();
          setMode((prev) => (prev === 'active' ? 'passive' : 'active'));
        }}
      />
    </ChampionContext.Provider>
  );
}
