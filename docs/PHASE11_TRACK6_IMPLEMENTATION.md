# Phase 11 Track 6 Implementation (Core UX-Speed & Reliability)

Stand: 2026-02-24
Owner: Codex

## Scope (implemented)

1. Persistent Flow Metrics
- New migration: `docs/migrations/2026-02-24_ops_flow_metrics.sql`
- Table: `ops_flow_metrics`
- Flows: `login`, `create_task`, `toggle_exercise`, `today_load`
- Stores: status, duration, request id, optional user id, error code, context, timestamp
- Includes RLS policies and admin read access for Ops.

2. Runtime Instrumentation
- Login flow metric reporting from `app/auth/login/page.tsx` to `POST /api/ops/flow-metrics`
- Server Action metrics:
  - `createDailyTaskAction` in `app/actions/daily-tasks.ts`
  - `toggleExerciseCompletionAction` in `app/actions/university.ts`
- `/today` load metric via `app/api/dashboard/next-tasks/route.ts`
  - Adds `X-Request-Id`
  - Logs success/failure with duration.
- Standardized API observability headers for core dashboard/today routes:
  - `Server-Timing`
  - `X-Request-Id`
  - `X-Observed-Route`
  - `X-Observed-Method`
  - Helper: `lib/api/observability.ts`

3. SLO Snapshot in Ops Dashboard
- New aggregation utility: `lib/ops/flowMetrics.ts`
- 7-day rolling snapshot in `/analytics/ops`:
  - Availability vs target
  - p95 vs target
  - Error budget burn-rate
- Integrated in `fetchMonitoringHealthAction` and `OpsHealthClient`.

4. Blocker E2E Reliability Hardening
- Dedicated blocker credentials in helper fallback chain:
  - Primary: `E2E_BLOCKER_EMAIL` / `E2E_BLOCKER_PASSWORD`
  - Fallback: `E2E_EMAIL` / `E2E_PASSWORD`
- New blocker spec: `tests/e2e/blocker/today-load.blocker.spec.mjs`
  - Default threshold: 2000ms (`E2E_BLOCKER_TODAY_LOAD_SLO_MS` override)
- New seed/reset script for blocker user:
  - `scripts/seedE2EBlockerUser.ts`
  - Script command: `npm run seed:e2e:blocker`
- CI flake gate:
  - `scripts/runBlockerE2EWithFlakeGate.mjs`
  - Script command: `npm run test:e2e:blocker:ci`
  - Default threshold: `2%` (`E2E_BLOCKER_FLAKE_THRESHOLD`)

## SLO Targets tracked

| Flow | Availability | p95 target |
|------|--------------|------------|
| login | >= 99.9% | < 1500ms |
| create task | >= 99.5% | < 700ms |
| toggle exercise | >= 99.5% | < 500ms |
| /today load | >= 99.5% | < 2000ms |

## Rollout order

1. Apply migration `2026-02-24_ops_flow_metrics.sql` in Supabase.
2. Deploy app.
3. Run `npm run seed:e2e:blocker`.
4. Run `npm run test:e2e:blocker`.
5. Validate `/analytics/ops` shows SLO cards with `Live` status.
6. In CI, use `npm run test:e2e:blocker:ci` to enforce flake threshold.

## Notes

- Weekly Review Claude API integration is intentionally not part of this Track 6 implementation.
- If migration is not applied yet, Track 6 metrics remain non-blocking and Ops UI shows `Missing table`.
