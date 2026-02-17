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
import { CHAMPION_CONFIG, type ChampionId } from '@/lib/champion/config';
import { useAppSound } from '@/lib/hooks/useAppSound';

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

type ChampionScale = 'small' | 'normal' | 'large';
type EventReactionMode = 'all' | 'none';
type PassiveBehavior = 'active' | 'idle-only';
type AbilityKey = 'q' | 'w' | 'e' | 'r';

interface ChampionSettings {
  enabled: boolean;
  champion: ChampionId;
  renderScale: ChampionScale;
  passiveBehavior: PassiveBehavior;
  eventReactions: EventReactionMode;
  rangeRadius: number;
  showCooldowns: boolean;
  soundsEnabled: boolean;
}

interface ChampionStats {
  level: number;
  xp: number;
  nextLevelXp: number;
}

interface ChampionContextValue {
  settings: ChampionSettings;
  updateSettings: (next: Partial<ChampionSettings>) => void;
  stats: ChampionStats;
  mode: ChampionMode;
}

interface Position {
  x: number;
  y: number;
}

interface EffectState {
  id: string;
  type: 'q' | 'w' | 'e' | 'r' | 'pentakill' | 'move';
  x: number;
  y: number;
  angle?: number;
}

const SETTINGS_KEY = 'prism-champion-settings';
const STATS_KEY = 'prism-champion-stats';
const POSITION_KEY = 'prism-champion-position';
const BASE_SPEED = 200;
const SCALE_TO_SIZE: Record<ChampionScale, number> = {
  small: 132,
  normal: 172,
  large: 212,
};

const ABILITY_COOLDOWNS: Record<AbilityKey, number> = {
  q: 8,
  w: 15,
  e: 5,
  r: 60,
};

const DEFAULT_SETTINGS: ChampionSettings = {
  enabled: true,
  champion: 'lucian',
  renderScale: 'normal',
  passiveBehavior: 'active',
  eventReactions: 'all',
  rangeRadius: 300,
  showCooldowns: true,
  soundsEnabled: true,
};

