# Crisis Mode — Design Spec

**Date:** 2026-04-19
**Status:** Approved for Implementation (MVP = Phase 1)
**Scope:** Trajectory Engine Extension — Detection-Only, no new UI mode
**Author:** Brainstorm session with user (vietdobusiness@gmail.com)

---

## 1. Problem

User hat mehrere langfristige Commitments (Praktikum Sept 26, Bachelor-Thesis, GMAT April 27), die zeitlich kollidieren können. Das existierende Trajectory-System rechnet ausschließlich mit flexibler Wochenkapazität (`capacity_hours_per_week`) — es kennt keine unteilbaren Zeitfenster („Praktikum MUSS in Sept 26 sein") oder Prep-Zeit-Anforderungen („GMAT braucht ~6 Monate Vorbereitung").

**Crisis Mode** erkennt deterministisch Kollisionen zwischen Goals verschiedener Commitment-Typen und alarmiert, bevor sie eintreten.

---

## 2. Goals / Non-Goals

### Goals

- 4 neue Collision-Typen deterministisch erkennen:
  - `FIXED_WINDOW_COLLISION` (2 fixed Goals überlappen)
  - `FIXED_BLOCKS_PREP` (fixed Goal blockt Prep-Fenster)
  - `LEAD_TIME_TOO_SHORT` (Prep-Zeit reicht nicht mehr bis Event-Datum)
  - `NO_FLEXIBLE_SLOT` (kein freier Zeitraum für flexibles Goal)
- Output fließt in bestehende Plan-API als neue `crisis`-Property (backwards-compatible)
- Existing Goals (alle `flexible`) bleiben 100 % funktional
- `crisis.ts` ist **pure function** — keine externen Calls, keine `new Date()`, testbar ohne Mocks

### Non-Goals (explizit ausgeklammert)

- Prerequisites zwischen Goals (Modul A vor B)
- User-Abwesenheit / Urlaubs-Blocker
- Fullscreen Crisis-UI-Mode (zukünftige Phase 2)
- Auto-Reschedule flexibler Goals (zukünftige Phase 3)
- Part-time/Full-time-Intensity-Unterscheidung (bewusst nicht Teil der Modi)

---

## 3. Data Model

### DB Migration

```sql
ALTER TABLE trajectory_goals
  ADD COLUMN commitment_mode TEXT NOT NULL DEFAULT 'flexible'
    CHECK (commitment_mode IN ('fixed','flexible','lead-time')),
  ADD COLUMN fixed_start_date DATE NULL,
  ADD COLUMN fixed_end_date DATE NULL,
  ADD COLUMN lead_time_weeks INT NULL
    CHECK (lead_time_weeks IS NULL OR lead_time_weeks BETWEEN 1 AND 104);

ALTER TABLE trajectory_goals ADD CONSTRAINT trajectory_goals_mode_fields CHECK (
  (commitment_mode = 'fixed'
    AND fixed_start_date IS NOT NULL
    AND fixed_end_date IS NOT NULL
    AND fixed_end_date >= fixed_start_date) OR
  (commitment_mode = 'flexible'
    AND due_date IS NOT NULL) OR
  (commitment_mode = 'lead-time'
    AND due_date IS NOT NULL
    AND lead_time_weeks IS NOT NULL)
);
```

- RLS unverändert (`user_id`-basiert, existiert bereits).
- Backfill: alle Existing Rows bekommen `commitment_mode = 'flexible'` per DEFAULT — keine Daten-Migration nötig.

### TypeScript Types (neue Datei `lib/trajectory/types.ts`)

```ts
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
      fixedStartDate: string;   // YYYY-MM-DD
      fixedEndDate: string;     // YYYY-MM-DD
    })
  | (TrajectoryGoalBase & {
      commitmentMode: 'flexible';
      dueDate: string;          // YYYY-MM-DD
    })
  | (TrajectoryGoalBase & {
      commitmentMode: 'lead-time';
      dueDate: string;          // YYYY-MM-DD (Event-/Prüfungsdatum)
      leadTimeWeeks: number;    // 1..104
    });
```

Bestehender Type in `planner.ts` wird hierher verschoben — `planner.ts` importiert aus `types.ts`.

