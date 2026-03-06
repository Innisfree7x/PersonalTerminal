# Phase 18 — Activation / Conversion Waves

Date: 2026-03-06  
Status: Implemented (Wave A-C), audited, ready for rollout

## Goal
Increase first-session clarity and activation speed while closing the strategic-to-daily loop:
- Landing must explain value in <10s.
- New signup must capture user intent segment.
- Trajectory risk must convert to executable daily actions in one click.
- `/today` must expose a clear top-priority set, not only raw widgets.

## Implemented Waves

### Wave A — Shared Risk Model + Interactive Hero Proof
- Added shared risk model utility: `lib/trajectory/risk-model.ts`
  - `computeTrajectoryPrepWindow(...)`
  - `evaluateTrajectoryRisk(...)`
  - `simulateTrajectoryGoalPreview(...)`
  - `formatTrajectoryRiskLabel(...)`
- Refactored planner to consume shared model:
  - `lib/trajectory/planner.ts`
- Added interactive hero simulator:
  - `components/features/marketing/HeroSection.tsx`
  - Live inputs: hours/week + effort hours
  - Live output: status + prep start + required weeks
  - Analytics event on first interaction: `hero_simulated`

### Wave B — Risk-to-Action Bridge
- Added direct bridge in Risk Console:
  - `app/(dashboard)/trajectory/page.tsx`
  - Each alert now has `In Today übernehmen`
  - Creates idempotent task package from the alert goal
  - Optional auto-navigation to `/today?source=trajectory_risk_bridge`

### Wave C — Today Priorities + Marketing Clarity + Signup Segment
- Added “Heute kritisch: Top 3 Moves” block:
  - `app/(dashboard)/today/page.tsx`
  - Deduped top execution candidates from next-best-action result
- Added marketing before/after strip:
  - `components/features/marketing/ProblemStrip.tsx`
- Added waitlist/signup segment capture:
  - `app/auth/signup/page.tsx`
  - `lib/auth/client.ts` (`waitlist_segment` in auth metadata)
  - Analytics event: `waitlist_segment_selected`

## Analytics Contract Updates
- Updated event whitelist + payload validation:
  - `lib/analytics/events.ts`
  - New events:
    - `hero_simulated`
    - `waitlist_segment_selected`
- Marketing tracker type updates:
  - `lib/analytics/marketing.ts`

## Tests Added / Updated
- New unit tests:
  - `tests/unit/trajectory-risk-model.test.ts`
- Existing contract tests still green:
  - `tests/unit/analytics-events-schema.test.ts`
  - `tests/unit/api/analytics-event-route.test.ts`
  - `tests/evals/analytics-event-contract.eval.test.ts`

## Verification Run (executed)
- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run build` ✅
- `npm run test -- --run tests/unit/trajectory-risk-model.test.ts tests/unit/trajectory-planner.test.ts tests/unit/google-oauth-redirect.test.ts` ✅
- `npm run test -- --run tests/unit/analytics-events-schema.test.ts tests/unit/api/analytics-event-route.test.ts tests/evals/analytics-event-contract.eval.test.ts` ✅
- `npm run test -- --run tests/unit/onboarding-v2-flow.test.tsx tests/unit/trajectory-onboarding-submit-guard.test.tsx tests/unit/step-complete-gate.test.tsx tests/unit/trajectory-morning-briefing.test.ts` ✅

## Known Risks / Follow-ups
1. Landing simulator currently models single-goal risk without multi-goal overlap context (intentional for speed/clarity).
2. Today Top-3 block is read-only; no inline execute buttons yet (can be added in a safe follow-up).
3. Segment data is captured at signup; no dashboard segmentation analytics view yet.

## Agent Handoff Rules
1. Any risk-threshold change must update both:
   - `lib/trajectory/risk-model.ts`
   - `tests/unit/trajectory-risk-model.test.ts`
2. New analytics event names require:
   - `lib/analytics/events.ts` whitelist + schema
   - a contract test update (`tests/unit/analytics-events-schema.test.ts`)
3. Do not duplicate risk logic in UI components. UI must call shared model utilities.
