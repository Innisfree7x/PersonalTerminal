# Phase 24 — Today Query Dedupe (2026-03-09)

Status: Implemented  
Scope: `/today` Network-Dedupe + Query-Key-Klarheit

## Problem

- `TodayPage` lädt `next-tasks` mit erweitertem Payload (`include=trajectory_morning`).
- `FocusTasks` hat parallel denselben Core-Endpoint nochmals geladen.
- Beide nutzten denselben Query-Key-Namensraum (`['dashboard','next-tasks']`) trotz unterschiedlicher Fetch-URL.

Das führte zu unnötigem Netzwerk-Overhead und potenziellem QueryFn-Key-Drift.

## Umsetzung

1. `FocusTasks` kann jetzt prefetched Daten vom Parent übernehmen:
   - Datei: `components/features/dashboard/FocusTasks.tsx`
   - Neuer Prop:
     - `nextTasksData?: Pick<DashboardNextTasksResponse, 'homeworks' | 'goals' | 'interviews'>`
   - Interner Fallback-Fetch bleibt erhalten, aber nur wenn kein Prefetch übergeben wird (`enabled: !prefetchedNextTasksData`).

2. `TodayPage` gibt die bereits geladene Next-Tasks-Payload an `FocusTasks` weiter:
   - Datei: `app/(dashboard)/today/page.tsx`
   - `<FocusTasks nextTasksData={{ homeworks, goals, interviews }} />`

3. Query-Key für den gebündelten Today-Fetch präzisiert:
   - von: `['dashboard', 'next-tasks']`
   - auf: `['dashboard', 'next-tasks', 'today-bundle']`
   - verhindert Kollision mit Core-`next-tasks` Querys in anderen Widgets.
   - bestehende Invalidation per Prefix `['dashboard','next-tasks']` funktioniert weiterhin.

## Verifikation

- `npm run test -- --run tests/integration/Dashboard.test.tsx tests/unit/api/dashboard-next-tasks-route.test.ts tests/unit/api/trajectory-morning.test.ts tests/unit/trajectory-morning-snapshot.test.ts` ✅
- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run build` ✅

## Ergebnis

- Ein doppelter `/api/dashboard/next-tasks`-Call auf `/today` wurde eliminiert.
- Query-Key-Semantik ist sauber getrennt (bundled vs. core).
- Keine UI-Regression, keine Route-Verhaltensänderung für User.

## Governance Compliance (Agent Standard 2026-03-10)

Diese Welle folgt den verbindlichen Agent-Dokumenten:

- `docs/AGENT_WORKFLOW.md`
- `docs/AGENT_TASK_TEMPLATE.md`
- `docs/AI_COLLABORATION_PLAYBOOK.md`

Folgeregeln:

1. Keine neuen Fetch-Wege ohne Dedupe-Pruefung gegen bestehende Queries.
2. Query-Key-Aenderungen muessen in Integration-Tests gespiegelt sein.
3. Audit-Handoff immer mit Findings -> GO/NO-GO.