**⚠ Breaking Type-Change:** Der bisherige flache `TrajectoryGoalPlanInput` (mit required `dueDate`) wird zur discriminated union. Alle Konstruktionsstellen (API-Route, Tests, Seeds) müssen auf mode-spezifische Shapes migrieren. Default für existierende DB-Rows: `commitmentMode: 'flexible'`.

### Mode-Semantik

| Mode | Beispiel | Block-Definition |
|------|----------|------------------|
| `fixed` | Praktikum Sept 2026 | `[fixedStartDate, fixedEndDate]`, nicht verschiebbar |
| `flexible` | Thesis (4 Monate irgendwann) | `computeTrajectoryPrepWindow(dueDate, effort, buffer, capacity)` — wie heute |
| `lead-time` | GMAT April 2027 | `[dueDate − leadTimeWeeks·7, dueDate − bufferWeeks·7]` |

---

## 4. Algorithmus — `detectCrises()`

### Modul-Signatur (neue Datei `lib/trajectory/crisis.ts`)

```ts
export interface CrisisCollision {
  code: 'FIXED_WINDOW_COLLISION'
      | 'FIXED_BLOCKS_PREP'
      | 'NO_FLEXIBLE_SLOT'
      | 'LEAD_TIME_TOO_SHORT';
  severity: 'critical';
  conflictingGoalIds: string[];      // 1 (solo) oder 2 (pair), lexikografisch sortiert
  window: { startDate: string; endDate: string };
  message: string;                   // human-readable, de-DE
}

export interface CrisisReport {
  collisions: CrisisCollision[];
  hasCrisis: boolean;                // collisions.length > 0
}

export function detectCrises(input: {
  goals: TrajectoryGoalPlanInput[];
  today?: string;                     // YYYY-MM-DD; default = API-Layer sets it
}): CrisisReport;
```

### Phase 1 — Projected Blocks bauen

Für jedes **active** Goal (status = 'active'):

| Input Mode | Block |
|-----------|-------|
| `fixed` | `{ start: fixedStartDate, end: fixedEndDate, type: 'fixed' }` |
| `flexible` | `computeTrajectoryPrepWindow(...)` → `{ start, end, type: 'flexible', requiredWeeks }` |
| `lead-time` | `{ start: dueDate − leadTimeWeeks·7, end: dueDate − bufferWeeks·7, type: 'leadtime' }` |

**Ausfiltern vor Phase 2:**
- `status !== 'active'`
- `block.end < today` (historisches Goal, irrelevant)

### Phase 2 — 5 Detection-Passes

| Pass | Typ | Kriterium | Alert-Code |
|------|-----|-----------|------------|
| A | Pair | `(fixed_i, fixed_j)` Fenster überlappen | `FIXED_WINDOW_COLLISION` |
| B | Pair | `(fixed, lead-time Prep)` Fenster überlappen | `FIXED_BLOCKS_PREP` |
| C | Pair | `(fixed, flexible Prep)` Fenster überlappen | `FIXED_BLOCKS_PREP` |
| D | Solo | lead-time: `(dueDate − today) < leadTimeWeeks·7` Tage | `LEAD_TIME_TOO_SHORT` |
| E | Solo | flexible: kein freier Slot ≥ `requiredWeeks` in `[today, dueDate]` nach Abzug fixed Windows | `NO_FLEXIBLE_SLOT` |

**Overlap-Definition (inklusiv):** `max(startA, startB) <= min(endA, endB)`

**Pass E Slot-Finding:**

```
freeSlots = [[today, dueDate − bufferWeeks·7]]
sort fixedBlocks by startDate ascending
for each fixedBlock in sortedFixed:
  for each freeSlot in freeSlots:
    if fixedBlock overlaps freeSlot:
      split freeSlot around fixedBlock (may remove or split into 2)
if max(durationDays(slot) for slot in freeSlots) < requiredWeeks·7:
  emit NO_FLEXIBLE_SLOT
```

### Phase 3 — Stable Ordering + Dedup

**Sortierung:**
1. `window.startDate` ascending
2. Tie: `conflictingGoalIds[0]` ascending

**Dedup:** identisches `(code, conflictingGoalIds, window.startDate)`-Tupel → **einmal** emittieren.

### Determinismus-Invariante

- Keine `new Date()` **innerhalb** `crisis.ts` — `today` kommt aus Input-Parameter
- API-Layer setzt Default: `today = input.today ?? toIsoDate(new Date())`
- Alle Datumsoperationen in UTC (reuse `parseIsoDate` / `addUtcDays` aus `planner.ts`)
- Keine `Math.random()`, kein externer State, keine DB-Zugriffe

