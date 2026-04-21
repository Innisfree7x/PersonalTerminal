# Crisis Mode Detection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic, pure-function `detectCrises()` module to the Trajectory engine that flags 4 types of long-horizon goal collisions (fixed-fixed overlap, fixed blocking prep, lead-time insufficient, no flexible slot), wire it into `/api/trajectory/plan`, and extend the Goal data model with `commitmentMode` + mode-specific fields.

**Architecture:** New isolated module `lib/trajectory/crisis.ts` consuming the same `TrajectoryGoalPlanInput[]` shape as `computeTrajectoryPlan`. Types extracted into `lib/trajectory/types.ts` as a discriminated union. DB table `trajectory_goals` gets 4 new columns via migration. Zod schema converts to a discriminated union. API route composes planner + crisis outputs into a single response.

**Tech Stack:** Next.js 14 App Router, TypeScript strict (`exactOptionalPropertyTypes: true`), Supabase (Postgres + RLS via `@supabase/ssr`), Zod, Vitest, Husky pre-commit.

**Spec reference:** `docs/superpowers/specs/2026-04-19-crisis-mode-design.md`

---

## File Structure

**Create:**
- `supabase/migrations/20260419_crisis_mode.sql` — add commitment mode columns + CHECK constraint
- `lib/trajectory/types.ts` — discriminated union for `TrajectoryGoalPlanInput`
- `lib/trajectory/crisis.ts` — pure-function `detectCrises()` with 5 passes
- `tests/unit/trajectory-crisis.test.ts` — 7 scenarios + 15 edge cases + determinism

**Modify:**
- `lib/trajectory/planner.ts` — move `TrajectoryGoalPlanInput` to `types.ts`, import it instead
- `lib/schemas/trajectory.schema.ts` — discriminated Zod union for goal create/update
- `lib/supabase/trajectory.ts` — extend `TrajectoryGoalRecord`, mapper, insert, update
- `app/api/trajectory/plan/route.ts` — call `detectCrises`, add `crisis` to response
- `tests/unit/trajectory-planner.test.ts` — migrate fixtures to new discriminated shape
- `tests/unit/api/trajectory-plan.test.ts` — assert `crisis` field in response

**Out of scope for this plan (future phases):**
- UI integration (Morning Briefing, Trajectory page, Goal-Creation form)
- Cron job `/api/cron/trajectory-crisis-daily`
- `user_notifications` schema work

---

## Phase 1 — Foundation (non-breaking)

### Task 1: DB Migration File

**Files:**
- Create: `supabase/migrations/20260419_crisis_mode.sql`

- [ ] **Step 1: Check existing migrations for naming convention**

Run: `ls supabase/migrations/ | tail -5`
Expected: see recent migration filenames (e.g., `YYYYMMDD_description.sql`).
If the convention differs, adjust the new file name accordingly before creating it.

- [ ] **Step 2: Write migration SQL**

Create `supabase/migrations/20260419_crisis_mode.sql`:

```sql
-- Crisis Mode: extend trajectory_goals with commitment mode fields.
-- All existing rows default to 'flexible' (current behavior).

ALTER TABLE trajectory_goals
  ADD COLUMN commitment_mode TEXT NOT NULL DEFAULT 'flexible'
    CHECK (commitment_mode IN ('fixed','flexible','lead-time')),
  ADD COLUMN fixed_start_date DATE NULL,
  ADD COLUMN fixed_end_date DATE NULL,
  ADD COLUMN lead_time_weeks INT NULL
    CHECK (lead_time_weeks IS NULL OR lead_time_weeks BETWEEN 1 AND 104);

ALTER TABLE trajectory_goals
  ADD CONSTRAINT trajectory_goals_mode_fields CHECK (
    (commitment_mode = 'fixed'
      AND fixed_start_date IS NOT NULL
      AND fixed_end_date   IS NOT NULL
      AND fixed_end_date  >= fixed_start_date) OR
    (commitment_mode = 'flexible'
      AND due_date IS NOT NULL) OR
    (commitment_mode = 'lead-time'
      AND due_date IS NOT NULL
      AND lead_time_weeks IS NOT NULL)
  );
```

- [ ] **Step 3: Verify migration syntax locally (no apply)**

Run: `npx --yes @supabase/cli@latest db lint supabase/migrations/20260419_crisis_mode.sql` *(if available; otherwise skip — Supabase CLI is optional dev-time)*

If lint not available, visually verify: 4 new columns, 1 new CHECK constraint, all additive.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260419_crisis_mode.sql
git commit -m "feat(db): add commitment_mode fields to trajectory_goals"
```

---

### Task 2: TypeScript Types Module

**Files:**
- Create: `lib/trajectory/types.ts`

- [ ] **Step 1: Create types file**

```ts
// lib/trajectory/types.ts
export type CommitmentMode = 'fixed' | 'flexible' | 'lead-time';

interface TrajectoryGoalBase {
  id: string;
  title: string;
  status: 'active' | 'done' | 'archived';
  effortHours: number;
  bufferWeeks: number;
}

