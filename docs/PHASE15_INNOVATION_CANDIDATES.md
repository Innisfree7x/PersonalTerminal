# Phase 15 Innovation Candidates (Draft)

Status: Proposal (not active until approved)  
Date: 2026-03-01  
Owner: Core Agent

## Objective

Define high-leverage product innovations that improve retention and perceived product quality without repeating high-risk big-bang UI rewrites.

## Selection Rules

- Keep reliability and release gates green while shipping UX improvements.
- Prefer incremental rollouts with fast rollback.
- Every feature needs a measurable success metric and kill criterion.

## Candidate Stack (prioritized)

## I1 — Adaptive Focus Surface (P0)

What:
- Focus screen adapts visual intensity by session state:
  - idle: calmer
  - running: deeper contrast + subtle motion
  - break: warmer palette
- Quote cadence tied to session milestones instead of fixed fast intervals.

Why:
- Increases "open and stay" behavior during learning sessions.

Success metric:
- Focus session completion rate +10%.
- Median session duration +8%.

Kill criterion:
- If completion drops or users disable focus visuals >35%, rollback adaptive layer.

Owner split:
- Core: state model + timing logic
- UI: visual variants + reduced-motion mapping
- QA: visual regression + timing assertions

## I2 — Reliability Control Tower (P0)

What:
- Dedicated ops panel in analytics:
  - burn-rate trends
  - cron health timeline
  - dependency circuit status
- Admin actions: acknowledge/resolve/mute incidents.

Why:
- Makes ops failures actionable instead of hidden in logs.

Success metric:
- MTTA < 10 minutes for critical incidents.
- 0 silent incident windows.

Kill criterion:
- If panel adds noise without operational usage, reduce to read-only digest.

Owner split:
- Core: data contracts + APIs + auth/RLS
- UI: timeline/heatmap components
- QA: role-based access + incident workflow tests

## I3 — Command Confidence Layer (P1)

What:
- Confidence score + dry-run card before high-impact command execution.
- Undo queue for safe creates.

Why:
- Improves trust in command-first workflows.

Success metric:
- Duplicate command incidents = 0.
- Undo adoption without data regressions.

Kill criterion:
- If undo causes integrity bugs, keep confirm-only mode.

Owner split:
- Core: intent safety, idempotency, audit trail
- UI: confidence UX and undo affordances
- QA: integration specs around duplicate + undo

## I4 — `/today` Micro-Density Controls (P1)

What:
- Per-widget density mode (`comfortable`, `compact`) instead of layout replacement.
- Store preference per user.

Why:
- Solves screen-utilization pain without fragile structural rewrites.

Success metric:
- Reduced manual scrolling on 1366x768.
- No drop in task completion.

Kill criterion:
- If compact mode hurts readability in QA snapshots, keep comfortable-only.

Owner split:
- Core: preference persistence
- UI: density token application per widget
- QA: breakpoint matrix screenshots

## I5 — Lucian Silent Coach 2.1 (P1)

What:
- Lucian optional by default style profile:
  - silent cues
  - speech bubbles only on explicit interaction or high-signal events

Why:
- Preserves character uniqueness while avoiding notification fatigue.

Success metric:
- Lucian enabled retention cohort with neutral/positive completion delta.

Kill criterion:
- If dismiss rate rises and completion drops, tighten trigger frequency.

Owner split:
- Core: trigger policy and cooldown model
- UI: cue animations and speech bubble interaction design
- QA: trigger-throttle and persistence tests

## Recommended shipping order

1. I2 Reliability Control Tower  
2. I1 Adaptive Focus Surface  
3. I3 Command Confidence Layer  
4. I4 `/today` Micro-Density  
5. I5 Lucian Silent Coach 2.1

## Non-goals for Phase 15

- No full `/today` bento replacement.
- No AI-only feature without deterministic fallback.
- No new release gate while blocker E2E is red.

