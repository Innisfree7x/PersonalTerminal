import type { LucianMood } from './copy';

// ─── Context types ────────────────────────────────────────────────────────────

export interface LucianCourse {
  name: string;
  examDate?: string | null;       // ISO date string 'YYYY-MM-DD'
  numExercises?: number | null;
}

export interface LucianTask {
  title: string;
  completed: boolean;
  date: string; // ISO date 'YYYY-MM-DD'
}

export interface LucianSession {
  startedAt: string;              // ISO datetime
  durationSeconds: number;
}

export interface LucianApplication {
  company: string;
  status: string;
  updatedAt: string;              // ISO datetime
}

export interface LucianContext {
  courses: LucianCourse[];
  todayTasks: LucianTask[];
  recentSessions: LucianSession[];  // last 7 days
  applications: LucianApplication[];
  nowIso?: string;                  // override for testing; defaults to new Date()
}

export interface LucianHint {
  text: string;
  mood: LucianMood;
  priority: 0 | 1 | 2 | 3;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today(nowIso?: string): Date {
  return nowIso ? new Date(nowIso) : new Date();
}

function daysUntil(dateStr: string, nowIso?: string): number {
  const now = today(nowIso);
  const target = new Date(dateStr);
  const diffMs = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function hoursSince(isoDatetime: string, nowIso?: string): number {
  const now = today(nowIso).getTime();
  const then = new Date(isoDatetime).getTime();
  return (now - then) / (1000 * 60 * 60);
}

function daysSince(isoDatetime: string, nowIso?: string): number {
  return hoursSince(isoDatetime, nowIso) / 24;
}

function currentHour(nowIso?: string): number {
  return today(nowIso).getHours();
}

function todayStr(nowIso?: string): string {
  return today(nowIso).toISOString().slice(0, 10);
}

// ─── Hint logic (priority order: 0 = highest) ────────────────────────────────

/**
 * Returns the single most relevant contextual hint for Lucian to show,
 * or null if nothing is urgent enough to interrupt.
 *
 * Priority order:
 *  0 — Prüfung in ≤ 2 Tagen (critical)
 *  1 — Prüfung in ≤ 7 Tagen + lange keine Focus-Session
 *  2 — Prüfung in ≤ 14 Tagen (frühe Warnung)
 *  3 — Heute keine Aufgabe erledigt + nach 14 Uhr
 *  4 — Bewerbung > 14 Tage ohne Update
 *  5 — null (Lucian schweigt lieber als zu nerven)
 */
export function getLucianHint(ctx: LucianContext): LucianHint | null {
  const { courses, todayTasks, recentSessions, applications, nowIso } = ctx;

  // ── P0: Prüfung in ≤ 2 Tagen ─────────────────────────────────────────────
  for (const course of courses) {
    if (!course.examDate) continue;
    const days = daysUntil(course.examDate, nowIso);
    if (days >= 0 && days <= 2) {
      const name = course.name;
      if (days === 0) {
        return {
          text: `${name} — heute. Ich hoffe du bist bereit.`,
          mood: 'warning',
          priority: 0,
        };
      }
      if (days === 1) {
        return {
          text: `Prüfung ${name} ist morgen. Was machst du noch hier?`,
          mood: 'warning',
          priority: 0,
        };
      }
      return {
        text: `${name} in 2 Tagen. Panik ist kein Plan — Fokus schon.`,
        mood: 'warning',
        priority: 0,
      };
    }
  }

  // ── P1: Prüfung in ≤ 7 Tagen + letzte Session > 2 Tage zurück ────────────
  const lastSession = recentSessions
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
  const daysSinceLastSession = lastSession
    ? daysSince(lastSession.startedAt, nowIso)
    : 999;

  for (const course of courses) {
    if (!course.examDate) continue;
    const days = daysUntil(course.examDate, nowIso);
    if (days >= 3 && days <= 7) {
      if (daysSinceLastSession >= 2) {
        return {
          text: `${course.name} in ${days} Tagen. Letzte Session vor ${Math.floor(daysSinceLastSession)} Tagen. Das passt nicht zusammen.`,
          mood: 'warning',
          priority: 1,
        };
      }
      return {
        text: `${course.name} in ${days} Tagen. Du machst das richtig — bleib dran.`,
        mood: 'motivate',
        priority: 1,
      };
    }
  }

  // ── P2: Prüfung in ≤ 14 Tagen (frühe Warnung) ────────────────────────────
  for (const course of courses) {
    if (!course.examDate) continue;
    const days = daysUntil(course.examDate, nowIso);
    if (days >= 8 && days <= 14) {
      return {
        text: `${course.name} in ${days} Tagen. Früh anfangen ist kein Luxus.`,
        mood: 'idle',
        priority: 2,
      };
    }
  }

  // ── P3: Heute keine Aufgabe erledigt + nach 14 Uhr ───────────────────────
  const hour = currentHour(nowIso);
  const todayDateStr = todayStr(nowIso);
  const todayDone = todayTasks.filter(
    (t) => t.completed && t.date === todayDateStr,
  ).length;
  const todayOpen = todayTasks.filter(
    (t) => !t.completed && t.date === todayDateStr,
  ).length;

  if (hour >= 14 && todayDone === 0 && todayOpen > 0) {
    return {
      text:
        todayOpen === 1
          ? 'Noch nichts erledigt. Eine Aufgabe. Das reicht für heute.'
          : `Noch nichts erledigt. ${todayOpen} Aufgaben stehen noch aus.`,
      mood: 'warning',
      priority: 3,
    };
  }

  // ── P4: Bewerbung > 14 Tage ohne Update ──────────────────────────────────
  const staleApp = applications
    .filter((a) => a.status !== 'offer' && a.status !== 'rejected')
    .find((a) => daysSince(a.updatedAt, nowIso) >= 14);

  if (staleApp) {
    const days = Math.floor(daysSince(staleApp.updatedAt, nowIso));
    return {
      text: `${staleApp.company} — ${days} Tage ohne Rückmeldung. Follow-up ist keine Schwäche.`,
      mood: 'idle',
      priority: 3,
    };
  }

  // ── Kein Trigger — Lucian schweigt ───────────────────────────────────────
  return null;
}
