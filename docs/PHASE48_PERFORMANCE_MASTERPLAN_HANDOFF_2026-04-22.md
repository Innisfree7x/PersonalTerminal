# Phase 48 — Performance Masterplan Handoff (Claude)

Stand: 2026-04-23
Status: A1, A2, B, C sowie D1 (`/workspace/tasks`) und D2 (`/uni/courses`)
abgeschlossen und auf `main` gemerged.
D3 (`/today` server-first) wurde umgesetzt und anschließend reverted:
blockierender `getDashboardNextTasks` im Server Component sprengte das
E2E Blocker SLO `user can open /today within p95 budget`
(`domContentLoadedEventEnd` > 2000 ms in CI). `/today` bleibt
Client-fetched. Neuer Versuch nur mit Plan, der TTFB nicht regressen
lässt — siehe Abschnitt D.

## Ziel

Diese Datei ist ein **konkreter Übergabe-Plan für Claude**, damit die
Performance-Roadmap ohne erneute Analyse direkt weiter implementiert werden kann.

Fokus:

- weniger RAM-Verbrauch im Browser
- weniger unnötige Client-Runtime
- stabilere, konsistente Datenpfade
- server-first für Kernseiten

---

## Bereits erledigt

## Phase 0 (fertig)

1. Dashboard-Remount entfernt
   - `app/(dashboard)/layout.tsx`
   - `key={pathname}` im Content-Wrapper entfernt

2. Next-Tasks Query-Key und Fetch vereinheitlicht
   - Neu: `lib/dashboard/nextTasksClient.ts`
   - eingeführt:
     - `DASHBOARD_NEXT_TASKS_QUERY_PREFIX`
     - `DASHBOARD_NEXT_TASKS_QUERY_KEY`
     - `fetchDashboardNextTasks()`
     - `fetchDashboardNextTasksSafe()`
   - angebundene Dateien:
     - `app/(dashboard)/today/page.tsx`
     - `lib/hooks/useRoomState.ts`
     - `components/features/dashboard/FocusTasks.tsx`
     - `components/providers/LucianBubbleProvider.tsx`
     - `components/features/focus/FocusScreen.tsx`
     - `components/providers/PowerHotkeysProvider.tsx`
     - `components/layout/Sidebar.tsx`
     - `components/features/university/CourseCard.tsx`
     - `lib/command/executor.ts`
     - `app/(dashboard)/career/strategy/page.tsx`

3. Header-Ticks isoliert
   - `components/layout/Header.tsx`
   - Timer-Teil in `FocusTimerButton` ausgelagert, damit Header nicht sekündlich
     komplett neu rendert

4. Middleware-Matcher vervollständigt
   - `middleware.ts`
   - Matcher ergänzt um:
     - `/strategy/:path*`
     - `/trajectory/:path*`

## Phase 1 (fertig)

5. Lucian-Bubble aus globalem Root entfernt (route scope verbessert)
   - `app/layout.tsx`: `LucianBubbleProvider` entfernt
   - `app/(dashboard)/layout.tsx`: nur noch im Dashboard gemountet
   - auf `/focus` zusätzlich deaktiviert

## A1 (fertig, Commit 8b08b74)

Champion-Runtime route-gated + safe fallback.

- `app/(dashboard)/layout.tsx`: `ChampionProvider` nur noch aktiv
  außerhalb von `/focus`, `/settings`, `/reflect/*`, `/analytics/*`
- `components/providers/ChampionProvider.tsx`: `useChampion` hat safe
  localStorage-Fallback, damit Komponenten außerhalb des Providers
  nicht crashen
- Champion-Sprite/VFX/Hotkeys laufen nur noch auf relevanten Flows

## A2 (fertig, Commit e9829b0)

LucianBubble route-scope.

- `app/(dashboard)/layout.tsx`: `LucianBubbleProvider` nur noch aktiv
  auf `/today` und `/today/*` (statt dashboardweit mit Disable auf
  `/focus`)
- Queries innerhalb (`daily-tasks`, `focus-sessions`, `applications`)
  waren bereits `enabled: contextHintsActive`-gated — das A2-Change
  schaltet zusätzlich den Provider-Mount selbst aus

