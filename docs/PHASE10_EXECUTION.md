# PHASE 10: Launch Readiness Execution

## Objective
Make INNIS launch-ready with a strict focus on activation, reliability, and measurable product outcomes.

## Scope (This Phase)
- Reliability and QA release gates
- Product funnel instrumentation (after event audit)
- Final launch consistency pass and release decision
- Optional monetization prep explicitly out of scope unless requested

## Out Of Scope (for now)
- Full Stripe billing rollout
- Deep performance rabbit holes without measured bottlenecks
- New large feature modules unrelated to launch readiness

---

## Launch Scorecard Targets
1. Core E2E journeys pass in CI: `100%`
2. Onboarding completion rate: `>= 60%`
3. First-value completion rate (first task + first course): `>= 50%`
4. No open Auth/RLS critical findings
5. Release checklist: fully green before production deploy

Note:
- Scorecard targets `#2` and `#3` require M3 event data. Therefore M3 is a hard prerequisite before final Go/No-Go.

---

## Milestones

### M1 - Activation Hardening
Status: `Completed baseline in Phase 9`

Definition:
- New user reaches first value in under 3 minutes.
- Empty states provide one explicit next action.

Deliverables:
- Onboarding copy and steps tuned for speed.
- Empty states on Today/University/Career/Goals aligned and actionable.
- Lucian guidance appears only contextually (not noisy).

Owner split:
- Claude: UX copy, onboarding flow polish, empty-state wording/layout.
- Codex: logic guards, state transitions, edge-case handling, test stabilization.

DoD:
- Manual run: fresh signup -> onboarding -> task+course created in one session.
- No dead-end screens in core modules.
- Remaining in Phase 10: only bugfixes/regressions if discovered.

### M2 - Reliability and QA Gate
Status: `Primary execution target`

Definition:
- Core user paths are protected by automated checks.

Deliverables:
- Stable CI for lint/typecheck/tests.
- E2E coverage for:
  - Signup -> Onboarding -> First Task
  - Add Course -> Exercise Tracking
  - Add Application -> Move to Interview/Offer
- Production smoke checklist documented and used.

Owner split:
- Codex: test harness, flake fixes, CI gate enforcement.
- Claude: acceptance scenario review from user perspective.

DoD:
- Core E2E suite green on PR and merge.
- No flaky test retriggers required for green.

### M3 - Metrics Loop
Status: `Primary execution target`

Definition:
- We can measure funnel conversion, not guess it.

Deliverables:
- Event audit first (avoid duplicate events already wired in landing/onboarding).
- Event instrumentation (only missing or inconsistent events):
  - landing_cta_clicked
  - signup_started
  - signup_completed
  - onboarding_completed
  - first_task_created
  - first_course_created
  - day2_return
- Basic dashboard/report query for weekly review.

Owner split:
- Codex: event schema, tracking wiring, event quality guardrails.
- Claude: naming consistency and product-language validation.

DoD:
- Events visible in analytics with clean payloads.
- Weekly conversion numbers computable without manual log scraping.

### M4 - Narrative Alignment
Status: `Completed baseline in Phase 9`

Definition:
- What landing promises is exactly what onboarding and dashboard deliver.

Deliverables:
- Copy alignment pass across marketing + auth + onboarding + first dashboard state.
- Lucian positioning: supporting execution layer, not gimmick.

Owner split:
- Claude: copy system and messaging consistency.
- Codex: implementation integrity and regression checks.

DoD:
- No message contradiction between public pages and in-app flow.
- First session reflects promised value proposition.
- Remaining in Phase 10: only final QA pass and minor copy fixes.

---

## Remaining Execution Plan (Day 3-5)

### Day 3
- Implement M2 tests and CI reliability hardening.
- Resolve flakes and stabilize fixtures.

### Day 4
- Run event audit, then implement only missing M3 instrumentation.
- Produce first funnel baseline report.

### Day 5
- Run final M4 consistency QA pass (no full rewrite).
- Run release checklist and Go/No-Go decision (only after M3 metrics are available).

---

## Work Split: Codex vs Claude

## Codex Track (Engineering)
- Data and state correctness
- CI/E2E reliability
- Event instrumentation
- Release gates and production check procedures

## Claude Track (Product UX)
- Acceptance-scenario review (user-perspective validation)
- Naming/copy consistency review for tracked events
- Final launch copy QA pass and minor wording fixes only

## Merge Protocol
1. Claude opens UX/content PRs.
2. Codex reviews for technical coherence and integration risk.
3. Codex finalizes guards/tests and merges when release gates pass.

---

## Risks and Mitigations
1. Scope creep from new ideas
- Mitigation: no new module work before M1-M4 completion.

2. Flaky CI reduces shipping speed
- Mitigation: quarantine flaky tests until deterministic; then re-enable.

3. Strong visuals but weak activation
- Mitigation: prioritize first-value conversion metrics over additional polish.

4. Lucian overexposure
- Mitigation: strictly contextual triggers and low-frequency prompting.

---

## Go/No-Go Checklist
- Core E2E paths green in CI
- Onboarding completion >= 60%
- First-value conversion >= 50%
- No critical Auth/RLS findings
- Release checklist fully green

Prerequisite:
- M3 must be completed first, otherwise conversion targets are not measurable.

If any one is red, launch is delayed and scoped fixes are applied first.
