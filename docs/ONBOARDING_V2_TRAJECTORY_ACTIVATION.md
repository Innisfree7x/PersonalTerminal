# Onboarding V2: Trajectory Activation Contract

## Goal
Replace the current onboarding middle steps with a trajectory-first activation flow so a new user gets an `on track / tight / at risk` result in under 3 minutes.

This is the primary activation workstream for the next phase.

## Scope

### Keep As-Is
- `StepWelcome`
- `StepProfile`
- `OnboardingLayout`
- Transition system (`AnimatePresence`, slide transitions)
- `TOTAL_STEPS = 5`
- Local storage resume key: `innis_onboarding_v1`

### Replace
Current step sequence:
- `Welcome -> Profile -> Courses -> FirstTask -> Complete`

New step sequence:
- `Welcome -> Profile -> TrajectoryGoal -> TrajectoryPlan -> Complete`

`Courses` and `FirstTask` are removed from onboarding. Users handle those later in `/university` and `/today`.

## New Step Specs

### Step 3: `StepTrajectoryGoal` (new)
- Prompt: "What is your next big goal?"
- Inputs:
  - `title`
  - `category` (`thesis | gmat | master_app | internship | other`)
  - `dueDate`
  - effort input with unit toggle (`hours` or `months`)
  - buffer input with unit toggle (`weeks` or `months`)
  - `priority` (1-5)
- Live preview text:
  - effort conversion preview (months -> hours based on current capacity)
  - buffer conversion preview (months -> weeks)
- Submit behavior:
  - `POST /api/trajectory/goals`
  - Persist `goalId` + normalized goal payload in onboarding state

### Step 4: `StepTrajectoryPlan` (new)
- Prompt: "How many hours per week can you realistically invest?"
- Inputs:
  - hours/week slider (5..60)
  - horizon months (from existing trajectory settings contract)
- Submit behavior:
  - Update settings via `PATCH /api/trajectory/settings` (or current route method if contract differs)
  - Recompute via `POST /api/trajectory/plan`
- Output UI in-step:
  - Inline status badge: `on track | tight | at risk`
  - Concrete date line (example: "Prep starts Nov 09, 2026")
  - One-sentence explanation from plan summary

### Step 5: `StepComplete` (adjusted)
- Show trajectory status block prominently at top
- Primary CTA: `Open Trajectory`
- Secondary CTA: `Go to Today`
- Onboarding completion only after trajectory goal + settings write succeeded

## Data and API Contract

## Required API Calls
1. Create goal
   - `POST /api/trajectory/goals`
2. Save capacity/settings
   - `PATCH /api/trajectory/settings` (or route-supported update method)
3. Compute simulated plan
   - `POST /api/trajectory/plan`

## State to Persist in Onboarding Store
- `trajectory.goalId`
- `trajectory.goalDraft`
- `trajectory.settingsDraft`
- `trajectory.planSummary` (status + start date + key metrics)

## Guardrails (must-have)
1. Resume migration:
   - Old local onboarding payload (`courses`, `firstTask`) must not crash
   - Unknown legacy fields are ignored safely
2. Idempotency:
   - Disable submit while pending
   - Prevent duplicate goal create on double click
3. Error handling:
   - Step-level error UI + retry action
   - No "completed" state on partial success
4. API method alignment:
   - Use real methods from current route implementations
5. Deterministic plan:
   - `trajectory/plan` remains compute-focused, not hidden persistence
6. Analytics alignment:
   - Add/emit trajectory-specific onboarding events (below)

## Analytics Events
- `onboarding_started` (existing)
- `onboarding_step_completed` (existing)
- `trajectory_goal_created` (new)
- `trajectory_capacity_set` (new)
- `trajectory_status_shown` (new)
- `onboarding_completed` (existing, payload updated with trajectory fields)

## Demo Seed Alignment
Update demo onboarding path so quick demo also yields trajectory status:
- Add `DEMO_TRAJECTORY_GOAL`
- Add demo trajectory settings
- Ensure demo flow can compute and display non-empty risk status

## Non-Goals (for this workstream)
- No new AI features
- No collaboration/multi-user features
- No broad redesign of `/trajectory` page
- No university/career CRUD changes in onboarding

## Acceptance Criteria
1. New user can complete onboarding with:
   - one trajectory goal
   - one capacity setting
   - visible computed status
2. `StepComplete` shows the computed status and links to `/trajectory`
3. Legacy onboarding local storage does not break resume
4. No duplicate trajectory goals on repeated clicks
5. CI green:
   - `type-check`
   - `lint`
   - targeted unit tests for conversion/status flow

## Parallel Execution Model (No Day-Based Planning)
- Track A (Core): state contract + API integration + migration guardrails
- Track B (UI): `StepTrajectoryGoal`, `StepTrajectoryPlan`, `StepComplete` status UI
- Track C (QA): resume migration tests, duplicate-create prevention, full onboarding flow validation
- Core merges last after contract compliance + CI pass.

## Merge Gate
Do not merge if any of these are unresolved:
- onboarding completion without trajectory status
- duplicate goal creation on double submit
- old onboarding local data causing crash
- red CI

## Implementation Status (2026-03-04)
- UI onboarding step swap implemented (`StepTrajectoryGoal`, `StepTrajectoryPlan`, updated `StepComplete`): done
- Demo seed trajectory integration: done
- Completion gate + duplicate-submit guard tests: done
- Legacy resume migration tests: done
- Today morning briefing bridge (`/today` <- trajectory signal): done
- Analytics event schema alignment for trajectory onboarding events: done
- Monitoring optional Sentry import hardened (no dynamic dependency build warning): done
- Marketing/Features pages aligned to trajectory-first product narrative: done
- Remaining follow-up: ensure authenticated blocker E2E env always yields executed (non-skipped) runs