**Test-Invariante:** `detectCrises(sameInput, sameToday)` liefert immer `.toEqual()`-gleiches Ergebnis.

---

## 5. Integration

### `/api/trajectory/plan` — Response-Erweiterung

Shape:

```ts
{
  effectiveCapacityHoursPerWeek: number;
  generatedBlocks: GeneratedTrajectoryBlock[];
  alerts: TrajectoryAlert[];
  summary: { total, onTrack, tight, atRisk };
  crisis: CrisisReport;                // NEU
}
```

Implementation:

```ts
const plan = computeTrajectoryPlan({ goals, existingBlocks, capacityHoursPerWeek, today });
const crisis = detectCrises({ goals, today });
return NextResponse.json({ ...plan, crisis });
```

**Backwards-Compat:** Clients, die `crisis` nicht lesen, brechen nicht. Alte Tests bleiben grün.

### Supabase-Layer — `lib/supabase/trajectory.ts`

- `getTrajectoryGoals()` Row-Mapping erweitern (snake_case → camelCase):
  - `commitment_mode` → `commitmentMode`
  - `fixed_start_date` → `fixedStartDate`
  - `fixed_end_date` → `fixedEndDate`
  - `lead_time_weeks` → `leadTimeWeeks`
- `createTrajectoryGoal()` / `updateTrajectoryGoal()`: Mode-spezifische Felder akzeptieren, andere auf `null` setzen wenn Mode wechselt.
- Zod-Schema in `lib/schemas/trajectory.schema.ts` als discriminated union erweitern.

### Cron — `/api/cron/trajectory-crisis-daily` (NEW)

Protected via `requireCronAuth()`.

```
1. SELECT DISTINCT user_id FROM trajectory_goals WHERE status='active'
2. Für jeden user_id:
   a. Load goals + capacity_hours_per_week
   b. report = detectCrises({ goals, today })
   c. Für jede NEUE collision (siehe Dedup unten):
      Insert in user_notifications (oder Ersatz-Logging)
3. Return { processed: N, notifications_emitted: M }
```

**Dedup-Fingerprint:** `sha1(code + sortedGoalIds.join(',') + window.startDate)` — speichert im Notification-Row. Bei Wiederlauf: skip wenn fingerprint < 30 Tage alt.

**Abhängigkeit:** existiert Tabelle `user_notifications`? Wenn **nein** → **Cron-Phase auf Phase 3 verschieben** (siehe Rollout). MVP läuft auch ohne Cron: Detection passiert synchron bei jedem `/api/trajectory/plan` Call, Morning Briefing zeigt `crisis` Feld an.

### UI-Hook-Points (nicht Teil von Phase 1)

Future phases (nicht in dieser Spec):
- `/today` Morning Briefing: rendert `plan.crisis.collisions[0]` als rote StatChip
- `/trajectory`: rote RailChips über Timeline
- Goal Creation Form: Mode-Picker mit konditionalen Feldern

---

## 6. Edge Cases

15 definierte Fälle mit festgelegtem Verhalten. Jeder bekommt einen Unit-Test.

| # | Fall | Verhalten |
|---|------|-----------|
| 1 | Goal `status ∈ {done, archived}` | Ausfiltern |
| 2 | `fixed_end_date < today` | Ausfiltern |
| 3 | `eventDate < today` (lead-time) | Ausfiltern |
| 4 | Single-day fixed (`start = end`) | Overlap inklusiv |
| 5 | Fixed A endet Tag N, B startet Tag N+1 | Keine Collision |
| 6 | Fixed A endet Tag N, B startet Tag N | Collision (Tag geteilt) |
| 7 | Keine active Goals | `{ collisions: [], hasCrisis: false }` |
| 8 | 1 Goal nur | Nur Solo-Passes D/E möglich |
| 9 | `effortHours = 0` bei flexible | `requiredWeeks = 1` (reuse `calculateRequiredWeeks`) |
| 10 | Flexible `dueDate < today` | `LATE_START` hat Priorität → `NO_FLEXIBLE_SLOT` skip |
| 11 | lead-time Prep-Fenster teils in Vergangenheit | `LEAD_TIME_TOO_SHORT` (Pass D) |
| 12 | 2 fixed Goals exakt gleiches Fenster | **1×** emittiert, sortierte IDs |
| 13 | Capacity = 0 | Input-Validation auf API-Layer (Zod); crisis.ts trusted trusted input |
| 14 | Zeitzone | Alles UTC |
| 15 | Duplicate goal IDs | Dedupe, erstes gewinnt |

