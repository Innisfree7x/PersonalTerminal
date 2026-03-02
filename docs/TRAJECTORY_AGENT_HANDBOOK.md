# Trajectory Agent Handbook

Last updated: 2026-03-02  
Owner: Core Agent

## Scope
This document is the operational handoff for all future AI agents touching `/trajectory`.
It captures architecture, failure patterns, test gates, and safe-change boundaries.

## What Is Live

- Route/UI: `app/(dashboard)/trajectory/page.tsx`
- Data/logic: `lib/trajectory/planner.ts`, `lib/trajectory/timeline.ts`
- APIs:
  - `app/api/trajectory/overview/route.ts`
  - `app/api/trajectory/plan/route.ts`
  - `app/api/trajectory/settings/route.ts`
  - `app/api/trajectory/goals/route.ts`
  - `app/api/trajectory/goals/[id]/route.ts`
  - `app/api/trajectory/windows/route.ts`
  - `app/api/trajectory/windows/[id]/route.ts`
  - `app/api/trajectory/blocks/commit/route.ts`
  - `app/api/trajectory/tasks/package/route.ts`

## Guardrails (Do Not Break)

1. Timeline calculations are deterministic and centralized in `lib/trajectory/timeline.ts`.
2. Risk thresholds remain planner-owned (`lib/trajectory/planner.ts`), not UI-owned.
3. Keep first/last timeline tick readable at all horizons (6-36 months).
4. No inline date-grid algorithm rewrites in `page.tsx`; update shared utilities first.
5. Any import referenced by runtime routes must exist before merge (`npm run build` gate).

## Known Failure Modes (Observed)

1. `useMemo` dependency ordering bug (`timelineStart/timelineEnd` used before declaration) caused type-check failure.
2. Timeline label collisions at edges (first/last tick overlap) caused unreadable ruler.
3. Vercel can fail post-build with provider-side internal errors even when local build is green.

## Mandatory Verification (Trajectory Changes)

Run in this order:

1. `npm run type-check`
2. `npm run lint`
3. `npx vitest run tests/unit/trajectory-timeline.test.ts tests/unit/trajectory-planner.test.ts tests/unit/api/trajectory-plan.test.ts tests/unit/api/trajectory-settings.test.ts`
4. `npm run build`

If any of these fail, do not continue with UI polish commits.

## UI Rules for Timeline Ruler

1. Month labels switch to compact numeric format for long horizons (`MM.yy` at >= 18 months).
2. Quarter glow bars stay subtle and horizontal (top ruler accent).
3. Month ticks must respect min-gap filtering to avoid visual clustering.
4. Timeline width scales with horizon (`timelineMinWidth`) to preserve readability.

## Testing Strategy

### Unit (must stay green)

- `tests/unit/trajectory-timeline.test.ts`
  - month label format thresholds
  - first/last tick preservation
  - min-gap filtering behavior
  - quarter segment generation

- `tests/unit/trajectory-planner.test.ts`
  - risk boundary behavior
  - overlap classification
  - deterministic task package dates

### API Unit

- `tests/unit/api/trajectory-plan.test.ts`
- `tests/unit/api/trajectory-settings.test.ts`

## Change Protocol for Future Agents

1. Diagnose first:
   - reproduce issue
   - identify owning layer (`timeline.ts`, planner, API, UI)
2. Apply minimal fix in owner layer.
3. Add/adjust tests for regression coverage.
4. Run mandatory verification sequence.
5. Update this handbook with any new failure mode.

## Open Improvements (Backlog)

1. Optional tooltip on ruler ticks for exact month boundaries.
2. Snapshot tests for `/trajectory` ruler rendering.
3. E2E scenario for horizon switching + timeline readability assertions.