export type TrajectoryGoalPlanInput =
  | (TrajectoryGoalBase & {
      commitmentMode: 'fixed';
      fixedStartDate: string; // YYYY-MM-DD
      fixedEndDate: string;   // YYYY-MM-DD
    })
  | (TrajectoryGoalBase & {
      commitmentMode: 'flexible';
      dueDate: string;        // YYYY-MM-DD
    })
  | (TrajectoryGoalBase & {
      commitmentMode: 'lead-time';
      dueDate: string;        // YYYY-MM-DD (event date)
      leadTimeWeeks: number;  // 1..104
    });
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: **pass** — file is self-contained, no consumers yet.

- [ ] **Step 3: Commit**

```bash
git add lib/trajectory/types.ts
git commit -m "feat(trajectory): add CommitmentMode discriminated-union types"
```

---

## Phase 2 — Crisis Module (TDD, isolated pure function)

### Task 3: Scaffold `crisis.ts` + happy-path test

**Files:**
- Create: `lib/trajectory/crisis.ts`
- Create: `tests/unit/trajectory-crisis.test.ts`

- [ ] **Step 1: Write failing test (empty input → empty report)**

```ts
// tests/unit/trajectory-crisis.test.ts
import { describe, expect, it } from 'vitest';
import { detectCrises } from '@/lib/trajectory/crisis';

describe('detectCrises', () => {
  it('returns empty report when no goals', () => {
    const report = detectCrises({ goals: [], today: '2026-04-19' });
    expect(report.collisions).toEqual([]);
    expect(report.hasCrisis).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: FAIL with `Cannot find module '@/lib/trajectory/crisis'`.

- [ ] **Step 3: Scaffold module with minimal implementation**

```ts
// lib/trajectory/crisis.ts
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

export function detectCrises(_input: DetectCrisesInput): CrisisReport {
  return { collisions: [], hasCrisis: false };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: PASS (1/1).

- [ ] **Step 5: Commit**

```bash
git add lib/trajectory/crisis.ts tests/unit/trajectory-crisis.test.ts
git commit -m "feat(trajectory): scaffold crisis detection module"
```

---

### Task 4: Pass A — FIXED_WINDOW_COLLISION

**Files:**
- Modify: `lib/trajectory/crisis.ts`
- Modify: `tests/unit/trajectory-crisis.test.ts`

- [ ] **Step 1: Add failing tests for Pass A**

Append to `tests/unit/trajectory-crisis.test.ts` inside `describe('detectCrises', ...)`:

```ts
  it('flags two overlapping fixed goals as FIXED_WINDOW_COLLISION', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'Praktikum', status: 'active', effortHours: 640, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
        { id: 'b', title: 'Festival-Job', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-15', fixedEndDate: '2026-10-15' },
      ],
    });
    expect(report.collisions).toHaveLength(1);
    expect(report.collisions[0]?.code).toBe('FIXED_WINDOW_COLLISION');
    expect(report.collisions[0]?.conflictingGoalIds).toEqual(['a', 'b']);
    expect(report.hasCrisis).toBe(true);
  });

  it('does not flag disjoint fixed goals', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'Job1', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
        { id: 'b', title: 'Job2', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-10-01', fixedEndDate: '2026-10-31' },
      ],
    });
    expect(report.collisions).toEqual([]);
  });

  it('deduplicates two fixed goals with identical window', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'A', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
        { id: 'b', title: 'B', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
      ],
    });
    expect(report.collisions).toHaveLength(1);
    expect(report.collisions[0]?.conflictingGoalIds).toEqual(['a', 'b']);
  });
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: 3 new tests FAIL (empty collisions returned).

- [ ] **Step 3: Implement Pass A — replace stub with logic**

Replace the body of `detectCrises` in `lib/trajectory/crisis.ts`:

```ts
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

export function detectCrises(input: DetectCrisesInput): CrisisReport {
  const today = input.today ?? toIsoDate(new Date());
  const uniqueGoals = Array.from(new Map(input.goals.map((g) => [g.id, g])).values());

  const fixed = buildFixedBlocks(uniqueGoals, today);
  const collisions: CrisisCollision[] = [];

  // Pass A: fixed × fixed
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

  return { collisions, hasCrisis: collisions.length > 0 };
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/trajectory/crisis.ts tests/unit/trajectory-crisis.test.ts
git commit -m "feat(trajectory): detect fixed-window collisions (Pass A)"
```

---

### Task 5: Pass B + C — FIXED_BLOCKS_PREP

**Files:**
- Modify: `lib/trajectory/crisis.ts`
- Modify: `tests/unit/trajectory-crisis.test.ts`

- [ ] **Step 1: Add failing tests**

Append to the `describe`:

```ts
  it('flags fixed goal blocking a lead-time prep window as FIXED_BLOCKS_PREP', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'praktikum', title: 'Praktikum', status: 'active', effortHours: 640, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
        { id: 'gmat', title: 'GMAT', status: 'active', effortHours: 200, bufferWeeks: 2,
          commitmentMode: 'lead-time', dueDate: '2027-04-15', leadTimeWeeks: 26 },
      ],
    });
    expect(report.collisions).toHaveLength(1);
    expect(report.collisions[0]?.code).toBe('FIXED_BLOCKS_PREP');
    expect(report.collisions[0]?.conflictingGoalIds).toEqual(['gmat', 'praktikum']);
  });

  it('flags fixed goal blocking a flexible prep window as FIXED_BLOCKS_PREP', () => {
    // Thesis flexible: dueDate 2026-11-30, effort 400h, buffer 2w, capacity 20h/wk
    // requiredWeeks = ceil(400/20) = 20; prepEnd = 2026-11-16; prepStart = 2026-06-29
    // Praktikum fixed: Sept 2026 → overlaps prep window
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'thesis', title: 'Thesis', status: 'active', effortHours: 400, bufferWeeks: 2,
          commitmentMode: 'flexible', dueDate: '2026-11-30' },
        { id: 'praktikum', title: 'Praktikum', status: 'active', effortHours: 640, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
      ],
    });
    expect(report.collisions.some((c) => c.code === 'FIXED_BLOCKS_PREP')).toBe(true);
  });
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: 2 new tests FAIL.