---

## 7. Testing

### Unit Tests — `tests/unit/trajectory-crisis.test.ts` (NEW)

**7 Kern-Szenarien:**

| # | Szenario | Expected |
|---|----------|----------|
| 1 | 3 flexible, viel Zeit | `[]` |
| 2 | Praktikum `fixed` Sept 26 + Festival-Job `fixed` Sept 26 | 1× `FIXED_WINDOW_COLLISION` |
| 3 | Praktikum `fixed` Sept 26 + GMAT `lead-time` April 27 mit 6M Prep | 1× `FIXED_BLOCKS_PREP` |
| 4 | GMAT April 27, leadTimeWeeks=26, today='2027-03-01' | 1× `LEAD_TIME_TOO_SHORT` |
| 5 | Thesis `flexible` + 4 Fixed Goals → alle Lücken < requiredWeeks | 1× `NO_FLEXIBLE_SLOT` |
| 6 | Thesis `flexible` (due Nov 26, 4M) + Praktikum `fixed` Sept 26 | 1× `FIXED_BLOCKS_PREP` |
| 7 | Szenario 3, 50× | alle Reports `toEqual()` |

**+ 15 Edge-Case-Tests** (je einer pro Zeile aus Abschnitt 6).

**Coverage-Ziel:** 100 % Branches in `crisis.ts` (pure function, realistisch).

### Integration Test — `tests/unit/api/trajectory-plan.test.ts` (erweitern)

- Response enthält `crisis: CrisisReport`
- Ohne Crisis: `crisis.hasCrisis === false`, `collisions === []`
- Flexible-Only Input: Response identisch zu Pre-Feature (backwards-compat verifiziert)

### Cron Test — `tests/unit/api/trajectory-crisis-cron.test.ts` (NEW, falls `user_notifications` existiert)

- `requireCronAuth()` gatekeeper greift
- Dedupe-Fingerprint verhindert doppelte Notification innerhalb 30 Tage

---

## 8. Rollout

| Phase | Scope | Status |
|-------|-------|--------|
| **1 (MVP)** | Migration + `types.ts` + `crisis.ts` + `/api/trajectory/plan`-Erweiterung + Supabase-Layer + Unit-Tests | **diese Spec** |
| 2 | UI-Integration: Morning Briefing StatChip + Trajectory-Page RailChips | separate Spec |
| 3 | Goal-Creation-UI mit Mode-Picker + Cron Daily + Notifications-Dedup | separate Spec |

---

## 9. Offene Fragen (im Implementation-Plan zu klären)

1. **Existiert Tabelle `user_notifications`?** Falls nein: Cron rutscht in Phase 3, MVP liefert nur synchrone Detection.
2. **Erlaubt `updateTrajectoryGoal()` Mode-Wechsel?** Empfehlung: ja, mode-fremde Felder auf `null` setzen.
3. **Obergrenze `lead_time_weeks = 104` (2 Jahre) angemessen?** Empfehlung: ja.
4. **`existingBlocks` Input für Plan-API** enthält auch Blocks aus fixed/lead-time Goals? Prüfen beim Planner-Refactor.

---

## 10. Acceptance Criteria

- [ ] Migration auf Staging erfolgreich, bestehende Goals funktional
- [ ] `detectCrises()` liefert korrekte Ergebnisse für alle 7 Szenarien
- [ ] `/api/trajectory/plan` Response enthält `crisis`-Feld
- [ ] `npm run test:unit` grün (inkl. 22 neue Tests)
- [ ] `npx tsc --noEmit` ohne neue Errors
- [ ] `npm run lint` ohne neue Warnings
- [ ] Existing Plan-Tests migriert auf neue discriminated-union Shape (Type-Breaking), Verhalten unverändert
- [ ] API-Response backwards-compatible: Clients ohne `crisis`-Lesen brechen nicht
- [ ] E2E Blocker-Suite (`npm run test:e2e:blocker`) grün
