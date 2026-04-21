import type { TrajectoryGoalPlanInput } from '@/lib/trajectory/types';

export interface CrisisCollision {
  code:
    | 'FIXED_WINDOW_COLLISION'
    | 'FIXED_BLOCKS_PREP'
    | 'NO_FLEXIBLE_SLOT'
    | 'LEAD_TIME_TOO_SHORT';
  severity: 'critical';
  conflictingGoalIds: string[];
  window: { startDate: string; endDate: string };
  message: string;
}

export interface CrisisReport {
  collisions: CrisisCollision[];
  hasCrisis: boolean;
}

export interface DetectCrisesInput {
  goals: TrajectoryGoalPlanInput[];
  today?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

interface FixedBlock {
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  type: 'fixed';
}

interface PrepBlock {
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  type: 'leadtime' | 'flexible';
}

const CAPACITY_FOR_FLEXIBLE_PREP = 20;

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isActive(g: TrajectoryGoalPlanInput): boolean {
  return g.status === 'active';
}

function buildFixedBlocks(goals: TrajectoryGoalPlanInput[], today: string): FixedBlock[] {
  const todayMs = parseIsoDate(today).getTime();
  return goals
    .filter(isActive)
    .filter((g): g is Extract<TrajectoryGoalPlanInput, { commitmentMode: 'fixed' }> =>
      g.commitmentMode === 'fixed'
    )
    .filter((g) => parseIsoDate(g.fixedEndDate).getTime() >= todayMs)
    .map((g) => ({
      goalId: g.id,
      title: g.title,
      startDate: g.fixedStartDate,
      endDate: g.fixedEndDate,
      type: 'fixed' as const,
    }));
}

function buildLeadTimeBlocks(
  goals: TrajectoryGoalPlanInput[],
  today: string
): PrepBlock[] {
  const todayMs = parseIsoDate(today).getTime();
  return goals
    .filter(isActive)
    .filter((g): g is Extract<TrajectoryGoalPlanInput, { commitmentMode: 'lead-time' }> =>
      g.commitmentMode === 'lead-time'
    )
    .filter((g) => parseIsoDate(g.dueDate).getTime() >= todayMs)
    .map((g) => {
      const due = parseIsoDate(g.dueDate);
      const prepEnd = addUtcDays(due, -(g.bufferWeeks * 7));
      const prepStart = addUtcDays(prepEnd, -(g.leadTimeWeeks * 7));
      return {
        goalId: g.id,
        title: g.title,
        startDate: toIsoDate(prepStart),
        endDate: toIsoDate(prepEnd),
        type: 'leadtime' as const,
      };
    });
}

function buildFlexiblePrepBlocks(
  goals: TrajectoryGoalPlanInput[],
  today: string
): PrepBlock[] {
  const todayMs = parseIsoDate(today).getTime();
  return goals
    .filter(isActive)
    .filter((g): g is Extract<TrajectoryGoalPlanInput, { commitmentMode: 'flexible' }> =>
      g.commitmentMode === 'flexible'
    )
    .filter((g) => parseIsoDate(g.dueDate).getTime() >= todayMs)
    .map((g) => {
      const due = parseIsoDate(g.dueDate);
      const requiredWeeks = Math.max(
        1,
        Math.ceil(g.effortHours / CAPACITY_FOR_FLEXIBLE_PREP)
      );
      const prepEnd = addUtcDays(due, -(g.bufferWeeks * 7));
      const prepStart = addUtcDays(prepEnd, -(requiredWeeks * 7));
      return {
        goalId: g.id,
        title: g.title,
        startDate: toIsoDate(prepStart),
        endDate: toIsoDate(prepEnd),
        type: 'flexible' as const,
      };
    });
}

function overlapsInclusive(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string }
): boolean {
  const aStart = parseIsoDate(a.startDate).getTime();
  const aEnd = parseIsoDate(a.endDate).getTime();
  const bStart = parseIsoDate(b.startDate).getTime();
  const bEnd = parseIsoDate(b.endDate).getTime();
  return Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);
}

interface DateInterval {
  start: number;
  end: number;
}

function subtractIntervals(
  free: DateInterval,
  blockers: DateInterval[]
): DateInterval[] {
  let slots: DateInterval[] = [free];
  for (const b of blockers.slice().sort((x, y) => x.start - y.start)) {
    const next: DateInterval[] = [];
    for (const s of slots) {
      if (b.end < s.start || b.start > s.end) {
        next.push(s);
        continue;
      }
      if (b.start > s.start) next.push({ start: s.start, end: b.start - DAY_MS });
      if (b.end < s.end) next.push({ start: b.end + DAY_MS, end: s.end });
    }
    slots = next.filter((s) => s.end >= s.start);
  }
  return slots;
}

