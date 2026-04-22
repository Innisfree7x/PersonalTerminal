# Phase 48 — Performance Masterplan Handoff (Claude)

Stand: 2026-04-22  
Status: In Progress (Phase 0 abgeschlossen, Phase 1 teilweise)

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

## Phase 1 (teilweise erledigt)

5. Lucian-Bubble aus globalem Root entfernt (route scope verbessert)
   - `app/layout.tsx`: `LucianBubbleProvider` entfernt
   - `app/(dashboard)/layout.tsx`: nur noch im Dashboard gemountet
   - auf `/focus` zusätzlich deaktiviert

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

## D) Phase 3 — Server-First Kernpfad

Kernseiten auf server-first umstellen (gestuft):

1. `/today`
2. `/uni/courses`
3. `/workspace/tasks`

Mindestziel je Seite:

- serverseitiges Prefetch der Kernqueries
- Hydration mit `HydrationBoundary`
- weniger clientseitige Erst-Requests direkt nach Mount

Akzeptanzkriterium:

- weniger Wasserfall im Network-Tab
- Time-to-interactive stabiler bei schwächerer Hardware

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
