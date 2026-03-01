# Agent Change Review — 2026-03-01

Status: Reviewed by Core  
Scope: latest agent worktree changes + CI hardening chain + `/today` Bento rollback impact

## Review Verdict
- Product code: **GO** for CI + deploy integrity path.
- Reliability track scope (Phase 14): **still NO-GO** until remaining ops P1 items are fixed.
- CI secret configuration: **present in runner env**.
- Documentation: synchronized to current runtime state and rollout reality.

## Findings (ordered by severity)

### P1-1 (Open): Ops cron tracking and burn-rate snapshot persistence can silently no-op
- Why: cron paths use `createClient()` (anon key) for RLS-protected ops tables.
- Impact: ops data may not persist, dashboard may appear healthy while telemetry is incomplete.
- Files:
  - `lib/ops/cronHealth.ts`
  - `app/api/cron/ops-reliability/route.ts`

### P1-2 (Open): RLS read access for ops tables is too broad
- Why: migration grants `SELECT` on ops tables to all authenticated users.
- Impact: non-admin users can read operational incidents/cron health/burn-rate history.
- File:
  - `docs/migrations/2026-03-01_ops_reliability.sql`

### P1-3 (Resolved): Blocker E2E gate instability in critical flows
- Resolution summary:
  - selector/visibility race conditions removed from blocker specs
  - stable test IDs and persistence checks introduced
  - blocker suite now green on `main`
- Evidence:
  - CI `22544440054` ✅
  - CI `22544675875` ✅
  - CI `22544782430` ✅

### P1-4 (Resolved): Deploy compile failure due to missing committed module
- Root cause: `app/api/cron/ops-reliability/route.ts` imported `@/lib/ops/degradation` while file was untracked locally.
- Resolution: `lib/ops/degradation.ts` committed in `60d252b`.
- Prevention: CI `Quality Checks` now enforces `npm run build`.

### P2-1 (Resolved): Phase docs were out of sync with runtime reality
- Files aligned:
  - `docs/BENTO_REDESIGN.md`
  - `docs/CONTEXT_CANON.md`
  - `docs/PHASE14_RELIABILITY_OPS.md`

### P2-2 (Open): `@ts-nocheck` in ops reliability files reduces type-safety
- Files:
  - `app/api/cron/ops-reliability/route.ts`
  - `lib/ops/alertChannels.ts`
  - `lib/ops/burnRateAlerts.ts`
  - `lib/ops/cronHealth.ts`

## Bento Phase Follow-up Audit

### Current runtime state
- `/today` is currently the 3-column baseline layout:
  - left: `FocusTasks` + `UpcomingDeadlines`
  - middle: `ScheduleColumn` + `PomodoroTimer`
  - right: `QuickActionsWidget` + `StudyProgress` + `WeekOverview`
- No active `bento` module/feature marker is present in runtime code paths.
- Pomodoro is mounted and includes custom duration input.
- `StudyProgress` sorting is by nearest exam date (upcoming first).

### Consequence assessment
- No active bento-only codepath conflict detected.
- Main risk is **UX regression by uncontrolled reintroduction** (high density, nested scrolls, cramped right rail).
- Recommendation: reintroduce only with widget-level flags and per-breakpoint QA snapshots.

## Innovation Backlog (next phase candidates)

### 1) Adaptive Focus Surface (P0 UX)
- Make background intensity, quote cadence, and Lucian presence react to timer state and streak context.
- Provide `calm`, `dynamic`, and `static` modes with `prefers-reduced-motion` compliance.

### 2) Reliability Control Tower (P0 Ops)
- New `/analytics/ops` view: burn-rate sparkline, cron heartbeat heatmap, incident timeline.
- Admin actions: acknowledge, resolve, mute (30m/2h).

### 3) Intent Confidence + Undo Queue (P1 Command Layer)
- Show confidence score and dry-run preview before high-impact intents.
- Add reversible action queue for `create_task` and `create_goal`.

### 4) `/today` Micro-Density Modes (P1 UX)
- Keep 3-column base, introduce per-widget compactness (`comfortable`, `compact`) instead of layout replacement.
- Persist setting per user + route.

### 5) Lucian Silent Coach 2.1 (P1 Retention)
- Optional non-verbal guidance mode (ambient cues, no constant speech bubble).
- Trigger limits from error budget and current workload pressure.

## Required next actions before release
1. Switch ops cron DB access to admin/service-role client for writes/reads.
2. Tighten ops table RLS read policies to admin-only.
3. Remove `@ts-nocheck` from ops files and regenerate Supabase types for new ops tables.
4. Keep CI guardrails enforced (`type-check`, `lint`, `vitest`, `build`, blocker E2E) and treat any red deploy as release blocker.

## Related planning docs
- `docs/MORNING_BRIEF_2026-03-01.md`
- `docs/PHASE15_INNOVATION_CANDIDATES.md`
