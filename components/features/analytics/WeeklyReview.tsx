'use client';

import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckSquare,
  Target,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import { fetchFocusAnalytics } from '@/lib/api/focus-sessions';

// ── Date helpers ───────────────────────────────────────────────────────────────

function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function getWeekLabel(): string {
  const today = new Date();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`;
  return `${fmt(mon)} – ${fmt(sun)}${today.getFullYear()}`;
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function parseDateOnly(date: string): Date {
  const [rawYear = '1970', rawMonth = '01', rawDay = '01'] = date.split('-');
  const year = Number.parseInt(rawYear, 10);
  const month = Number.parseInt(rawMonth, 10);
  const day = Number.parseInt(rawDay, 10);

  const safeYear = Number.isFinite(year) ? year : 1970;
  const safeMonth = Number.isFinite(month) ? month : 1;
  const safeDay = Number.isFinite(day) ? day : 1;

  return new Date(safeYear, safeMonth - 1, safeDay);
}

function formatWeekdayShort(date: string): string {
  const value = new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(parseDateOnly(date));
  return value.replace('.', '');
}

// ── Rule-based recommendations ─────────────────────────────────────────────────

interface WeekData {
  focusMinutes: number;
  focusSessions: number;
  focusDaysActive: number;
  taskDone: number;
  taskTotal: number;
  goalsActive: number;
  goalsNearDeadline: number;
  applicationsThisWeek: number;
  applicationsStuck: number;
}

interface Recommendation {
  id: string;
  text: string;
  type: 'positive' | 'warning' | 'neutral';
}

function generateRecommendations(data: WeekData): Recommendation[] {
  const recs: Recommendation[] = [];

  // ── Focus ──────────────────────────────────────────────────────────────────
  if (data.focusDaysActive === 0) {
    recs.push({
      id: 'focus-none',
      text: 'Keine Focus-Session diese Woche — eine einzige Session heute zählt.',
      type: 'warning',
    });
  } else if (data.focusDaysActive <= 2) {
    recs.push({
      id: 'focus-low',
      text: `Nur ${data.focusDaysActive} aktive Tage — Ziel: mindestens 4 Tage mit Session.`,
      type: 'warning',
    });
  } else if (data.focusDaysActive >= 5) {
    recs.push({
      id: 'focus-great',
      text: `${data.focusDaysActive} Fokus-Tage diese Woche. Momentum ist da — halten.`,
      type: 'positive',
    });
  }

  if (data.focusMinutes > 0 && data.focusMinutes < 90) {
    recs.push({
      id: 'focus-short',
      text: 'Unter 90 Minuten Fokuszeit — plane täglich mindestens 1 Pomodoro ein.',
      type: 'warning',
    });
  } else if (data.focusMinutes >= 600) {
    recs.push({
      id: 'focus-strong',
      text: `${formatMinutes(data.focusMinutes)} produktive Zeit — starke Woche.`,
      type: 'positive',
    });
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────
  if (data.taskTotal > 0) {
    const rate = data.taskDone / data.taskTotal;
    if (rate < 0.5) {
      recs.push({
        id: 'task-low',
        text: `${Math.round(rate * 100)}% Tasks erledigt — weniger planen oder früher starten.`,
        type: 'warning',
      });
    } else if (rate >= 0.85) {
      recs.push({
        id: 'task-great',
        text: `${data.taskDone}/${data.taskTotal} Tasks — ${Math.round(rate * 100)}% Completion. Exzellent.`,
        type: 'positive',
      });
    }
  } else {
    recs.push({
      id: 'task-empty',
      text: 'Keine Tasks diese Woche geplant — tägliche Tasks helfen beim Fokus.',
      type: 'neutral',
    });
  }

  // ── Career ─────────────────────────────────────────────────────────────────
  if (data.applicationsThisWeek === 0 && data.applicationsStuck === 0) {
    recs.push({
      id: 'career-quiet',
      text: 'Keine neuen Bewerbungen diese Woche — eine gute Gelegenheit fehlt nicht.',
      type: 'neutral',
    });
  }
  if (data.applicationsStuck > 0) {
    recs.push({
      id: 'career-stuck',
      text: `${data.applicationsStuck} Bewerbung${data.applicationsStuck > 1 ? 'en' : ''} wartet auf Follow-up — nachhaken.`,
      type: 'warning',
    });
  }
  if (data.applicationsThisWeek >= 2) {
    recs.push({
      id: 'career-active',
      text: `${data.applicationsThisWeek} neue Bewerbungen — gute Pipeline-Aktivität.`,
      type: 'positive',
    });
  }

  // ── Goals ──────────────────────────────────────────────────────────────────
  if (data.goalsNearDeadline > 0) {
    recs.push({
      id: 'goals-deadline',
      text: `${data.goalsNearDeadline} Goal${data.goalsNearDeadline > 1 ? 's' : ''} mit Deadline in 7 Tagen — Status prüfen.`,
      type: 'warning',
    });
  }
  if (data.goalsActive === 0) {
    recs.push({
      id: 'goals-none',
      text: 'Keine aktiven Goals — ohne Ziel kein Kurs.',
      type: 'neutral',
    });
  }

  // Fallback if nothing flagged
  if (recs.length === 0) {
    recs.push({
      id: 'all-good',
      text: 'Solide Woche. Nächste Woche: eine Session mehr als diese.',
      type: 'neutral',
    });
  }

  return recs.slice(0, 4);
}

// ── Trend icon ─────────────────────────────────────────────────────────────────

function Trend({ value, prev }: { value: number; prev: number }) {
  if (prev === 0) return null;
  const diff = value - prev;
  if (Math.abs(diff) < prev * 0.05)
    return <Minus className="h-3 w-3 text-zinc-500" />;
  if (diff > 0)
    return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  return <TrendingDown className="h-3 w-3 text-red-400" />;
}

// ── Stat tile ──────────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      </div>
      <p className={`text-xl font-semibold leading-none ${accent}`}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-500">{sub}</p>}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function WeeklyReview() {
  const weekDates = useMemo(() => getWeekDates(), []);
  const weekLabel = useMemo(() => getWeekLabel(), []);

  // Focus analytics — this week + last 2 weeks for comparison
  const focusWeekQuery = useQuery({
    queryKey: ['focus', 'analytics', 7],
    queryFn: () => fetchFocusAnalytics(7),
    staleTime: 5 * 60 * 1000,
  });
  const focusPrevQuery = useQuery({
    queryKey: ['focus', 'analytics', 14],
    queryFn: () => fetchFocusAnalytics(14),
    staleTime: 5 * 60 * 1000,
  });

  // Daily tasks for each of the last 7 days
  const taskQueries = useQueries({
    queries: weekDates.map((date) => ({
      queryKey: ['daily-tasks', date] as const,
      queryFn: async (): Promise<Array<{ completed: boolean }>> => {
        const res = await fetch(`/api/daily-tasks?date=${date}`);
        if (!res.ok) return [];
        return (await res.json()) as Array<{ completed: boolean }>;
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Goals + applications
  const goalsQuery = useQuery({
    queryKey: ['goals', 'weekly-review'],
    queryFn: async () => {
      const res = await fetch('/api/goals?limit=50');
      if (!res.ok) return [];
      const body = (await res.json()) as { goals?: Array<{ status: string; deadline?: string | null }> };
      return body.goals ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const appsQuery = useQuery({
    queryKey: ['applications', 'weekly-review'],
    queryFn: async () => {
      const res = await fetch('/api/applications?limit=50');
      if (!res.ok) return [];
      const body = (await res.json()) as { applications?: Array<{ status: string; updatedAt: string }> };
      return body.applications ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Derive weekly data ───────────────────────────────────────────────────────
  const focusWeek = focusWeekQuery.data;
  const focusPrev = focusPrevQuery.data;

  // Last-week comparison: 14-day data minus this week
  const prevWeekMinutes = focusPrev && focusWeek
    ? Math.max(0, focusPrev.totalMinutes - focusWeek.totalMinutes)
    : 0;

  // Days with at least 1 session this week
  const focusDaysActive = focusWeek?.dailyData?.filter((d) => d.totalMinutes > 0).length ?? 0;

  // Task aggregation across the 7 daily fetches
  const taskDone = taskQueries.reduce((sum, q) => {
    if (!q.data) return sum;
    return sum + (q.data as Array<{ completed: boolean }>).filter((t) => t.completed).length;
  }, 0);
  const taskTotal = taskQueries.reduce((sum, q) => {
    if (!q.data) return sum;
    return sum + (q.data as Array<{ completed: boolean }>).length;
  }, 0);

  // Goals: active + near deadline
  const goals = goalsQuery.data ?? [];
  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(now.getDate() + 7);
  const goalsActive = goals.filter((g) => g.status === 'active' || g.status === 'in_progress').length;
  const goalsNearDeadline = goals.filter((g) => {
    if (!g.deadline) return false;
    const dl = new Date(g.deadline);
    return dl >= now && dl <= in7Days;
  }).length;

  // Applications: new this week + stuck in applied/interview
  const apps = appsQuery.data ?? [];
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const applicationsThisWeek = apps.filter((a) => new Date(a.updatedAt) >= weekAgo).length;
  const applicationsStuck = apps.filter(
    (a) => a.status === 'interview' || a.status === 'applied',
  ).length;

  const weekData: WeekData = {
    focusMinutes: focusWeek?.totalMinutes ?? 0,
    focusSessions: focusWeek?.totalSessions ?? 0,
    focusDaysActive,
    taskDone,
    taskTotal,
    goalsActive,
    goalsNearDeadline,
    applicationsThisWeek,
    applicationsStuck,
  };

  const weeklyFocusDistribution = useMemo(() => {
    const map = new Map((focusWeek?.dailyData ?? []).map((entry) => [entry.date, entry]));
    const today = weekDates[weekDates.length - 1];

    const days = weekDates.map((date) => {
      const item = map.get(date);
      return {
        date,
        label: formatWeekdayShort(date),
        totalMinutes: item?.totalMinutes ?? 0,
        sessions: item?.sessions ?? 0,
        isToday: date === today,
      };
    });

    const maxMinutes = Math.max(...days.map((day) => day.totalMinutes), 1);
    const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0);
    const activeDays = days.filter((day) => day.totalMinutes > 0).length;
    const averageMinutes = Math.round(totalMinutes / days.length);
    let bestDay = null as (typeof days)[number] | null;
    for (const day of days) {
      if (!bestDay || day.totalMinutes > bestDay.totalMinutes) {
        bestDay = day;
      }
    }

    return {
      days,
      maxMinutes,
      totalMinutes,
      activeDays,
      averageMinutes,
      bestDay,
    };
  }, [focusWeek?.dailyData, weekDates]);

  const recommendations = useMemo(
    () => generateRecommendations(weekData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      weekData.focusMinutes,
      weekData.focusSessions,
      weekData.focusDaysActive,
      weekData.taskDone,
      weekData.taskTotal,
      weekData.goalsActive,
      weekData.goalsNearDeadline,
      weekData.applicationsThisWeek,
      weekData.applicationsStuck,
    ],
  );

  const isLoading = focusWeekQuery.isLoading;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Weekly Review"
      className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0d1119]/70 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_32px_rgba(0,0,0,0.32)] backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15">
            <CalendarDays className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Weekly Review</p>
            <p className="text-sm font-semibold text-zinc-200">{weekLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-600">
          <Zap className="h-3 w-3" />
          <span>Rule-based · Montag Reset</span>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : (
          <>
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                icon={Clock}
                label="Fokuszeit"
                value={formatMinutes(weekData.focusMinutes)}
                sub={
                  prevWeekMinutes > 0
                    ? `Vorwoche: ${formatMinutes(prevWeekMinutes)}`
                    : `${weekData.focusSessions} Session${weekData.focusSessions !== 1 ? 'en' : ''}`
                }
                accent="text-cyan-400"
              />
              <StatTile
                icon={CheckSquare}
                label="Tasks"
                value={weekData.taskTotal > 0 ? `${weekData.taskDone}/${weekData.taskTotal}` : '—'}
                sub={
                  weekData.taskTotal > 0
                    ? `${Math.round((weekData.taskDone / weekData.taskTotal) * 100)}% erledigt`
                    : 'Keine Tasks geplant'
                }
                accent="text-emerald-400"
              />
              <StatTile
                icon={Target}
                label="Goals"
                value={String(weekData.goalsActive)}
                sub={
                  weekData.goalsNearDeadline > 0
                    ? `${weekData.goalsNearDeadline} Deadline bald`
                    : 'aktive Goals'
                }
                accent="text-violet-400"
              />
              <StatTile
                icon={Briefcase}
                label="Career"
                value={String(weekData.applicationsThisWeek)}
                sub={
                  weekData.applicationsStuck > 0
                    ? `${weekData.applicationsStuck} warten auf Reply`
                    : 'neue Aktivitäten'
                }
                accent="text-amber-400"
              />
            </div>

            {/* Recommendations */}
            <div className="mt-5">
              <p className="mb-3 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                <Zap className="h-3 w-3 text-amber-400" />
                Empfehlungen für nächste Woche
              </p>
              <ul className="space-y-2">
                {recommendations.map((rec) => (
                  <li
                    key={rec.id}
                    className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13px] leading-snug
                      ${rec.type === 'positive'
                        ? 'border-emerald-300/15 bg-emerald-500/[0.07] text-emerald-200'
                        : rec.type === 'warning'
                        ? 'border-amber-300/15 bg-amber-500/[0.07] text-amber-200'
                        : 'border-white/[0.06] bg-white/[0.02] text-zinc-400'
                      }`}
                  >
                    <ChevronRight
                      className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0
                        ${rec.type === 'positive' ? 'text-emerald-400'
                        : rec.type === 'warning' ? 'text-amber-400'
                        : 'text-zinc-600'}`}
                    />
                    <span>{rec.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Focus distribution (always 7-day normalized) */}
      <div className="border-t border-white/[0.05] px-5 py-3.5">
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <p className="flex items-center gap-1 text-zinc-500">
            <Trend value={weekData.focusMinutes} prev={prevWeekMinutes} />
            Fokus-Verteilung (7 Tage)
          </p>
          <p className="text-zinc-500">
            {formatMinutes(weeklyFocusDistribution.totalMinutes)} total · Ø {formatMinutes(weeklyFocusDistribution.averageMinutes)}
          </p>
        </div>

        <div className="mt-2.5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {weeklyFocusDistribution.days.map((day) => {
            const ratio = day.totalMinutes > 0 ? day.totalMinutes / weeklyFocusDistribution.maxMinutes : 0;
            const barHeight = Math.max(8, Math.round(ratio * 56));

            return (
              <div
                key={day.date}
                title={`${day.label}: ${formatMinutes(day.totalMinutes)} · ${day.sessions} Session${day.sessions === 1 ? '' : 'en'}`}
                className={`rounded-lg border px-1.5 py-2 text-center ${
                  day.isToday ? 'border-amber-300/25 bg-amber-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <div className="flex h-16 items-end justify-center">
                  <div
                    className={`w-5 rounded-t-sm transition-all ${
                      day.totalMinutes > 0
                        ? day.isToday
                          ? 'bg-amber-400/80'
                          : 'bg-cyan-400/70'
                        : 'bg-white/[0.08]'
                    }`}
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
                <p className={`mt-1 text-[10px] uppercase ${day.isToday ? 'text-amber-300' : 'text-zinc-500'}`}>{day.label}</p>
                <p className={`mt-0.5 text-[10px] ${day.totalMinutes > 0 ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {day.totalMinutes > 0 ? formatMinutes(day.totalMinutes) : '0m'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600">
          <span>{weeklyFocusDistribution.activeDays}/7 aktive Tage</span>
          <span>
            {weeklyFocusDistribution.bestDay && weeklyFocusDistribution.bestDay.totalMinutes > 0
              ? `Peak: ${weeklyFocusDistribution.bestDay.label} · ${formatMinutes(weeklyFocusDistribution.bestDay.totalMinutes)}`
              : 'Peak: noch keine Focus-Session'}
          </span>
        </div>
      </div>
    </motion.section>
  );
}