const XP_FOR_ACTION: Record<string, number> = {
  TASK_COMPLETED: 10,
  GOAL_CREATED: 25,
  EXERCISE_COMPLETED: 15,
  APPLICATION_SENT: 30,
  FOCUS_END: 50,
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

export function useChampion() {
  const context = useContext(ChampionContext);
  if (!context) {
    throw new Error('useChampion must be used within ChampionProvider');
  }
  return context;
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
  const championColor = `${championConfig.colors.primaryFrom} ${championConfig.colors.primaryTo}`;
  const spriteRow = animationRow(animation);
  const frameSize = championConfig.frameSize;
  const abilityColors = championConfig.colors;
  const spriteStyle = {
    width: championSize,
    height: championSize,
    backgroundImage: `url(${championConfig.spriteSheet})`,
    backgroundSize: `${frameSize * championConfig.sheetColumns}px ${frameSize * championConfig.sheetRows}px`,
    backgroundPosition: `-${frame * frameSize}px -${spriteRow * frameSize}px`,
    imageRendering: 'pixelated' as const,
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[68] select-none">
      {mode === 'active' && (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            boxShadow: `inset 0 0 0 2px ${hexToRgba(abilityColors.q, 0.45)}, inset 0 0 42px ${hexToRgba(abilityColors.q, 0.22)}`,
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

      {rangeActive && (
        <motion.div
          className="absolute rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            width: settings.rangeRadius * 2,
            height: settings.rangeRadius * 2,
            left: position.x + championSize / 2 - settings.rangeRadius,
            top: position.y + championSize / 2 - settings.rangeRadius,
            border: `1px solid ${hexToRgba(abilityColors.q, 0.55)}`,
            backgroundColor: hexToRgba(abilityColors.q, 0.12),
          }}
        />
      )}

      <motion.button
        onClick={onChampionClick}
        data-champion-sprite="true"
        className="pointer-events-auto absolute rounded-full"
        style={{ left: position.x, top: position.y }}
        animate={{ x: 0, y: 0 }}
      >
        <motion.div
          className={`relative rounded-full border border-white/20 bg-gradient-to-br ${championColor} shadow-[0_0_30px_rgba(56,189,248,0.35)]`}
          style={spriteStyle}
        >
          <div
            className="absolute inset-0 rounded-full border border-white/20"
            style={{ transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}
          />
          {mode === 'active' && (
            <motion.div
              className="absolute -inset-2 rounded-full border-2"
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.96, 1.06, 0.96] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                borderColor: hexToRgba(abilityColors.q, 0.68),
              }}
            />
          )}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            {stats.level}
          </div>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {effects.map((effect) => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute"
            style={{ left: effect.x, top: effect.y }}
          >
            {effect.type === 'q' && (
              <div
                className="h-1 w-72 origin-left rounded-full"
                style={{
                  transform: `rotate(${effect.angle ?? 0}deg)`,
                  background: `linear-gradient(to right, ${hexToRgba(abilityColors.q, 0.95)}, ${hexToRgba(abilityColors.q, 0.75)}, transparent)`,
                  boxShadow: `0 0 16px ${hexToRgba(abilityColors.q, 0.8)}`,
                }}
              />
            )}
            {effect.type === 'w' && (
              <div
                className="h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  border: `1px solid ${hexToRgba(abilityColors.w, 0.65)}`,
                  backgroundColor: hexToRgba(abilityColors.w, 0.16),
                  boxShadow: `0 0 30px ${hexToRgba(abilityColors.w, 0.35)}`,
                }}
              />
            )}
            {effect.type === 'e' && (
              <div
                className="h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm"
                style={{ backgroundColor: hexToRgba(abilityColors.e, 0.32) }}
              />
            )}
            {effect.type === 'r' && (
              <div
                className="h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  border: `1px solid ${hexToRgba(abilityColors.r, 0.5)}`,
                  backgroundColor: hexToRgba(abilityColors.r, 0.12),
                  boxShadow: `0 0 40px ${hexToRgba(abilityColors.r, 0.45)}`,
                }}
              />
            )}
            {effect.type === 'move' && (
              <div
                className="h-10 w-10 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-2 border-r-2"
                style={{ borderColor: hexToRgba(abilityColors.e, 0.85) }}
              />
            )}
            {effect.type === 'pentakill' && (
              <div className="pointer-events-none -translate-x-1/2 -translate-y-1/2 text-4xl font-black tracking-[0.25em] text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,0.8)]">
                PENTAKILL
              </div>
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
                {key === 'q' ? 'Light' : key === 'w' ? 'Shield' : key === 'e' ? 'Dash' : 'Ult'}
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
  const [position, setPosition] = useState<Position>(() => nearestViewportPosition());
  const [targetPosition, setTargetPosition] = useState<Position>(() => nearestViewportPosition());
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
  const randomWalkTimeoutRef = useRef<number | null>(null);
  const moveRafRef = useRef<number | null>(null);
  const taskStreakRef = useRef(0);
  const wActiveRef = useRef(false);

  const championSize = SCALE_TO_SIZE[settings.renderScale];

  const updateSettings = useCallback((next: Partial<ChampionSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const addEffect = useCallback((effect: Omit<EffectState, 'id'>, ttl = 700) => {
    const id = `${effect.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextEffect: EffectState = { ...effect, id };
    setEffects((prev) => [...prev, nextEffect]);
    window.setTimeout(() => {
      setEffects((prev) => prev.filter((entry) => entry.id !== id));
    }, ttl);
  }, []);

  const markElementsInRange = useCallback((radius: number) => {
    const elements = document.querySelectorAll<HTMLElement>('[data-interactive]');
    const center = {
      x: position.x + championSize / 2,
      y: position.y + championSize / 2,
    };

    let nearest: HTMLElement | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elementCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const distance = Math.hypot(elementCenter.x - center.x, elementCenter.y - center.y);
      if (distance <= radius) {
        element.setAttribute('data-champion-in-range', 'true');
        if (distance < nearestDistance) {
          nearest = element;
          nearestDistance = distance;
        }
      } else {
        element.removeAttribute('data-champion-in-range');
      }
    });

    elements.forEach((element) => {
      element.removeAttribute('data-champion-focus');
      if (wActiveRef.current) {
        element.setAttribute('data-champion-dimmed', 'true');
      } else {
        element.removeAttribute('data-champion-dimmed');
      }
    });

    const nearestElement = nearest as HTMLElement | null;
    if (wActiveRef.current && nearestElement) {
      nearestElement.setAttribute('data-champion-focus', 'true');
      nearestElement.removeAttribute('data-champion-dimmed');
    }
  }, [championSize, position.x, position.y]);

  const markElementsOnBeam = useCallback((angleDeg: number) => {
    const elements = document.querySelectorAll<HTMLElement>('[data-interactive]');
    const start = {
      x: position.x + championSize / 2,
      y: position.y + championSize / 2,
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
  }, [championSize, position.x, position.y]);

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

    if (settings.soundsEnabled) {
      if (ability === 'q') play('champ-q');
      if (ability === 'w') play('champ-w');
      if (ability === 'e') play('champ-e');
      if (ability === 'r') play('champ-r');
    }

    if (ability === 'q') {
      setAnimation('cast_q');
      const center = { x: position.x + championSize / 2, y: position.y + championSize / 2 };
      const angle = (Math.atan2(pointerRef.current.y - center.y, pointerRef.current.x - center.x) * 180) / Math.PI;
      addEffect({ type: 'q', x: center.x, y: center.y, angle }, 450);
      markElementsOnBeam(angle);
      startCooldown('q');
      window.setTimeout(() => setAnimation(isMoving ? 'walk' : 'idle'), 320);
      return;
    }

    if (ability === 'w') {
      setAnimation('cast_w');
      const center = { x: position.x + championSize / 2, y: position.y + championSize / 2 };
      addEffect({ type: 'w', x: center.x, y: center.y }, 1000);
      wActiveRef.current = true;
      markElementsInRange(settings.rangeRadius);
      startCooldown('w');
      window.setTimeout(() => {
        wActiveRef.current = false;
        markElementsInRange(settings.rangeRadius);
      }, 5000);
      window.setTimeout(() => setAnimation(isMoving ? 'walk' : 'idle'), 320);
      return;
    }

    if (ability === 'e') {
      setAnimation('cast_e');
      const target = clampToViewport(
        { x: pointerRef.current.x - championSize / 2, y: pointerRef.current.y - championSize / 2 },
        championSize
      );
      addEffect({ type: 'e', x: position.x + championSize / 2, y: position.y + championSize / 2 }, 400);
      setPosition(target);
      setTargetPosition(target);
      localStorage.setItem(POSITION_KEY, JSON.stringify(target));
      startCooldown('e');
      window.setTimeout(() => setAnimation('idle'), 220);
      return;
    }

    if (ability === 'r') {
      setAnimation('cast_r');
      const center = { x: position.x + championSize / 2, y: position.y + championSize / 2 };
      addEffect({ type: 'r', x: center.x, y: center.y }, 900);
      const elements = document.querySelectorAll<HTMLElement>('[data-interactive]');
      elements.forEach((element) => {
        element.setAttribute('data-champion-targeted', 'true');
        window.setTimeout(() => element.removeAttribute('data-champion-targeted'), 1200);
      });
      if (taskStreakRef.current >= 5) {
        addEffect({ type: 'pentakill', x: window.innerWidth / 2, y: window.innerHeight / 3 }, 1700);
        dispatchChampionEvent({ type: 'PENTAKILL', count: taskStreakRef.current });
        if (settings.soundsEnabled) play('champ-pentakill');
      }
      startCooldown('r');
      window.setTimeout(() => setAnimation('victory'), 260);
      window.setTimeout(() => setAnimation(isMoving ? 'walk' : 'idle'), 1000);
    }
  }, [
    addEffect,
    championSize,
    cooldownReadyAt,
    isMoving,
    markElementsInRange,
    markElementsOnBeam,
    play,
    position.x,
    position.y,
    settings.rangeRadius,
    settings.soundsEnabled,
    startCooldown,
  ]);

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    const savedStats = localStorage.getItem(STATS_KEY);
    const savedPosition = localStorage.getItem(POSITION_KEY);
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(savedSettings) as Partial<ChampionSettings>) });
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
        setPosition(clampToViewport(parsed, championSize));
        setTargetPosition(clampToViewport(parsed, championSize));
      } catch {
        // ignore
      }
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
        setAnimation('victory');
        if (settings.soundsEnabled) play('champ-victory');
      }

      if (event.type === 'GOAL_CREATED') {
        setAnimation('victory');
      }

      if (event.type === 'DEADLINE_WARNING') {
        setAnimation('panic');
        if (settings.soundsEnabled) play('champ-panic');
      }

      if (event.type === 'FOCUS_START') {
        setAnimation('meditate');
        if (settings.soundsEnabled) play('champ-focus');
      }

      if (event.type === 'FOCUS_END') {
        setAnimation('idle');
      }

      if (event.type === 'PAGE_CHANGE') {
        addEffect({ type: 'move', x: position.x + championSize / 2, y: position.y + championSize / 2 }, 240);
      }

      if (event.type === 'LEVEL_UP') {
        setAnimation('recall');
        if (settings.soundsEnabled) play('champ-level-up');
      }

      const xpDelta = XP_FOR_ACTION[event.type] ?? 0;
      if (xpDelta > 0) {
        awardXp(xpDelta);
      }

      window.setTimeout(() => {
        setAnimation((current) => (current === 'walk' ? 'walk' : 'idle'));
      }, 900);
    });
    return unsubscribe;
  }, [addEffect, awardXp, championSize, play, position.x, position.y, settings.eventReactions, settings.soundsEnabled]);

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
      setDirection(target.x < position.x ? 'left' : 'right');
      setAnimation('walk');
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
  }, [addEffect, championSize, mode, play, position.x, rangeActive, settings.enabled, settings.soundsEnabled]);

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
        setRangeActive(true);
        markElementsInRange(settings.rangeRadius);
        return;
      }
      if (key === 'q' || key === 'w' || key === 'e' || key === 'r') {
        event.preventDefault();
        castAbility(key as AbilityKey);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'x') {
        setRangeActive(false);
        cleanupInteractiveAttrs();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [castAbility, markElementsInRange, mode, settings.enabled, settings.rangeRadius]);

  useEffect(() => {
    if (!rangeActive) return;
    const id = window.setInterval(() => {
      markElementsInRange(settings.rangeRadius);
    }, 120);
    return () => window.clearInterval(id);
  }, [markElementsInRange, rangeActive, settings.rangeRadius]);

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
          setAnimation('idle');
          localStorage.setItem(POSITION_KEY, JSON.stringify(current));
          return current;
        }
        const move = Math.min(distance, BASE_SPEED * dt);
        return {
          x: current.x + (dx / distance) * move,
          y: current.y + (dy / distance) * move,
        };
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
      const delay = 30000 + Math.random() * 30000;
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
        setDirection(target.x < position.x ? 'left' : 'right');
        setIsMoving(true);
        setAnimation('walk');
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (randomWalkTimeoutRef.current) window.clearTimeout(randomWalkTimeoutRef.current);
      randomWalkTimeoutRef.current = null;
    };
  }, [championSize, mode, position.x, settings.enabled, settings.passiveBehavior]);

  useEffect(() => {
    if (settings.enabled) return;
    cleanupInteractiveAttrs();
    setMode('passive');
    setRangeActive(false);
  }, [settings.enabled]);

  const contextValue = useMemo<ChampionContextValue>(() => ({
    settings,
    updateSettings,
    stats,
    mode,
  }), [mode, settings, stats, updateSettings]);

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
        onChampionClick={() => setMode((prev) => (prev === 'active' ? 'passive' : 'active'))}
      />
    </ChampionContext.Provider>
  );
}