export function detectCrises(input: DetectCrisesInput): CrisisReport {
  const today = input.today ?? toIsoDate(new Date());
  const uniqueGoals = Array.from(new Map(input.goals.map((g) => [g.id, g])).values());

  const fixed = buildFixedBlocks(uniqueGoals, today);
  const leadTimePrep = buildLeadTimeBlocks(uniqueGoals, today);
  const flexiblePrep = buildFlexiblePrepBlocks(uniqueGoals, today);
  const collisions: CrisisCollision[] = [];

  for (let i = 0; i < fixed.length; i += 1) {
    for (let j = i + 1; j < fixed.length; j += 1) {
      const a = fixed[i]!;
      const b = fixed[j]!;
      if (overlapsInclusive(a, b)) {
        const ids = [a.goalId, b.goalId].sort();
        const startDate =
          a.startDate < b.startDate ? a.startDate : b.startDate;
        const endDate = a.endDate > b.endDate ? a.endDate : b.endDate;
        collisions.push({
          code: 'FIXED_WINDOW_COLLISION',
          severity: 'critical',
          conflictingGoalIds: ids,
          window: { startDate, endDate },
          message: `„${a.title}" und „${b.title}" haben ein überlappendes festes Zeitfenster.`,
        });
      }
    }
  }

  for (const prep of [...leadTimePrep, ...flexiblePrep]) {
    for (const f of fixed) {
      if (overlapsInclusive(f, prep)) {
        const ids = [prep.goalId, f.goalId].sort();
        const startDate =
          f.startDate < prep.startDate ? f.startDate : prep.startDate;
        const endDate = f.endDate > prep.endDate ? f.endDate : prep.endDate;
        collisions.push({
          code: 'FIXED_BLOCKS_PREP',
          severity: 'critical',
          conflictingGoalIds: ids,
          window: { startDate, endDate },
          message: `„${f.title}" blockiert das Vorbereitungsfenster von „${prep.title}".`,
        });
      }
    }
  }

  for (const g of uniqueGoals) {
    if (!isActive(g) || g.commitmentMode !== 'lead-time') continue;
    const remainingDays = Math.floor(
      (parseIsoDate(g.dueDate).getTime() - parseIsoDate(today).getTime()) / DAY_MS
    );
    const requiredDays = g.leadTimeWeeks * 7;
    if (remainingDays >= 0 && remainingDays < requiredDays) {
      collisions.push({
        code: 'LEAD_TIME_TOO_SHORT',
        severity: 'critical',
        conflictingGoalIds: [g.id],
        window: { startDate: today, endDate: g.dueDate },
        message: `„${g.title}": verbleibende Zeit (${remainingDays} Tage) unterschreitet benötigten Vorlauf (${requiredDays} Tage).`,
      });
    }
  }

  const fixedIntervals: DateInterval[] = fixed.map((f) => ({
    start: parseIsoDate(f.startDate).getTime(),
    end: parseIsoDate(f.endDate).getTime(),
  }));
  for (const g of uniqueGoals) {
    if (!isActive(g) || g.commitmentMode !== 'flexible') continue;
    const dueMs = parseIsoDate(g.dueDate).getTime();
    const todayMs = parseIsoDate(today).getTime();
    if (dueMs < todayMs) continue;
    const prepEnd = dueMs - (g.bufferWeeks * 7) * DAY_MS;
    if (prepEnd < todayMs) {
      collisions.push({
        code: 'NO_FLEXIBLE_SLOT',
        severity: 'critical',
        conflictingGoalIds: [g.id],
        window: { startDate: today, endDate: g.dueDate },
        message: `„${g.title}": kein freier Zeitraum zwischen heute und Fälligkeit.`,
      });
      continue;
    }
    const requiredDays = Math.max(
      1,
      Math.ceil(g.effortHours / CAPACITY_FOR_FLEXIBLE_PREP)
    ) * 7;
    const free = { start: todayMs, end: prepEnd };
    const slots = subtractIntervals(free, fixedIntervals);
    const largest = slots.reduce(
      (max, s) => Math.max(max, (s.end - s.start) / DAY_MS + 1),
      0
    );
    if (largest < requiredDays) {
      collisions.push({
        code: 'NO_FLEXIBLE_SLOT',
        severity: 'critical',
        conflictingGoalIds: [g.id],
        window: { startDate: today, endDate: g.dueDate },
        message: `„${g.title}": keine zusammenhängende Lücke von ${requiredDays} Tagen zwischen heute und Fälligkeit.`,
      });
    }
  }

  const seen = new Set<string>();
  const deduped: CrisisCollision[] = [];
  for (const c of collisions) {
    const key = `${c.code}|${c.conflictingGoalIds.join(',')}|${c.window.startDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(c);
  }
  deduped.sort((a, b) => {
    if (a.window.startDate !== b.window.startDate) {
      return a.window.startDate.localeCompare(b.window.startDate);
    }
    return (a.conflictingGoalIds[0] ?? '').localeCompare(b.conflictingGoalIds[0] ?? '');
  });

  return { collisions: deduped, hasCrisis: deduped.length > 0 };
}
