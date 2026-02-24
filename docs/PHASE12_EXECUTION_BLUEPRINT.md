# Phase 12 Execution Blueprint (Tracks 3/4/5/6)

Stand: 2026-02-24
Status: Active companion doc (execution-level)
Owner: Engineering (Codex + Claude)
Canonical parent: `docs/PHASE12_MASTERPLAN.md`

## 1) Purpose

This document turns Phase 12 goals into concrete shipping order with measurable bets.
Priority stays strict:
1. Track 6 (Reliability + Ops)
2. Track 4 (Command OS safety)
3. Track 5 (Weekly Review quality)
4. Track 3 (Lucian retention layer)

## 2) Current baseline (already shipped)

- Track 6 base is live:
  - flow metrics table + SLO snapshot + blocker E2E flake gate
- Track 4 v1 is live:
  - deterministic parser + intent preview + executor foundation
- Track 5 v1 is live:
  - rule-based weekly review summary + recommendation baseline
- Track 3 visual baseline is live:
  - Lucian sprite integration and richer bubble UI path

## 3) Phase-12 outcome targets

By end of Phase 12:
- p95 `today_load` < 1500ms (currently gate is 2000ms)
- p95 `create_task` < 600ms
- blocker E2E flake <= 2%
- onboarding completion >= 60%
- first-value completion >= 50%
- P1 incident count per week = 0

## 4) High-impact ideas (prioritized)

## Idea A - Reliability Control Tower (Track 6, P0)
What:
- add burn-rate alert jobs for critical flows
- add weekly SLO digest (ops page + optional mail/slack webhook)
- add "degradation mode" behavior for slow dependencies

Why now:
- all other work depends on trust and predictable latency

Success metric:
- alert MTTA < 10 min
- 0 silent failures in critical flows

Kill criterion:
- if alert noise > 25% false positives after 2 weeks, tune or rollback rules

## Idea B - Command OS v2 Safety Layer (Track 4, P0)
What:
- idempotency keys for execute-intents
- confirm-gated risky intents
- undo for `create_task`, `create_goal` with 30s window
- execution audit trail (`intent_execute_logs`)

Why now:
- command layer only scales if users trust it under repetition and mistakes

Success metric:
- duplicate action incidents = 0
- undo usage without regressions

Kill criterion:
- if undo creates data consistency bugs, keep confirm-only and disable undo temporarily

## Idea C - Weekly Review v2: Evidence-first (Track 5, P0/P1)
What:
- split review into:
  - data evidence cards (deterministic)
  - recommendations (deterministic + optional AI rephrase)
- add "adopt recommendation" tracking
- add non-generic templates by user situation class

Why now:
- current v1 is useful but not yet sticky enough for weekly habit

Success metric:
- weekly review open rate week-over-week up
- recommendation adoption event rate >= 25%

Kill criterion:
- if AI layer raises cost/noise without lift, keep deterministic mode only

## Idea D - Lucian Retention Layer (Track 3, P1 with guardrails)
What:
- speech bubble anchored above Lucian as default visual language
- mood-reactive copy + cooldown discipline
- break invite (short playable micro-loop, 45-60s max, opt-out available)

Why now:
- delight improves retention only if it remains short, contextual, and optional

Success metric:
- D7 retention lift in users with Lucian enabled
- no increase in task-completion drop during hints

Kill criterion:
- if hint dismiss rate is high and completion drops, tighten frequency and simplify copy

## 5) 30/60/90 shipping sequence

## Day 0-30 (Stability)
- ship burn-rate alerts + reliability runbooks
- ship command idempotency and confirm-gates
- add release blocker dashboard row for flake trend

Exit gate:
- Gate A from masterplan is fully green

## Day 31-60 (Action quality)
- ship undo for safe intents
- ship weekly review evidence cards + adoption telemetry
- wire KPI review ritual and owner list

Exit gate:
- Gate B from masterplan is fully green

## Day 61-90 (Retention polish)
- ship Lucian speech-bubble-first companion shell refinements
- ship controlled break invite v1 (A/B off-by-default then on)
- ship personalization rules for next-best-action tie-breakers

Exit gate:
- reliability unchanged, retention lift visible, no blocker regressions

## 6) Engineering split (duo-safe)

Codex owns:
- Track 6 alerts, runbooks, SLO gates, DB migrations, tests
- Track 4 executor guards, idempotency, undo backend, integration tests
- Track 5 telemetry and deterministic aggregation correctness

Claude owns:
- Track 4 command UX clarity states (preview, confirm, undo feedback)
- Track 5 review presentation and copy quality
- Track 3 Lucian interaction language, speech-bubble visual polish

Shared rule:
- no parallel edits on same file
- merge reliability/API first, then UX layer

## 7) Risk register (practical)

- Risk: feature creep in Lucian
  - Mitigation: timebox sessions, keep optional, enforce cooldowns
- Risk: alert fatigue
  - Mitigation: tune thresholds weekly, add severity tiers
- Risk: command trust break from accidental execution
  - Mitigation: idempotency + confirm + undo trio before broad rollout
- Risk: metrics without decisions
  - Mitigation: weekly KPI review with named owner and action log

## 8) Immediate next tasks (ready to execute)

1. Add `intent_execute_logs` migration and repository helpers.
2. Add idempotent execution guard in command executor.
3. Add burn-rate computation endpoint and ops widget.
4. Add weekly review adoption event contract and tracker.
5. Add Lucian hint frequency cap test coverage (unit + e2e smoke).

## 9) Definition of done (Phase 12)

Phase 12 is done only if:
- all P0 targets met for 2 consecutive weeks
- blocker E2E remains green with flake <= 2%
- KPI review ritual is running (not just documented)
- no active critical reliability debt