## B (fertig, Commit 988f19b)

Baseline-Metriken dokumentiert in `docs/PHASE48_BASELINE_2026-04-22.md`:

- Bundle-Sizes je Route aus `next build`
- Statische Query-Observer-Counts pro Route
- Provider-Mount-Matrix vorher/nachher
- Methodik + Platzhalter für Runtime-Messungen (React Profiler,
  Chrome Memory) — vom User in einer Browser-Session nachzutragen

## C (fertig, Commit 0003c68)

Invalidation-Helper zentralisiert: neu `lib/dashboard/invalidation.ts`
mit `invalidateDailyTasksAndNextTasks`,
`invalidateCoursesAndNextTasks`, `invalidateGoalsAndNextTasks`.
Ersetzt 9 duplizierte Invalidation-Paare in FocusTasks, CourseCard,
Command Executor und Career Strategy. Verhalten unverändert, nur DRY
und als Single Source of Truth für spätere Scope-Präzisierung.

---

## Was konkret noch fehlt

## A) Phase 1 abschließen — Provider Scope + Lazy Runtime

### A1. Champion Runtime weiter eingrenzen

Aktuell ist `ChampionProvider` noch dashboardweit aktiv.  
Ziel: nur dort laufen lassen, wo Champion wirklich gebraucht wird.

Empfohlene Umsetzung:

- in `app/(dashboard)/layout.tsx` route-gated mount
- mindestens für folgende Routen deaktivieren:
  - `/focus`
  - `/settings`
  - `/reflect/*` (falls Champion dort keinen Produktnutzen hat)
- optional: zusätzlich lazy-load des Providers per `next/dynamic` (ssr: false)

Akzeptanzkriterium:

- Champion-Sprite/VFX/Hotkeys laufen nur auf relevanten Flows
- keine Regression auf `/today`, `/workspace/*`, `/uni/*`, `/career/*`

### A2. Lucian Bubble Query-Fanout auf Today begrenzen

`LucianBubbleProvider` hängt noch mehrere Queries dran
(`daily-tasks`, `focus-sessions`, `applications` etc.).

Ziel:

- Context-Hints nur auf `/today` (oder enger) aktiv
- auf anderen Dashboard-Routen keine unnötigen Lucian-Kontext-Queries

Akzeptanzkriterium:

- bei Navigation außerhalb `/today` sinkt Query-Observer-Zahl messbar
- Bubble-Basisfunktion bleibt intakt

---

## B) Baseline messen (verbindlich, bevor Phase 2/3 fertig)

Messpunkte erfassen und im selben Dokument ergänzen:

1. React Profiler
   - `/today` Initial Render + 1 Routewechsel
2. Chrome Performance
   - CPU/Script beim Laden von `/today`, `/uni/courses`, `/focus`
3. Chrome Memory
   - Heap nach Cold Load + nach 3 Navigationswechseln
4. Query-Observer Anzahl
   - pro Seite `/today`, `/workspace/tasks`, `/uni/courses`
5. Bundle pro Route
   - `next build` Output für relevante Routen

Akzeptanzkriterium:

- Vorher-/Nachher-Werte dokumentiert (nicht nur subjektiv)

---

## C) Phase 2 — Data Layer weiter verschlanken

### C1. API-Fanout reduzieren

Ziel:

- mehr Daten aus zentralem Bundle statt mehrere Einzel-Requests
- Duplikate in Query-Nutzung entfernen

Hotspots:

- `components/providers/LucianBubbleProvider.tsx`
- `components/providers/PowerHotkeysProvider.tsx`
- `components/features/focus/FocusScreen.tsx`

### C2. Query-Invalidation präzisieren

Ziel:

- weniger breit invalidieren
- Prefetch- und Stale-Strategie zwischen Today/Uni/Career angleichen

---

## D) Phase 3 — Server-First Kernpfad (OFFEN)

Kernseiten auf server-first umstellen (gestuft):

1. `/today`
2. `/uni/courses`
3. `/workspace/tasks`

Mindestziel je Seite:

- serverseitiges Prefetch der Kernqueries
- Hydration mit `HydrationBoundary`
- weniger clientseitige Erst-Requests direkt nach Mount

### Wichtige Stolpersteine aus der Vorab-Analyse

- **Date-Serialisierung:** `/uni/courses` verwendet `Date`-Objekte in
  den Query-Daten (`examDate`, `createdAt`). `HydrationBoundary`
  serialisiert via JSON, wodurch Dates zu Strings werden. Lösung:
  entweder die Daten un-normalized (als Strings) in den Cache und
  clientseitig normalisieren — oder `initialData`-Prop statt
  Hydration-Boundary. Letzterer ist einfacher.

- **Datums-Navigation:** `/workspace/tasks` erlaubt Blättern durch
  vergangene/zukünftige Tage. Prefetch lohnt nur für `today`; für
  andere Tage bleibt client-side fetch. D.h. `initialData` ist die
  richtige Pattern, keine fully-server-driven Page.

- **/today** ist am komplexesten — viele hooks, Dynamic imports,
  AchievementUnlockOverlay, Room-State-Hook etc. Umstellung in zwei
  Schritten:
  1. `app/(dashboard)/today/page.tsx` → wird Server Component +
     prefetcht `DASHBOARD_NEXT_TASKS_QUERY_KEY`
  2. Bestehender Client-Code zieht nach `app/(dashboard)/today/TodayClient.tsx`

### Empfohlene Reihenfolge für D (Safety-first)

1. **`/workspace/tasks`** — kleinste Oberfläche, 1 useQuery + 3
   useMutation, keine Date-Objekte in Query-Daten. Guter Testfall
   für das Pattern.
2. **`/uni/courses`** — Date-Serialisierung klären (Empfehlung:
   initialData-Pattern statt HydrationBoundary).
3. **`/today`** — zuletzt, weil am komplexesten und am
   risikoreichsten.

Akzeptanzkriterium:

- weniger Wasserfall im Network-Tab
- Time-to-interactive stabiler bei schwächerer Hardware
- Keine Regression in Today/Dashboard critical-path tests

---

## E) Qualitäts- und Safety-Regeln für Claude

1. Bestehende, fremde Änderungen im dirty tree **nicht** zurücksetzen.
2. Keine funktionalen Produktänderungen, nur Performance-/Architekturpfad.
3. Keine neuen API-Endpunkte ohne klaren Bedarf.
4. Nach jedem Teilblock:
   - `npm run type-check`
   - zielgerichtete Tests laufen lassen
5. Bei Scope-Risiko:
   - kleinen, klaren PR-fähigen Step bevorzugen.

---

## Verifikation (Minimum)

Nach jedem größeren Teil:

- `npm run type-check`
- `npx vitest run tests/integration/today-critical-path.test.tsx tests/integration/Dashboard.test.tsx`

Je nach berührtem Bereich zusätzlich:

- betroffene Unit-Tests (Provider, Hooks, Dashboard-Queries)

---

## Copy/Paste Brief für Claude

Nutze folgenden Brief 1:1:

1. Lies zuerst `docs/PHASE48_PERFORMANCE_MASTERPLAN_HANDOFF_2026-04-22.md`.
2. Implementiere danach in genau dieser Reihenfolge:
   - A1 Champion route-scope/lazy runtime
   - A2 Lucian Bubble Queries auf Today begrenzen
   - B Baseline messen und dokumentieren
   - C Data-Layer Fanout/Invalidation weiter senken
   - D Server-first für `/today`, dann `/uni/courses`, dann `/workspace/tasks`
3. Halte alle Änderungen klein und verifizierbar.
4. Führe nach jedem Teilblock `npm run type-check` und relevante Tests aus.
5. Ändere keine unrelated files aus dem bestehenden dirty tree.

---

## DoD für diese Phase

- [ ] Phase 1 vollständig abgeschlossen (Provider scope + runtime gating)
- [ ] Baseline-Metriken dokumentiert
- [ ] Phase 2 umgesetzt (weniger Fanout, stabilere Query-Kardinalität)
- [ ] Phase 3 Kernseiten server-first + HydrationBoundary
- [ ] Keine Regression in Today/Dashboard critical-path tests
