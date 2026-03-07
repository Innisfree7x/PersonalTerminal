# Phase 21 — Wave 1: Performance, Reliability & Security Hardening

Stand: 2026-03-07  
Status: Implemented (Wave 1)

## Ziel

Wave 1 fokussiert auf drei direkte Hebel:

1. Weniger Latenz auf häufigen Dashboard-/Today-Calls
2. Weniger API-Overhead auf jeder Request-Kette
3. Baseline-Schutz gegen einfache Cross-Origin-Mutations

Kein Feature-Scope, kein UI-Rewrite außerhalb des Premium-Polish-Vertrags.

## Umgesetzte Änderungen

### 1) API-Middleware-Overhead reduziert

- Datei: `middleware.ts`
- Änderung: `/api/:path*` aus `matcher` entfernt.
- Effekt: Keine zusätzliche `supabase.auth.getUser()`-Ausführung mehr in Middleware für jeden API-Call.
- Hinweis: Route-Auth bleibt unverändert in den API-Handlern (`requireApiAuth`).

### 2) Hot-Path Query-Optimierung

- Datei: `app/api/dashboard/today/route.ts`
  - vorher: Voll-Reads via `fetchGoals` + `fetchApplications`, danach In-Memory-Filter
  - jetzt: zielgerichtete SQL-Reads mit Date-Filtern:
    - Goals nur `target_date = today`
    - Interviews nur im 3-Tage-Fenster
    - Follow-Ups nur `status=applied` und älter als 7 Tage
  - zusätzlich: Antwort mit privater SWR-Policy

- Datei: `lib/dashboard/queries.ts` (`getDashboardStats`)
  - vorher: vollständiger Pull von `exercise_progress` inklusive In-Memory-Aggregation
  - jetzt: DB-seitige Count-Queries:
    - total exercises
    - completed exercises
    - completed this week
  - Ergebnis: deutlich weniger Payload und Rechenlast in Node.

### 3) Antwort-Caching standardisiert (private SWR)

- Neue Datei: `lib/api/responsePolicy.ts`
  - `applyPrivateSWRPolicy(response, { maxAgeSeconds, staleWhileRevalidateSeconds })`
  - setzt:
    - `Cache-Control: private, max-age=..., stale-while-revalidate=...`
    - `Vary: Cookie`
    - `X-Robots-Tag: noindex, nofollow`

- Eingesetzt in:
  - `app/api/dashboard/next-tasks/route.ts`
  - `app/api/dashboard/stats/route.ts`
  - `app/api/dashboard/today/route.ts`
  - `app/api/dashboard/week-events/route.ts`
  - `app/api/focus-sessions/route.ts` (GET)
  - `app/api/daily-tasks/route.ts` (GET)

### 4) Mutations gegen einfache Cross-Origin Calls gehärtet

- Neue Datei: `lib/api/csrf.ts`
  - `enforceTrustedMutationOrigin(request)`
  - erlaubt nur bekannte Origins für mutierende Browser-Requests (`POST/PUT/PATCH/DELETE`)
  - trusted origins aus:
    - `NEXT_PUBLIC_SITE_URL`
    - `GOOGLE_REDIRECT_URI` (origin)
    - `VERCEL_URL`
    - localhost fallback

- Eingesetzt in:
  - `app/api/daily-tasks/route.ts` (POST)
  - `app/api/daily-tasks/[id]/route.ts` (PATCH/DELETE)
  - `app/api/courses/[id]/exercises/[number]/route.ts` (PATCH)
  - `app/api/focus-sessions/route.ts` (POST)

### 5) Parameter-Guards

- Datei: `app/api/dashboard/week-events/route.ts`
  - `offset` wird jetzt auf `[-52, 52]` begrenzt.

- Datei: `app/api/focus-sessions/route.ts`
  - `limit` wird robust geparst und auf `[1, 200]` begrenzt.

### 6) Security Header Baseline erweitert

- Datei: `next.config.js`
- Ergänzt:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`
  - `Origin-Agent-Cluster: ?1`
  - `X-Permitted-Cross-Domain-Policies: none`

## Premium-Polish (laut `docs/PHASE19_PREMIUM_POLISH.md`)

Zusätzlich umgesetzt:

- `components/features/dashboard/ScheduleColumn.tsx`
  - Calendar Empty State von dominantem CTA zu ruhigem Secondary-Invite umgebaut.

- `components/features/dashboard/QuickActionsWidget.tsx`
  - klare Hierarchie:
    - primäre Aktion: `Add Task`
    - vier sekundäre Actions als ruhige 2x2-Grid-Buttons
  - aggressive Hover-Scale für sekundäre Actions entfernt.

- `app/(dashboard)/today/page.tsx`
  - mehr Whitespace zwischen Morning-Briefing, CommandBar und Haupt-Grid.
  - Grid-Abstände harmonisiert (`gap-5 lg:gap-6`).

- `app/globals.css`
  - Sidebar-Surface auf konsistenten Glass-Layer angepasst.

## Verifikation

Ausgeführt:

- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run test -- --run tests/unit/api/csrf-guard.test.ts tests/unit/api/daily-tasks.test.ts tests/unit/api/courses.test.ts tests/unit/api/focus-sessions.test.ts` ✅
- `npm run build` ✅

## Risiko / Follow-up (Wave 2 Kandidaten)

1. CSRF-Origin-Guard auf weitere mutierende API-Routen ausrollen (Trajectory/Career/Goals), aktuell nur kritische Kernflüsse.
2. p95/p99 Messung pro Route in Ops-Dashboard visualisieren (nicht nur `Server-Timing` + flow metrics raw).
3. Optional: edge-cache für read-only marketing endpoints und prefetch budget tuning auf `/today`.
