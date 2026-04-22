# Today-Redesign v2 — Implementation Plan

> **Für Claude in der Midnight-Session:** Dieser Plan ist so geschrieben, dass er nach einem Context-Clear direkt wieder aufnehmbar ist. Spec liegt neben dran: `docs/superpowers/specs/2026-04-22-today-redesign.md`.

**Goal:** `/today` vom Game-Screen zum Command-Center umbauen. Trajectory als Hero, Momentum als Puls, Next-Moves als Action-Stack, LucianRoom schrumpft.

**Architecture:** Alle neuen Komponenten unter `components/features/today/`. Page `app/(dashboard)/today/page.tsx` orchestriert nur, keine Widget-Internals. Datenquelle bleibt `/api/dashboard/next-tasks?include=trajectory_morning,week_events`.

**Tech Stack:** Next.js 14, TypeScript strict, React Query v5, Tailwind, Framer Motion, Lucide.

---

## Task 1: Branch + Spec + Plan committen

**Files:**
- Create: `docs/superpowers/specs/2026-04-22-today-redesign.md`
- Create: `docs/superpowers/plans/2026-04-22-today-redesign.md`

- [x] **Step 1: Branch anlegen**

```bash
git checkout -b feature/today-redesign-v2
```

- [x] **Step 2: Spec + Plan schreiben**

Siehe Dateien oben.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-22-today-redesign.md docs/superpowers/plans/2026-04-22-today-redesign.md
git commit -m "docs: today-redesign v2 spec + plan"
```

---

## Task 2: `MomentumPulse` Komponente

**Files:**
- Create: `components/features/today/MomentumPulse.tsx`

**Type-Contract:**

```ts
export interface MomentumPulseProps {
  score: number;           // 0-100
  trend: 'up' | 'flat' | 'down';
  label?: string;          // default: 'Momentum'
  size?: 'sm' | 'md' | 'lg'; // default 'md' = 180px
}
```

- [ ] **Step 1: Komponente schreiben**

Ring mit SVG (stroke-dasharray), animiert mit framer-motion (0.6s Fill-Animation beim Mount), pulsiert leicht (scale 1 → 1.02 → 1, 3s infinite). Farben:
- `score >= 70` → sky-400 (stroke) + sky-400/15 (ring-bg)
- `score 40–69` → amber-400 + amber-400/15
- `score < 40` → red-400 + red-400/15

Mitte: Große Zahl (tabular-nums), darunter `label` + Trend-Pfeil (↑ up = emerald, → flat = text-secondary, ↓ down = rose).

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Erwartet: 0 Errors.

---

## Task 3: `TrajectoryCollisionHero` Komponente

**Files:**
- Create: `components/features/today/TrajectoryCollisionHero.tsx`

**Type-Contract:**

```ts
import type { DashboardNextTasksResponse } from '@/lib/dashboard/queries';

