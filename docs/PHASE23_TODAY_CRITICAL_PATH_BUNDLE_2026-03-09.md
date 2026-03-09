# Phase 23 — Today Critical Path Bundle (2026-03-09)

Status: Implemented  
Scope: Performance + Reliability hardening for `/today` without UI regression.

## Ziel

`/today` hat parallel mehrere API-Loads gestartet (`next-tasks` + `trajectory/morning` + Calendar).  
Diese Welle reduziert Roundtrips auf dem Critical Path und entfernt doppelte Route-Logik.

## Änderungen

### 1) Gemeinsame Morning-Snapshot-Logik extrahiert

- Neu: `lib/trajectory/morningSnapshot.ts`
  - `buildTrajectoryMorningSnapshot(userId)` als Single Source of Truth.
  - Liefert:
    - `payload` (generatedAt, overview, momentum)
    - `meta` (queryDurationMs, goalCount, generatedBlocks)

- Route-Refactor:
  - `app/api/trajectory/morning/route.ts` nutzt jetzt die Shared-Funktion statt eigener duplicate-Implementierung.

### 2) `/api/dashboard/next-tasks` optional mit Morning-Daten

- Datei: `app/api/dashboard/next-tasks/route.ts`
- Neue Query-Option:
  - `GET /api/dashboard/next-tasks?include=trajectory_morning`
- Verhalten:
  - baut `next-tasks` + Morning-Snapshot parallel auf
  - hängt `trajectoryMorning` optional an Response an
  - erweitert `Server-Timing` um `traj_build;dur=...` wenn inkludiert
  - schreibt zusätzliche Flow-Metric-Kontextdaten für die Bundle-Variante

- Typisierung:
  - `lib/dashboard/queries.ts`
  - `DashboardNextTasksResponse` enthält optional `trajectoryMorning`.

### 3) `/today` auf kombinierten Fetch umgestellt

- Datei: `app/(dashboard)/today/page.tsx`
- Neuer Fetch:
  - von `/api/dashboard/next-tasks`
  - auf `/api/dashboard/next-tasks?include=trajectory_morning`
- Effekt:
  - ein Request weniger auf Initial-Load
  - kein separater `trajectory/morning` Query-Block mehr im Client
  - Morning-Briefing/Momentum weiterhin unverändert vorhanden

### 4) Reliability-Fix für Storage in Test-/Restricted-Umgebungen

- Datei: `app/(dashboard)/today/page.tsx`
- `localStorage.getItem/setItem` für weekly-checkin robust abgesichert:
  - Funktions-Guards + try/catch
  - verhindert Runtime-Crashs bei nicht-standard JS-DOM/localStorage-Mocks

## Tests

Neu:
- `tests/unit/api/dashboard-next-tasks-route.test.ts`
  - auth failure
  - normal payload ohne include
  - payload + Server-Timing mit `include=trajectory_morning`

- `tests/unit/trajectory-morning-snapshot.test.ts`
  - snapshot payload/meta Aufbau
  - planner + momentum wiring

Aktualisiert:
- `tests/unit/api/trajectory-morning.test.ts` (refactor-kompatibel)
- `tests/integration/Dashboard.test.tsx` (neuer API-Call-Pfad)

## Verifikation

- `npm run test -- --run tests/unit/api/trajectory-morning.test.ts tests/unit/api/dashboard-next-tasks-route.test.ts tests/unit/trajectory-morning-snapshot.test.ts tests/integration/Dashboard.test.tsx` ✅
- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run build` ✅

## Ergebnis

- `/today` lädt den Trajectory-Morning-Block jetzt ohne extra API-Request.
- Morning-Logik ist zentralisiert, dadurch weniger Drift-Risiko zwischen Routes.
- Testabdeckung für Bundle-Verhalten + Snapshot-Aufbau ist vorhanden.