- [ ] **Step 3: Extend crisis.ts with prep-block builders + Pass B+C**

Add at top of the module (after `FixedBlock` interface):

```ts
interface PrepBlock {
  goalId: string;
  title: string;
  startDate: string;
  endDate: string;
  type: 'leadtime' | 'flexible';
}

const CAPACITY_FOR_FLEXIBLE_PREP = 20; // deterministic assumption for crisis detection
// Note: real planner uses user settings; crisis uses a conservative constant
// because it evaluates *whether* a slot CAN exist, not what the planner chooses.
// This matches spec: detection-only, does not affect planning.

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
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
```

In `detectCrises()`, after Pass A, add Pass B+C:

```ts
  const leadTimePrep = buildLeadTimeBlocks(uniqueGoals, today);
  const flexiblePrep = buildFlexiblePrepBlocks(uniqueGoals, today);

  // Pass B + C: fixed × (lead-time prep | flexible prep)
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/trajectory/crisis.ts tests/unit/trajectory-crisis.test.ts
git commit -m "feat(trajectory): detect fixed-blocks-prep collisions (Pass B+C)"
```

---

### Task 6: Pass D — LEAD_TIME_TOO_SHORT

**Files:**
- Modify: `lib/trajectory/crisis.ts`
- Modify: `tests/unit/trajectory-crisis.test.ts`

- [ ] **Step 1: Add failing test**

```ts
  it('flags lead-time goal with insufficient remaining time', () => {
    const report = detectCrises({
      today: '2027-03-01',
      goals: [
        { id: 'gmat', title: 'GMAT', status: 'active', effortHours: 150, bufferWeeks: 1,
          commitmentMode: 'lead-time', dueDate: '2027-04-15', leadTimeWeeks: 26 },
      ],
    });
    expect(report.collisions.some((c) => c.code === 'LEAD_TIME_TOO_SHORT')).toBe(true);
    expect(report.collisions[0]?.conflictingGoalIds).toEqual(['gmat']);
  });
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: new test FAIL.

- [ ] **Step 3: Implement Pass D**

In `detectCrises()`, after Pass B+C, add Pass D:

```ts
  // Pass D: lead-time goals where remaining days < required leadTimeWeeks*7
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/trajectory/crisis.ts tests/unit/trajectory-crisis.test.ts
git commit -m "feat(trajectory): detect insufficient lead-time (Pass D)"
```

---

### Task 7: Pass E — NO_FLEXIBLE_SLOT

**Files:**
- Modify: `lib/trajectory/crisis.ts`
- Modify: `tests/unit/trajectory-crisis.test.ts`

- [ ] **Step 1: Add failing tests**

```ts
  it('flags flexible goal with no free contiguous slot', () => {
    // Thesis flexible: dueDate 2026-07-31, effort 160h, buffer 0, capacity constant 20/wk
    // requiredWeeks = ceil(160/20) = 8 → 56 days
    // Fixed blocks cover today..dueDate entirely in 3-week chunks with gaps ≤ 2 weeks
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'thesis', title: 'Thesis', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'flexible', dueDate: '2026-07-31' },
        { id: 'f1', title: 'Block 1', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-04-20', fixedEndDate: '2026-05-15' },
        { id: 'f2', title: 'Block 2', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-05-20', fixedEndDate: '2026-06-15' },
        { id: 'f3', title: 'Block 3', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-06-18', fixedEndDate: '2026-07-15' },
      ],
    });
    expect(report.collisions.some((c) => c.code === 'NO_FLEXIBLE_SLOT' && c.conflictingGoalIds[0] === 'thesis')).toBe(true);
  });

  it('does not flag flexible goal when an adequate slot exists', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'thesis', title: 'Thesis', status: 'active', effortHours: 160, bufferWeeks: 0,
          commitmentMode: 'flexible', dueDate: '2026-12-31' }, // lots of time
      ],
    });
    expect(report.collisions.some((c) => c.code === 'NO_FLEXIBLE_SLOT')).toBe(false);
  });
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: the no-slot test FAILs.

- [ ] **Step 3: Implement slot-finding + Pass E**

Add helper above `detectCrises`:

```ts
interface DateInterval {
  start: number; // ms
  end: number;   // ms
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
```

In `detectCrises()`, after Pass D, add Pass E:

```ts
  // Pass E: flexible goals that have no free contiguous slot >= requiredWeeks*7 days
  const fixedIntervals: DateInterval[] = fixed.map((f) => ({
    start: parseIsoDate(f.startDate).getTime(),
    end: parseIsoDate(f.endDate).getTime(),
  }));
  for (const g of uniqueGoals) {
    if (!isActive(g) || g.commitmentMode !== 'flexible') continue;
    const dueMs = parseIsoDate(g.dueDate).getTime();
    const todayMs = parseIsoDate(today).getTime();
    if (dueMs < todayMs) continue; // past-due: LATE_START handled elsewhere
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/trajectory/crisis.ts tests/unit/trajectory-crisis.test.ts
git commit -m "feat(trajectory): detect missing flexible slots (Pass E)"
```

---

### Task 8: Phase 3 — Stable Sort + Dedup

**Files:**
- Modify: `lib/trajectory/crisis.ts`
- Modify: `tests/unit/trajectory-crisis.test.ts`

- [ ] **Step 1: Add failing test for sort order**

```ts
  it('sorts collisions by window.startDate ascending', () => {
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'A', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-11-01', fixedEndDate: '2026-11-30' },
        { id: 'b', title: 'B', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-11-15', fixedEndDate: '2026-12-15' },
        { id: 'c', title: 'C', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-08-01', fixedEndDate: '2026-08-31' },
        { id: 'd', title: 'D', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-08-15', fixedEndDate: '2026-09-15' },
      ],
    });
    const starts = report.collisions.map((c) => c.window.startDate);
    const sorted = [...starts].sort();
    expect(starts).toEqual(sorted);
  });

  it('dedups identical (code, ids, startDate) tuples', () => {
    // Two fixed goals overlapping: Pass A emits once (inner loop i<j), ensure Phase-3 dedup
    // doesn't introduce drift when same tuple would appear twice from different passes.
    const report = detectCrises({
      today: '2026-04-19',
      goals: [
        { id: 'a', title: 'A', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
        { id: 'b', title: 'B', status: 'active', effortHours: 40, bufferWeeks: 0,
          commitmentMode: 'fixed', fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
      ],
    });
    const tuples = report.collisions.map(
      (c) => `${c.code}|${c.conflictingGoalIds.join(',')}|${c.window.startDate}`
    );
    expect(new Set(tuples).size).toBe(tuples.length);
  });
```

- [ ] **Step 2: Run tests, verify they fail (if not already passing)**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`

- [ ] **Step 3: Implement sort + dedup at end of `detectCrises`**

Before the final `return`:

```ts
  // Phase 3: dedup + stable sort
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
```

Remove the old `return` line.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/trajectory/crisis.ts tests/unit/trajectory-crisis.test.ts
git commit -m "feat(trajectory): stable-sort and dedup crisis collisions (Phase 3)"
```

---

### Task 9: Edge Cases Batch

**Files:**
- Modify: `tests/unit/trajectory-crisis.test.ts`
- Modify: `lib/trajectory/crisis.ts` (if a test fails)

- [ ] **Step 1: Add edge-case tests**

Append to the `describe`:

```ts
  describe('edge cases', () => {
    const base = (overrides: any) => ({
      id: 'x', title: 'X', status: 'active', effortHours: 40, bufferWeeks: 0,
      ...overrides,
    });

    it('filters out done goals', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', status: 'done', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'b', status: 'active', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-15', fixedEndDate: '2026-10-15' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('filters out archived goals', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', status: 'archived', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'b', status: 'active', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-15', fixedEndDate: '2026-10-15' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('filters out fixed goals ending before today', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed',
                 fixedStartDate: '2025-01-01', fixedEndDate: '2025-12-31' }),
          base({ id: 'b', commitmentMode: 'fixed',
                 fixedStartDate: '2025-06-01', fixedEndDate: '2025-11-30' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('filters out lead-time goals with eventDate in past', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'lead-time',
                 dueDate: '2025-12-31', leadTimeWeeks: 12 }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('treats single-day fixed window as inclusive', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-15', fixedEndDate: '2026-09-15' }),
          base({ id: 'b', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-15', fixedEndDate: '2026-09-15' }),
        ],
      });
      expect(report.collisions).toHaveLength(1);
      expect(report.collisions[0]?.code).toBe('FIXED_WINDOW_COLLISION');
    });

    it('does not flag adjacent disjoint fixed windows (end N, start N+1)', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'b', commitmentMode: 'fixed',
                 fixedStartDate: '2026-10-01', fixedEndDate: '2026-10-31' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('flags shared-day fixed windows (end N, start N)', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'b', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-30', fixedEndDate: '2026-10-31' }),
        ],
      });
      expect(report.collisions).toHaveLength(1);
    });

    it('returns empty for single flexible goal with plenty of time', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'flexible', dueDate: '2027-12-31', effortHours: 40 }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('handles effortHours=0 flexible without crashing', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'flexible', dueDate: '2027-12-31', effortHours: 0 }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });

    it('skips NO_FLEXIBLE_SLOT for flexible with past dueDate (LATE_START priority)', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'flexible', dueDate: '2026-03-01' }),
        ],
      });
      expect(report.collisions.some((c) => c.code === 'NO_FLEXIBLE_SLOT')).toBe(false);
    });

    it('dedupes duplicate goal IDs, keeping the first', () => {
      const report = detectCrises({
        today: '2026-04-19',
        goals: [
          base({ id: 'a', commitmentMode: 'fixed',
                 fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' }),
          base({ id: 'a', commitmentMode: 'fixed',
                 fixedStartDate: '2027-01-01', fixedEndDate: '2027-01-31' }),
        ],
      });
      expect(report.collisions).toEqual([]);
    });
  });
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: if any test fails, fix the underlying code in `crisis.ts` (most should already pass given prior tasks).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/trajectory-crisis.test.ts lib/trajectory/crisis.ts
git commit -m "test(trajectory): add crisis detection edge-case coverage"
```

