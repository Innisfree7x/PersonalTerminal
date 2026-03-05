# Phase 17 Block 3 - Activation + Trajectory Bridge

Status: Implemented on `main`  
Date: 2026-03-05

## Goal
Reduce onboarding drop-off and connect daily execution to strategic planning without adding new runtime risk.

## Scope Implemented
1. `/today` morning briefing now deep-links to a specific trajectory goal (`/trajectory?goalId=...`).
2. `/trajectory` consumes deep-link goal context and focuses selection deterministically.
3. Command search/navigation now includes Trajectory in parser aliases and command palette navigation.
4. Onboarding V2 copy/error polish for Step 3/4/5 to improve clarity and retry behavior.
5. Analytics contract extended with `trajectory_briefing_opened`.

## Files Updated
- `app/(dashboard)/today/page.tsx`
  - morning briefing CTA now points to goal-specific trajectory route
  - briefing CTA emits `trajectory_briefing_opened`
- `lib/dashboard/trajectoryBriefing.ts`
  - returns `goalId`, `startDate`, `startDateLabel`
- `app/(dashboard)/trajectory/page.tsx`
  - reads `goalId` via `useSearchParams()`
  - preserves deep-linked selection when generated blocks are available
  - selected block/goal visual emphasis
  - milestone cards include explicit `focus` action
- `components/shared/CommandPalette.tsx`
  - added `Trajectory` navigation command
- `lib/command/parser.ts`
  - added `Trajectory` page aliases
  - open-page help text updated
- `components/features/onboarding/StepTrajectoryGoal.tsx`
  - clearer trajectory-first copy
  - explicit retry-friendly error messages
- `components/features/onboarding/StepTrajectoryPlan.tsx`
  - clearer capacity simulation copy
  - explicit retry-friendly error messages
- `components/features/onboarding/StepComplete.tsx`
  - trajectory-first completion wording
- `lib/analytics/events.ts`
  - added `trajectory_briefing_opened` contract

## Test Coverage Added/Updated
- `tests/unit/trajectory-morning-briefing.test.ts`
  - validates `goalId` and `startDate` behavior for nearest active goal
- `tests/unit/command-parser.test.ts`
  - validates `open trajectory` parsing
- `tests/unit/analytics-events-schema.test.ts`
  - validates `trajectory_briefing_opened` payload acceptance/rejection
- `tests/evals/analytics-event-contract.eval.test.ts`
  - includes `trajectory_briefing_opened` in eval matrix
- `tests/evals/command-intent-contract.eval.test.ts`
  - includes `open trajectory` in deterministic matrix

## Operational Notes
- Deep-link selection is intentionally deterministic:
  - if linked `goalId` exists in generated blocks, it is selected;
  - otherwise fallback remains first generated block.
- No new backend endpoint was introduced; changes are client-side orchestration + schema hardening.
