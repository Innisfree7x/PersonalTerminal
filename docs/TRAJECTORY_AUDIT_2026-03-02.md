# Trajectory Audit — 2026-03-02

Status: PASS (targeted trajectory scope)
Owner: Core Agent

## Audit Goal
Validate the current `/trajectory` implementation for correctness, readability regressions, and release safety.

## Findings

### P0
None.

### P1
None.

### P2
1. Timeline label crowding risk at long horizons near left/right edges.
   - Mitigation implemented: centralized tick spacing + min-gap filtering in `lib/trajectory/timeline.ts`.
2. Component-level ordering regression risk for `useMemo` dependencies.
   - Mitigation implemented: timeline date primitives now defined before dependent labels (`timelineRangeLabel`).

## Fixes Applied in Audit Pass

1. Extracted ruler logic to shared utility (`buildTimelineRuler`) for deterministic behavior and easier testing.
2. Adjusted range label to compact date format (`MM.yy -> MM.yy`) for high-density readability.
3. Reworked quarter labels to segment-centered layout and retained subtle quarter glow accents.
4. Scaled timeline min width with selected horizon to avoid compression artifacts.

## Verification Evidence

Executed successfully:

1. `npm run type-check`
2. `npm run lint`
3. `npx vitest run tests/unit/trajectory-timeline.test.ts tests/unit/trajectory-planner.test.ts tests/unit/api/trajectory-plan.test.ts tests/unit/api/trajectory-settings.test.ts`
4. `npm run build`

Notes:
- Build emits existing monitoring warnings (`lib/monitoring/index.ts` dynamic dependency) but completes successfully.
- No trajectory-specific compile/type failures remain.

## Regression Tests Added

- `tests/unit/trajectory-timeline.test.ts`
  - month label format threshold behavior
  - first/last tick preservation
  - min-gap tick filtering
  - quarter segment generation sanity

## Remaining Risks

1. No visual snapshot tests for timeline ruler yet.
2. No trajectory-specific E2E test for horizon slider + ruler readability path.

## Recommended Next

1. Add Playwright visual baseline for `/trajectory` at horizon values `12`, `24`, `36`.
2. Add one E2E deterministic assertion for first/last visible timeline labels after horizon change.