export interface TrajectoryCollisionHeroProps {
  snapshot: DashboardNextTasksResponse['trajectoryMorning'] | null | undefined;
}
```

- [ ] **Step 1: Kein-Ziel-Fallback**

Wenn `snapshot?.overview?.goals` leer oder undefined: Karte mit Text „Kein aktives Trajectory-Ziel" + CTA-Button `Einrichten →` (Link auf `/onboarding/trajectory` oder `/trajectory`).

- [ ] **Step 2: Mit-Ziel-Rendering**

Hero-Karte (rounded-2xl, card-surface, minHeight 200px):
- Zeile 1: Status-Pill (grün/amber/rot je `overview.goals[0].status`) + Title „In {daysUntil}d: {goalTitle}"
- Zeile 2: Mini-Timeline von heute bis Deadline (SVG, ~80px hoch). Horizontaler Balken mit Ticks pro Tag, Prep-Blocks als overlay-Segmente (aus `overview.computed.generatedBlocks`), heutiger Tag als pulsierender Dot.
- Zeile 3: Action-Zeile — `Öffne Trajectory` (primary button) + `Heute Fokus-Block setzen` (ghost button, wenn tight/at_risk).

Nutzt `getRiskStatusTone` aus `@/lib/design-system/statusTone`.

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

---

## Task 4: `NextMovesStack` Komponente

**Files:**
- Create: `components/features/today/NextMovesStack.tsx`

**Type-Contract:**

```ts
export interface NextMovesStackProps {
  nextKitEvent: {
    title: string;
    startsAt: string;
    location: string | null;
  } | null;
  nextDeadline: {
    title: string;
    dueDate: string;        // ISO
    courseCode: string | null;
  } | null;
  nextTask: {
    title: string;
    dueDate: string | null;
  } | null;
}
```

- [ ] **Step 1: Karte-Sub-Komponente**

`<MoveCard icon title subtitle accent href />`. Accent-Farbe pro Typ: KIT-Event = sky, Deadline = amber/rose, Task = emerald. Hover → translateY(-2px) + ring-2 accent.

- [ ] **Step 2: Stack rendern**

3 Karten nebeneinander auf lg+, stacken auf sm. Empty-State pro Karte: „Kein anstehendes Event" / „Keine offene Deadline" / „Alle Tasks erledigt".

- [ ] **Step 3: Type-check**

---

## Task 5: `AmbientRoomPanel` Komponente

**Files:**
- Create: `components/features/today/AmbientRoomPanel.tsx`
- Reuse: `components/features/room/LucianRoom.tsx` (nicht ändern)

- [ ] **Step 1: Mini-Container bauen**

Horizontal-Streifen, volle Breite, 120px Höhe, rounded-xl, overflow-hidden. Enthält LucianRoom (komprimiert, `className` angepasst auf h-full), plus oben-rechts einen „Öffnen"-Button, der (phase 1) einfach einen `onExpand`-Callback aufruft. Modal-Expand ist NICHT Teil dieser Session — Button kann disabled oder mit Tooltip „kommt bald" sein.

- [ ] **Step 2: Style-Pill + Ambience-Indicator übernehmen**

Beide kleine Overlay-Chips aus der aktuellen `today/page.tsx` (Room-Style-Name, Ambience-Live-Dot) weiter rendern, aber kompakter (oben links + unten rechts).

- [ ] **Step 3: Type-check**

---

## Task 6: `today/page.tsx` neu zusammenbauen

**Files:**
- Modify: `app/(dashboard)/today/page.tsx`

- [ ] **Step 1: Alte Struktur entfernen**

Den JSX-Block ab der aktuellen `return (<div className="space-y-4...">` durch neue Struktur ersetzen. Hooks, Queries, Effects bleiben alle unverändert.

- [ ] **Step 2: Neue Struktur**

```tsx
return (
  <div className="space-y-5" data-testid="today-page-root">
    <ErrorBoundary fallbackTitle="Trajectory Hero Error">
      <TrajectoryCollisionHero snapshot={trajectorySnapshot} />
    </ErrorBoundary>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px,1fr]">
      <MomentumPulse
        score={momentum?.score ?? 40}
        trend={momentum?.trend ?? 'flat'}
      />
      <NextMovesStack
        nextKitEvent={kitSignals?.nextCampusEvent ?? null}
        nextDeadline={stats?.nextExam ? {
          title: stats.nextExam.courseName,
          dueDate: stats.nextExam.examDate,
          courseCode: stats.nextExam.courseCode ?? null,
        } : null}
        nextTask={nextTasksData?.nextTasks?.[0] ?? null}
      />
    </div>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ErrorBoundary fallbackTitle="Focus Tasks Error">
        <FocusTasks
          tasks={nextTasksData?.nextTasks ?? []}
          onChanged={handleChanged}
        />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Study Progress Error">
        <LazyStudyProgress courses={studyProgress} />
      </ErrorBoundary>
    </div>

    <ErrorBoundary fallbackTitle="Room Error">
      <AmbientRoomPanel
        roomStyle={roomStyle}
        outfit={outfit}
        roomItems={roomItems}
        morningMessage={morningMessage}
      />
    </ErrorBoundary>

    {pendingAchievementKey && (
      <AchievementUnlockOverlay
        achievementKey={pendingAchievementKey}
        onClose={() => setPendingAchievementKey(null)}
      />
    )}
  </div>
);
```

Wichtig: exakte Feld-Namen aus `DashboardNextTasksResponse` prüfen und ggf. adapten.

- [ ] **Step 3: Alte Imports räumen**

`NBAHeroZone`, `MorningRitual`, `Sparkles`, `Flame`, `GraduationCap`, `CheckCircle2`, `format` — wenn nicht mehr verwendet, entfernen. `LucianRoom` verschwindet aus page-imports (zieht in AmbientRoomPanel um).

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Alle Felder im neuen JSX müssen exakt in der Response existieren. Falls nicht → Fallback mit null.

---

## Task 7: Tests anpassen

**Files:**
- Check: `tests/unit/today-*` (falls existent)
- Check: `tests/integration/dashboard-*.test.*`
- Check: `tests/e2e/today-*.spec.ts`

- [ ] **Step 1: Tests laufen lassen**

```bash
npm run test:unit
```

- [ ] **Step 2: Falls Today-spezifische Tests brechen**

Angucken, ob Test-Selektoren (`data-testid`, Text) noch passen. Wenn Test einen Text sucht, der nicht mehr existiert → Test updaten, aber nur so viel wie nötig. Bei Zweifeln: Test mit `skip` markieren und in Commit-Message erwähnen.

- [ ] **Step 3: Retry bis grün**

---

## Task 8: Commit + Push

- [ ] **Step 1: Staging**

```bash
git add components/features/today/ app/\(dashboard\)/today/page.tsx
git status
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: /today redesign v2 — Trajectory hero + MomentumPulse + NextMoves stack

- Trajectory-Kollisionsvorschau als Hero (mini-timeline + status pill)
- MomentumPulse als animierter Ring statt Chip
- NextMovesStack mit 3 Action-Karten (KIT-Event, Deadline, Task)
- LucianRoom in AmbientRoomPanel geschrumpft (~120px)
- Neue Komponenten unter components/features/today/
- Datenquelle unverändert (/api/dashboard/next-tasks)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

- [ ] **Step 3: Push**

```bash
git push --set-upstream origin feature/today-redesign-v2
```

**Kein `gh pr create` in dieser Session** — der Human-Partner eröffnet den PR selbst, wenn er das Redesign beim Aufwachen ansieht und für gut befindet.

---

## Abbruch-Kriterien

Wenn während der Session folgendes passiert, **STOP** und schreibe einen Status-Report als Commit-Message:

- Type-Check bricht und lässt sich nicht in 3 Iterationen lösen
- Ein Test bricht, der inhaltlich korrekt ist und nicht nur einen Selektor betrifft
- DashboardNextTasksResponse hat andere Felder als erwartet (dann Schemas checken, nicht raten)
- Pre-Commit-Hook blockiert und Ursache ist nicht Disk-Space

Lieber unvollständig aber sauber committed als schnell und kaputt.