---

### Task 10: Determinism Test

**Files:**
- Modify: `tests/unit/trajectory-crisis.test.ts`

- [ ] **Step 1: Add determinism test**

```ts
  it('is deterministic — same input produces equal reports across 50 runs', () => {
    const goals = [
      { id: 'praktikum', title: 'Praktikum', status: 'active' as const, effortHours: 640, bufferWeeks: 0,
        commitmentMode: 'fixed' as const, fixedStartDate: '2026-09-01', fixedEndDate: '2026-09-30' },
      { id: 'gmat', title: 'GMAT', status: 'active' as const, effortHours: 200, bufferWeeks: 2,
        commitmentMode: 'lead-time' as const, dueDate: '2027-04-15', leadTimeWeeks: 26 },
      { id: 'thesis', title: 'Thesis', status: 'active' as const, effortHours: 400, bufferWeeks: 2,
        commitmentMode: 'flexible' as const, dueDate: '2026-11-30' },
    ];
    const first = detectCrises({ goals, today: '2026-04-19' });
    for (let i = 0; i < 49; i += 1) {
      expect(detectCrises({ goals, today: '2026-04-19' })).toEqual(first);
    }
  });
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/unit/trajectory-crisis.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/trajectory-crisis.test.ts
git commit -m "test(trajectory): verify crisis detection is deterministic"
```

---

## Phase 3 — Integration (breaking type changes)

### Task 11: Zod Schema — Discriminated Union

**Files:**
- Modify: `lib/schemas/trajectory.schema.ts`

- [ ] **Step 1: Read current schema**

Run: `cat lib/schemas/trajectory.schema.ts` (already known from spec context).

- [ ] **Step 2: Replace `createTrajectoryGoalSchema` and `updateTrajectoryGoalSchema`**

Replace lines starting at `export const createTrajectoryGoalSchema = ...` through the `updateTrajectoryGoalSchema` line with:

```ts
export const commitmentModeValues = ['fixed', 'flexible', 'lead-time'] as const;

const trajectoryGoalBaseFields = {
  title: z.string().min(1).max(200),
  category: z.enum(trajectoryGoalCategoryValues),
  effortHours: z.number().int().min(1).max(2000),
  bufferWeeks: z.number().int().min(0).max(16).default(2),
  priority: z.number().int().min(1).max(5).default(3),
  status: z.enum(trajectoryGoalStatusValues).default('active'),
};

export const createTrajectoryGoalSchema = z.discriminatedUnion('commitmentMode', [
  z.object({
    ...trajectoryGoalBaseFields,
    commitmentMode: z.literal('fixed'),
    fixedStartDate: trajectoryDateSchema,
    fixedEndDate: trajectoryDateSchema,
    dueDate: trajectoryDateSchema.optional(),
  }).refine((v) => v.fixedEndDate >= v.fixedStartDate, {
    message: 'fixedEndDate must be >= fixedStartDate',
    path: ['fixedEndDate'],
  }),
  z.object({
    ...trajectoryGoalBaseFields,
    commitmentMode: z.literal('flexible'),
    dueDate: trajectoryDateSchema,
  }),
  z.object({
    ...trajectoryGoalBaseFields,
    commitmentMode: z.literal('lead-time'),
    dueDate: trajectoryDateSchema,
    leadTimeWeeks: z.number().int().min(1).max(104),
  }),
]);

export const updateTrajectoryGoalSchema = z.object({
  ...trajectoryGoalBaseFields,
  commitmentMode: z.enum(commitmentModeValues).optional(),
  dueDate: trajectoryDateSchema.optional(),
  fixedStartDate: trajectoryDateSchema.optional(),
  fixedEndDate: trajectoryDateSchema.optional(),
  leadTimeWeeks: z.number().int().min(1).max(104).optional(),
}).partial();
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: some errors in `lib/supabase/trajectory.ts` (consumers of the old type). Note them — Task 12 fixes them.

- [ ] **Step 4: Commit**

```bash
git add lib/schemas/trajectory.schema.ts
git commit -m "feat(schema): discriminated union for trajectory goal commitment modes"
```

---

### Task 12: Supabase Layer — Extend mapper + CRUD

**Files:**
- Modify: `lib/supabase/trajectory.ts`

- [ ] **Step 1: Extend `TrajectoryGoalRecord` interface**

Replace the interface (lines 39-50):

```ts
export interface TrajectoryGoalRecord {
  id: string;
  title: string;
  category: 'thesis' | 'gmat' | 'master_app' | 'internship' | 'other';
  dueDate: string | null;
  effortHours: number;
  bufferWeeks: number;
  priority: number;
  status: 'active' | 'done' | 'archived';
  commitmentMode: 'fixed' | 'flexible' | 'lead-time';
  fixedStartDate: string | null;
  fixedEndDate: string | null;
  leadTimeWeeks: number | null;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Update `toGoalRecord` mapper**

Replace the `toGoalRecord` function body:

```ts
function toGoalRecord(row: TrajectoryGoalRow): TrajectoryGoalRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    dueDate: row.due_date,
    effortHours: row.effort_hours,
    bufferWeeks: row.buffer_weeks,
    priority: row.priority,
    status: row.status,
    commitmentMode: (row as any).commitment_mode ?? 'flexible',
    fixedStartDate: (row as any).fixed_start_date ?? null,
    fixedEndDate: (row as any).fixed_end_date ?? null,
    leadTimeWeeks: (row as any).lead_time_weeks ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

Note: `(row as any)` casts are a temporary bridge until `Database` types in `lib/supabase/types.ts` are regenerated from the migration. Add a TODO comment above the function:

```ts
// TODO: regenerate Database types after migration 20260419_crisis_mode applies,
// then drop `(row as any)` casts below.
```

- [ ] **Step 3: Update `createTrajectoryGoal`**

Replace the function:

```ts
export async function createTrajectoryGoal(
  userId: string,
  input: CreateTrajectoryGoalInput
): Promise<TrajectoryGoalRecord> {
  const supabase = createClient();

  const insertData: Record<string, unknown> = {
    user_id: userId,
    title: input.title,
    category: input.category,
    effort_hours: input.effortHours,
    buffer_weeks: input.bufferWeeks,
    priority: input.priority,
    status: input.status,
    commitment_mode: input.commitmentMode,
  };

  if (input.commitmentMode === 'fixed') {
    insertData.fixed_start_date = input.fixedStartDate;
    insertData.fixed_end_date = input.fixedEndDate;
    insertData.due_date = input.dueDate ?? input.fixedEndDate;
  } else if (input.commitmentMode === 'flexible') {
    insertData.due_date = input.dueDate;
  } else {
    insertData.due_date = input.dueDate;
    insertData.lead_time_weeks = input.leadTimeWeeks;
  }

  const { data, error } = await supabase
    .from('trajectory_goals')
    .insert(insertData as TrajectoryGoalInsert)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create trajectory goal: ${error.message}`);
  }

  return toGoalRecord(data);
}
```

- [ ] **Step 4: Update `updateTrajectoryGoal`**

Replace the function body (inside existing function, after `const updateData: TrajectoryGoalUpdate = { ... }`):

```ts
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
  if (input.effortHours !== undefined) updateData.effort_hours = input.effortHours;
  if (input.bufferWeeks !== undefined) updateData.buffer_weeks = input.bufferWeeks;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.status !== undefined) updateData.status = input.status;

  if (input.commitmentMode !== undefined) {
    updateData.commitment_mode = input.commitmentMode;
    // Clear mode-foreign fields to respect CHECK constraint
    if (input.commitmentMode === 'fixed') {
      updateData.lead_time_weeks = null;
    } else if (input.commitmentMode === 'flexible') {
      updateData.fixed_start_date = null;
      updateData.fixed_end_date = null;
      updateData.lead_time_weeks = null;
    } else {
      updateData.fixed_start_date = null;
      updateData.fixed_end_date = null;
    }
  }
  if (input.fixedStartDate !== undefined) updateData.fixed_start_date = input.fixedStartDate;
  if (input.fixedEndDate !== undefined) updateData.fixed_end_date = input.fixedEndDate;
  if (input.leadTimeWeeks !== undefined) updateData.lead_time_weeks = input.leadTimeWeeks;
```

Also change the `.update(updateData)` call to `.update(updateData as TrajectoryGoalUpdate)`.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: pass (the `(as any)` casts bridge the un-regenerated Database types).

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/trajectory.ts
git commit -m "feat(supabase): map commitment mode fields on trajectory goals"
```

---

### Task 13: Planner — Move types, update existing tests

**Files:**
- Modify: `lib/trajectory/planner.ts`
- Modify: `tests/unit/trajectory-planner.test.ts`

- [ ] **Step 1: Remove local `TrajectoryGoalPlanInput` from planner.ts, import from types.ts**

At the top of `lib/trajectory/planner.ts`, add:

```ts
import type { TrajectoryGoalPlanInput } from '@/lib/trajectory/types';
```

Delete the existing `export interface TrajectoryGoalPlanInput { ... }` block (lines 9-16).

Add a re-export at the end of the file for backwards-compat:

```ts
export type { TrajectoryGoalPlanInput };
```

- [ ] **Step 2: Update `computeTrajectoryPlan` to handle all three modes**

The current planner only looks at `dueDate` + `effortHours`. Extend the `.map((goal) => { ... })` inside `computeTrajectoryPlan` to branch on `commitmentMode`:

Find the block starting `const generatedBase = input.goals.filter((goal) => goal.status === 'active').map((goal) => {` and replace it with:

```ts
  const generatedBase = input.goals
    .filter((goal) => goal.status === 'active')
    .map((goal) => {
      if (goal.commitmentMode === 'fixed') {
        const requiredDays = Math.max(
          1,
          Math.ceil(
            (new Date(`${goal.fixedEndDate}T00:00:00.000Z`).getTime() -
              new Date(`${goal.fixedStartDate}T00:00:00.000Z`).getTime()) /
              DAY_MS
          ) + 1
        );
        const requiredWeeks = Math.max(1, Math.ceil(requiredDays / 7));
        return {
          goalId: goal.id,
          title: goal.title,
          startDate: goal.fixedStartDate,
          endDate: goal.fixedEndDate,
          weeklyHours: Math.max(1, Math.ceil(goal.effortHours / requiredWeeks)),
          requiredWeeks,
          plannedBlockHours: goal.effortHours,
        };
      }

      const dueDate = goal.commitmentMode === 'flexible'
        ? goal.dueDate
        : goal.dueDate;
      const prepWindow = computeTrajectoryPrepWindow({
        dueDate,
        effortHours: goal.effortHours,
        bufferWeeks: goal.commitmentMode === 'lead-time'
          ? goal.bufferWeeks
          : goal.bufferWeeks,
        capacityHoursPerWeek: capacity,
      });

      return {
        goalId: goal.id,
        title: goal.title,
        startDate: prepWindow.startDate,
        endDate: prepWindow.endDate,
        weeklyHours: prepWindow.effectiveCapacityHoursPerWeek,
        requiredWeeks: prepWindow.requiredWeeks,
        plannedBlockHours: prepWindow.plannedBlockHours,
      };
    });
```

- [ ] **Step 3: Update existing tests to include `commitmentMode: 'flexible'`**

In `tests/unit/trajectory-planner.test.ts`, for each of the 3 existing goal-based tests, add `commitmentMode: 'flexible' as const` to the goal object. For example, the first test becomes:

```ts
  it('marks goal as at_risk when required start is in the past', () => {
    const result = computeTrajectoryPlan({
      goals: [
        {
          id: 'goal-1',
          title: 'GMAT Prep',
          dueDate: '2026-03-10',
          effortHours: 40,
          bufferWeeks: 0,
          status: 'active',
          commitmentMode: 'flexible',
        },
      ],
      capacityHoursPerWeek: 8,
      today: '2026-03-09',
    });
```

Apply the same `commitmentMode: 'flexible'` addition to the two other goal-based tests in this file.

- [ ] **Step 4: Type-check + test**

Run: `npx tsc --noEmit && npx vitest run tests/unit/trajectory-planner.test.ts tests/unit/trajectory-crisis.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/trajectory/planner.ts tests/unit/trajectory-planner.test.ts
git commit -m "refactor(trajectory): move goal input type, branch planner on commitment mode"
```

---

### Task 14: API Route — Integrate `detectCrises`

**Files:**
- Modify: `app/api/trajectory/plan/route.ts`
- Modify: `tests/unit/api/trajectory-plan.test.ts`

- [ ] **Step 1: Import and call `detectCrises`**

In `app/api/trajectory/plan/route.ts`:

1. Add import:

```ts
import { detectCrises } from '@/lib/trajectory/crisis';
import type { TrajectoryGoalPlanInput } from '@/lib/trajectory/types';
```

2. Replace the `goals: goals.map((goal) => ({ ... }))` block and the `computed = computeTrajectoryPlan({...})` call with:

```ts
    const planGoals: TrajectoryGoalPlanInput[] = goals.map((goal) => {
      const base = {
        id: goal.id,
        title: goal.title,
        status: goal.status,
        effortHours: goal.effortHours,
        bufferWeeks: goal.bufferWeeks,
      };
      if (goal.commitmentMode === 'fixed' && goal.fixedStartDate && goal.fixedEndDate) {
        return {
          ...base,
          commitmentMode: 'fixed' as const,
          fixedStartDate: goal.fixedStartDate,
          fixedEndDate: goal.fixedEndDate,
        };
      }
      if (goal.commitmentMode === 'lead-time' && goal.dueDate && goal.leadTimeWeeks != null) {
        return {
          ...base,
          commitmentMode: 'lead-time' as const,
          dueDate: goal.dueDate,
          leadTimeWeeks: goal.leadTimeWeeks,
        };
      }
      // Default / fallback: flexible
      return {
        ...base,
        commitmentMode: 'flexible' as const,
        dueDate: goal.dueDate ?? new Date().toISOString().split('T')[0]!,
      };
    });

    const computed = computeTrajectoryPlan({
      goals: planGoals,
      existingBlocks: blocks.map((block) => ({
        goalId: block.goalId,
        startDate: block.startDate,
        endDate: block.endDate,
        weeklyHours: block.weeklyHours,
        status: block.status,
      })),
      capacityHoursPerWeek: effectiveCapacity,
    });

    const crisis = detectCrises({ goals: planGoals });
```

3. Replace the final `NextResponse.json({...})` body:

```ts
    return NextResponse.json({
      settings,
      simulation: {
        used: parsed.simulationHoursPerWeek !== undefined,
        effectiveCapacityHoursPerWeek: computed.effectiveCapacityHoursPerWeek,
      },
      computed,
      crisis,
    });
```

- [ ] **Step 2: Update existing API test + add crisis assertion**

In `tests/unit/api/trajectory-plan.test.ts`:

1. Add import:

```ts
import { detectCrises } from '@/lib/trajectory/crisis';
```

2. Add mock:

```ts
vi.mock('@/lib/trajectory/crisis', () => ({
  detectCrises: vi.fn(),
}));
```

3. Declare `const mockedDetectCrises = vi.mocked(detectCrises);` near the other `mocked*` declarations.

4. In the existing `'uses simulation hours when provided'` test, after the `mockedComputeTrajectoryPlan.mockReturnValue(...)` line, add:

```ts
    mockedDetectCrises.mockReturnValue({ collisions: [], hasCrisis: false });
```

5. At end of that same test, add assertions before closing:

```ts
    expect(mockedDetectCrises).toHaveBeenCalled();
    expect(body.crisis).toEqual({ collisions: [], hasCrisis: false });
```

6. Add a new test:

```ts
  it('includes crisis collisions in response', async () => {
    mockedRequireApiAuth.mockResolvedValue(authSuccess() as any);
    mockedGetOrCreateTrajectorySettings.mockResolvedValue({
      id: 's', hoursPerWeek: 8, horizonMonths: 24,
      createdAt: '2026-04-19T00:00:00Z', updatedAt: '2026-04-19T00:00:00Z',
    });
    mockedListTrajectoryGoals.mockResolvedValue([]);
    mockedListTrajectoryBlocks.mockResolvedValue([]);
    mockedComputeTrajectoryPlan.mockReturnValue({
      effectiveCapacityHoursPerWeek: 8,
      generatedBlocks: [], alerts: [], summary: { total: 0, onTrack: 0, tight: 0, atRisk: 0 },
    });
    mockedDetectCrises.mockReturnValue({
      collisions: [{
        code: 'FIXED_WINDOW_COLLISION',
        severity: 'critical',
        conflictingGoalIds: ['a','b'],
        window: { startDate: '2026-09-01', endDate: '2026-10-15' },
        message: 'overlap',
      }],
      hasCrisis: true,
    });

    const request = new NextRequest('http://localhost:3000/api/trajectory/plan', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();
    expect(body.crisis.hasCrisis).toBe(true);
    expect(body.crisis.collisions[0].code).toBe('FIXED_WINDOW_COLLISION');
  });
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/unit/api/trajectory-plan.test.ts`
Expected: all PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add app/api/trajectory/plan/route.ts tests/unit/api/trajectory-plan.test.ts
git commit -m "feat(api): emit crisis report from /api/trajectory/plan"
```

---

### Task 15: Final Verification Sweep

- [ ] **Step 1: Full type-check**

Run: `npm run type-check`
Expected: no errors.
If errors: fix in-place. Likely culprits are unused `_input` parameter in stub (delete underscore prefix), or missing `commitmentMode` in some other consumer of `TrajectoryGoalRecord`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new warnings.

- [ ] **Step 3: Full unit test suite**

Run: `npm run test:unit`
Expected: all PASS, crisis test count ≈ 22 new tests, existing total unchanged otherwise.

- [ ] **Step 4: E2E blocker suite**

Run: `npm run test:e2e:blocker`
Expected: all PASS (no UI changes in this PR, so no regressions expected).

- [ ] **Step 5: Commit any fixes**

If any step 1-4 triggered fixes:

```bash
git add -u
git commit -m "chore(trajectory): fix fallout from crisis integration"
```

If no fixes needed: skip this step.

- [ ] **Step 6: Summary to user**

Report:
- Files created: 4 (migration SQL, types.ts, crisis.ts, crisis.test.ts)
- Files modified: 6 (planner.ts, trajectory.schema.ts, supabase/trajectory.ts, trajectory/plan/route.ts, trajectory-planner.test.ts, trajectory-plan.test.ts)
- New tests: ~22 (7 scenarios + 15 edge cases + 1 determinism + 2 sort/dedup — adjust to actual)
- Outstanding: DB migration must be applied on Supabase (staging → prod), Database types should be regenerated after apply to drop `(as any)` casts in `supabase/trajectory.ts`.

---

## Out-of-Scope Open Questions (from spec)

These are tracked separately and do NOT block Phase 1 MVP:

1. `user_notifications` table — not touched by this plan.
2. Cron `/api/cron/trajectory-crisis-daily` — deferred to Phase 3 spec.
3. Mode-change policy in `updateTrajectoryGoal` — implemented permissively (mode-foreign fields cleared).
4. Goal-creation UI with mode picker — Phase 2 spec.
5. Morning Briefing / Trajectory-Page RailChips — Phase 2 spec.
