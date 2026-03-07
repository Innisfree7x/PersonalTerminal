# Phase 19 Execution Contract — Momentum + Sound

Status: Implemented  
Date: 2026-03-06  
Owner: Core agent

## Scope Lock

Phase 19 includes exactly:
1. Momentum Score in `/today`
2. Sound Phase 1 (opt-in, product cues, guarded playback)

Out of scope:
- Crisis Mode rollout
- Trajectory as default home
- Use-case SEO pages
- Adaptive estimation automation

## North-Star Metric (30 days)

`% of new users who see on_track within 10 minutes after signup`

Definition:
- Denominator: users with completed signup
- Numerator: users with `trajectory_status_shown` where payload status = `on_track` within 10 minutes of signup completion
- Exclusions: demo/internal QA accounts

## Activation Funnel (required events)

1. `trajectory_goal_created`
2. `trajectory_status_shown`

Both must happen in the same session window (<= 30 minutes) for "Aha reached".

## Phase 19 Acceptance Criteria

### A. Momentum

- `/api/trajectory/momentum` returns deterministic score (0-100), trend and delta.
- `/today` renders compact strategic rail with momentum context:
  - score
  - week-over-week delta
  - status distribution (`on_track`, `tight`, `at_risk`)
  - weekly focus load vs planned capacity
- Score increases trigger a subtle momentum sound cue (`momentum-up`) with local anti-spam guard.

### B. Sound Phase 1

- Global app sounds default to OFF for new users.
- After first completed focus session, user gets one explicit opt-in prompt.
- If user opts in:
  - sound setting enabled
  - immediate preview cue plays
- Core app cues available:
  - `task-completed`
  - `trajectory-on-track`
  - `trajectory-at-risk`
  - `momentum-up`
- Playback guardrails:
  - per-event cooldown (default: **10 seconds per product cue event**)
  - global reduced-motion respect
  - no forced autoplay outside explicit preview/opt-in actions

Cooldown scope for default 10s:
- `task-completed`
- `trajectory-on-track`
- `trajectory-at-risk`
- `momentum-up`

## Crisis Mode Policy (locked for next phase)

Trigger:
- `tight -> at_risk`, OR
- `on_track -> at_risk` only if user had stable prior status >= 24h

Cooldown:
- 7 days

Manual snooze:
- 3 days

## Command-First Safety Boundary

Not allowed via command:
- Goal delete
- Trajectory full reset
- Account delete
- Onboarding reset

Reason:
- irreversible or support-only actions require explicit UI confirmation.

## QA Gate

Required green checks:
- `npm run type-check`
- `npm run lint`
- targeted unit tests for momentum + onboarding activation flow
- no P0/P1 regressions in Today, Focus, Onboarding, Trajectory

## Ops visibility (minimum)

Ops dashboard must expose:
- users with `trajectory_goal_created` (total + 7d)
- avg time `signup -> trajectory_status_shown`
- waitlist segment distribution

Release dependency:
- Ops visibility above must go live in the same rollout as Momentum Score (no defer).

Implementation detail:
- `trajectory_status_shown` timestamp is mirrored to user metadata key `trajectory_status_shown_at` during onboarding trajectory planning for deterministic ops aggregation.
