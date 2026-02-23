'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Crosshair, Target, Timer, Trophy, X } from 'lucide-react';
import { useAppSound } from '@/lib/hooks/useAppSound';
import {
  createTarget,
  nextComboOnHit,
  pruneExpiredTargets,
  resetComboOnMiss,
  scoreForHit,
  type DrillResult,
  type DrillTarget,
} from '@/lib/lucian/game/targetDrill';

const TARGET_TTL_MS = 1_600;
const SPAWN_INTERVAL_MS = 700;
const TICK_INTERVAL_MS = 110;
const MAX_TARGETS = 4;

interface LucianBreakOverlayProps {
  open: boolean;
  durationSeconds?: number;
  onClose: () => void;
  onComplete: (result: DrillResult) => void;
}

function formatSeconds(value: number): string {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function LucianBreakOverlay({
  open,
  durationSeconds = 60,
  onClose,
  onComplete,
}: LucianBreakOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const { play } = useAppSound();
  const [targets, setTargets] = useState<DrillTarget[]>([]);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationSeconds * 1000);
  const [finished, setFinished] = useState(false);
  const startedAtRef = useRef(0);
  const completedRef = useRef(false);

  const finalResult = useMemo<DrillResult>(
    () => ({
      score,
      hits,
      misses,
      maxCombo,
      elapsedMs: Date.now() - startedAtRef.current,
    }),
    [hits, maxCombo, misses, score],
  );

  useEffect(() => {
    if (!open) return;

    setTargets([]);
    setScore(0);
    setHits(0);
    setMisses(0);
    setCombo(0);
    setMaxCombo(0);
    setFinished(false);
    setTimeLeftMs(durationSeconds * 1000);
    startedAtRef.current = Date.now();
    completedRef.current = false;
  }, [durationSeconds, open]);

  useEffect(() => {
    if (!open || finished) return;

    const ticker = window.setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startedAtRef.current;
      const nextTimeLeftMs = Math.max(0, durationSeconds * 1000 - elapsedMs);
      setTimeLeftMs(nextTimeLeftMs);

      setTargets((prev) => {
        const pruned = pruneExpiredTargets(prev, now);
        if (pruned.expired > 0) {
          setMisses((value) => value + pruned.expired);
          setCombo(resetComboOnMiss());
        }
        return pruned.active;
      });

      if (nextTimeLeftMs === 0 && !completedRef.current) {
        completedRef.current = true;
        setFinished(true);
      }
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(ticker);
  }, [durationSeconds, finished, open]);

  useEffect(() => {
    if (!open || finished) return;

    const spawner = window.setInterval(() => {
      setTargets((prev) => {
        if (prev.length >= MAX_TARGETS) return prev;
        return [
          ...prev,
          createTarget(
            Date.now(),
            {
              width: window.innerWidth,
              height: window.innerHeight,
              padding: 84,
              minRadius: 16,
              maxRadius: 30,
            },
            TARGET_TTL_MS,
          ),
        ];
      });
    }, SPAWN_INTERVAL_MS);

    return () => window.clearInterval(spawner);
  }, [finished, open]);

  useEffect(() => {
    if (!finished || !open || !completedRef.current) return;
    onComplete(finalResult);
  }, [finalResult, finished, onComplete, open]);

  const handleTargetHit = useCallback(
    (targetId: string) => {
      if (!open || finished) return;
      setTargets((prev) => prev.filter((target) => target.id !== targetId));
      setHits((value) => value + 1);
      setCombo((prev) => {
        const gain = scoreForHit(prev);
        setScore((scoreValue) => scoreValue + gain);
        const next = nextComboOnHit(prev);
        setMaxCombo((currentMax) => Math.max(currentMax, next));
        return next;
      });
      play('champ-focus');
    },
    [finished, open, play],
  );

  const handleMiss = useCallback(() => {
    if (!open || finished) return;
    setMisses((value) => value + 1);
    setCombo(resetComboOnMiss());
  }, [finished, open]);

  const title = finished ? 'Lucian Drill abgeschlossen' : 'Lucian Target Drill';
  const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-label="Lucian Break Challenge"
          className="fixed inset-0 z-[81] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(39,75,138,0.22)_0%,rgba(5,7,14,0.95)_64%)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleMiss}
          />

          <div className="pointer-events-none absolute inset-x-0 top-6 z-[82] flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#090c14]/90 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_48px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Break Mode</p>
                  <p className="text-sm font-semibold text-[#FAF0E6]">{title}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-zinc-400 transition hover:text-zinc-200"
                  aria-label="Break-Modus schließen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-zinc-500">Score</p>
                  <p className="mt-0.5 font-semibold text-cyan-200">{score}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-zinc-500">Combo</p>
                  <p className="mt-0.5 font-semibold text-amber-200">x{combo}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-zinc-500">Treffer</p>
                  <p className="mt-0.5 font-semibold text-emerald-200">{hits}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-zinc-500">Zeit</p>
                  <p className="mt-0.5 flex items-center gap-1 font-semibold text-[#FAF0E6]">
                    <Timer className="h-3.5 w-3.5" />
                    {formatSeconds(timeLeftSeconds)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {!finished &&
              targets.map((target) => (
                <motion.button
                  key={target.id}
                  type="button"
                  className="absolute z-[82] grid place-items-center rounded-full border border-cyan-300/70 bg-[radial-gradient(circle,rgba(164,245,255,0.95)_0%,rgba(64,175,255,0.48)_45%,rgba(11,23,44,0.18)_100%)] shadow-[0_0_18px_rgba(56,189,248,0.55)]"
                  style={{
                    width: target.radius * 2,
                    height: target.radius * 2,
                    left: target.x - target.radius,
                    top: target.y - target.radius,
                  }}
                  initial={{ scale: prefersReducedMotion ? 1 : 0.65, opacity: 0.4 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTargetHit(target.id);
                  }}
                >
                  <Target className="h-3.5 w-3.5 text-[#091223]" />
                </motion.button>
              ))}
          </AnimatePresence>

          <AnimatePresence>
            {finished && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-[83] grid place-items-center px-4"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0e18]/95 p-6 text-center shadow-[0_20px_52px_rgba(0,0,0,0.6)]">
                  <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-amber-300/15 text-amber-200">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Session Result</p>
                  <p className="mt-1 text-xl font-semibold text-[#FAF0E6]">{score} Punkte</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                      <p className="text-zinc-500">Treffer</p>
                      <p className="font-semibold text-emerald-200">{hits}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                      <p className="text-zinc-500">Misses</p>
                      <p className="font-semibold text-rose-200">{misses}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                      <p className="text-zinc-500">Max Combo</p>
                      <p className="font-semibold text-amber-200">x{maxCombo}</p>
                    </div>
                  </div>
                  <button
                    className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                    onClick={onClose}
                  >
                    <Crosshair className="h-4 w-4" />
                    Zurück zum Fokus
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

