# Phase 22 — Calendar/Trajectory/Focus Polish

Stand: 2026-03-08  
Status: Implemented (Core Scope 8/9/10)

## Ziel

Diese Welle setzt drei UX-Polish-Features um:

1. **Calendar Trajectory Events (1.8)**  
   Trajectory-Milestones/Prep-Blocks/Windows als visuell getrennte Ghost-Events im Week-Calendar.
2. **Focus Transition (1.3)**  
   Cinematic Fade/Blur beim Wechsel Richtung `/focus` statt hartem Navigationssprung.
3. **Trajectory Status Highlight (1.2)**  
   Kurzes, gedrosseltes Pulse-Feedback bei echtem Risk-Status-Wechsel pro Milestone.

## Umgesetzte Änderungen

### 1) Calendar Ghost Events

- Neu: `lib/calendar/trajectoryGhostEvents.ts`
  - `buildTrajectoryGhostEventsForWeek(...)` erzeugt pro Kalendertag Ghost-Event-Buckets.
  - Unterstützt:
    - aktive Milestones (Due-Date)
    - generierte Prep-Blocks (Date-Span)
    - Opportunity Windows (Date-Span)
  - Sortierung: Milestone -> Prep Block -> Window, mit Risk-Priorität.

- Datei: `app/(dashboard)/calendar/page.tsx`
  - zusätzliche Query auf `/api/trajectory/overview`.
  - Ghost-Events werden in jeder Day-Column zusätzlich zu Google-Events gerendert.
  - visuell klar getrennt:
    - dashed border
    - reduzierte opacity
    - `trajectory` Tag.
  - Toggle im Header:
    - `Show/Hide Trajectory Ghosts`
  - Persistenz:
    - `STORAGE_KEYS.calendarShowTrajectoryGhostEvents`
  - Iteration 2:
    - Trajectory-Overview-Query wird nur noch geladen, wenn Ghost-Events sichtbar sind (`enabled: isConnected && showTrajectoryGhostEvents`).
    - Legend-Zeile ergänzt (Milestone / Prep Block / Window + Wochenanzahl).
    - Ghost-Events sind klickbar und deep-linken direkt in Trajectory:
      - `/trajectory?goalId=...`
      - `/trajectory?windowId=...`

- Datei: `lib/storage/keys.ts`
  - neuer Key:
    - `innis:calendar:show-trajectory-ghost-events:v1`

### 2) Focus Transition

- Neu: `lib/navigation/focusTransition.ts`
  - `navigateToFocusWithTransition(router, href?)`
  - Overlay mit kurzer Blur/Fade-Animation vor `router.push('/focus')`.
  - `prefers-reduced-motion` wird respektiert (Fallback: direkte Navigation).
  - In-Flight Guard verhindert Doppel-Trigger.

- Verdrahtet in:
  - `components/features/dashboard/PomodoroTimer.tsx`
  - `components/features/focus/FloatingTimer.tsx`
  - `components/shared/CommandPalette.tsx` (`Focus Mode` Command)

### 3) Trajectory Status Highlight

- Neu: `lib/trajectory/statusTransition.ts`
  - `detectGoalStatusTransitions(...)`
  - erkennt echte Statuswechsel (`on_track/tight/at_risk`) inkl. Cooldown-Logik.

- Datei: `app/(dashboard)/trajectory/page.tsx`
  - Pulse-Mechanik auf Milestone-Ebene:
    - nur bei Statuswechsel
    - Cooldown: 10s pro Goal
    - Pulse-Dauer: 1.8s
  - Visual Feedback auf:
    - Timeline-Milestone-Marker
    - Milestone-Card im Sidebar-Panel

## Tests

- Neu:
  - `tests/unit/trajectory-ghost-events.test.ts`
  - `tests/unit/trajectory-status-transition.test.ts`
  - `tests/unit/focus-transition.test.ts`

- Abdeckung:
  - Ghost-Event-Mapping (Milestone/Block/Window + out-of-range/archived cases)
  - Ghost-Event-IDs für Deep-Link-Ziele (`goalId`, `windowId`)
  - Status-Change-Detection inkl. Cooldown und Initial-State
  - Focus-Transition Verhalten:
    - Reduced-motion Fallback
    - Overlay-Lifecycle
    - In-flight Guard bei Doppel-Klick

## Verifikation

Ausgeführt:

- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run test -- --run tests/unit/trajectory-ghost-events.test.ts tests/unit/trajectory-status-transition.test.ts` ✅
- `npm run test -- --run tests/unit/api/*.test.ts tests/unit/trajectory-ghost-events.test.ts tests/unit/trajectory-status-transition.test.ts` ✅
- `npm run build` ✅

## Bekannte Grenzen

1. Ghost-Events sind derzeit auf die bestehende Week-View optimiert.  
   Für eine spätere Month-View sollte die Dichte-Strategie angepasst werden (Aggregation statt täglicher Wiederholung).

2. Focus Transition ist aktuell ein UI-Overlay beim Navigationsstart.  
   Falls später ein globales Transition-System kommt, sollte die Helper-Funktion dort zentral integriert werden.

3. Status-Pulse ist absichtlich kurz und gedrosselt.  
   Für weitergehende Alerts (z. B. persistent "new risk" chip) ist eine eigene UX-Ebene sinnvoll.

## Nächste sinnvolle Schritte

1. E2E-Test für `/today -> /focus` Transition + Smoke-Test für Ghost-Render.
2. Optional: kleine Hover-Quick-Actions im Calendar (z. B. "Open goal").
3. Optional: Month-View Ghost-Strategie (verdichten statt Tages-Wiederholung).
