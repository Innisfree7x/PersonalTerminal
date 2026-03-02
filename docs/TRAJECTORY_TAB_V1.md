# Trajectory Tab V1 — Design Contract

Status: Proposed (implementation-ready)
Date: 2026-03-02
Owner: Core (orchestration)
Parent: `docs/PHASE12_MASTERPLAN.md`

## 1) Goal

Ship a new dashboard tab (`/trajectory`) that answers one strategic question:

"Am I still on track for my career timeline (Bachelor thesis, GMAT, master applications, internships)?"

The tab must turn high-level goals into realistic time blocks and highlight timeline risk early.

## 2) Product Principles

1. Deterministic, explainable planning (no opaque AI decisions in V1).
2. Timeline first, task conversion second.
3. Risk visibility before deadline panic.
4. Small, stable V1 scope with high daily utility.

## 3) Fixed V1 Decisions

1. `trajectory_alerts` are **computed on read**, not persisted.
2. Capacity model:
   - One persisted baseline value (`hours_per_week`) per user.
   - One temporary simulation slider in UI (`what-if`), not persisted unless user clicks save.
3. Calendar interaction:
   - V1 does **not** require Google Calendar write integration.
   - "Block in Calendar" creates internal trajectory blocks and optional daily-task package.
4. Planning horizon: `now -> +24 months`.
5. Risk logic is deterministic and threshold-based.

## 4) User Stories

1. As a student, I can set major milestones (thesis, GMAT, master deadlines).
2. As a user, I can see generated prep windows backward from deadlines.
3. As a user, I can simulate lower/higher weekly capacity and instantly see risk changes.
4. As a user, I can detect block collisions and act on them.
5. As a user, I can convert a planned block into executable tasks.

## 5) V1 Scope

In:

1. New tab `/trajectory` with timeline + risk panel + quick actions.
2. Milestone CRUD (career/university categories).
3. Manual opportunity windows CRUD (internship cycles, application windows).
4. Deterministic backward planning engine.
5. Computed risk status per goal (`on_track`, `tight`, `at_risk`).
6. Conversion actions:
   - Create internal trajectory block(s)
   - Optional task package in `daily_tasks`

Out:

1. LLM planning or black-box prioritization.
2. Automatic scraping/import of internship windows.
3. Push notifications.
4. Full Google Calendar write/sync.

## 6) IA / UI Structure

Top Bar:

1. `Horizon: 24 months`
2. `Baseline capacity: X h/week` (persisted)
3. `Simulation slider: Y h/week` (temporary)
4. `Save as baseline` action

Main Layout:

1. Left: timeline lanes
   - Goals lane (hard deadlines)
   - Prep blocks lane (generated/planned)
   - Opportunity windows lane (manual)
2. Right: risk panel
   - At-risk goals
   - Collision list
   - Suggested next actions
3. Bottom: action rail
   - `Generate plan`
   - `Create task package`
   - `Commit simulation`

## 7) Data Model (V1)

### 7.1 `trajectory_settings` (persisted)

- `id` uuid pk
- `user_id` uuid not null references auth.users(id)
- `hours_per_week` integer not null check (`hours_per_week between 1 and 60`)
- `horizon_months` integer not null default 24 check (`horizon_months between 6 and 36`)
- `created_at`, `updated_at`

### 7.2 `trajectory_goals` (persisted)

- `id` uuid pk
- `user_id` uuid not null references auth.users(id)
- `title` text not null
- `category` text not null check (`category in ('thesis','gmat','master_app','internship','other')`)
- `due_date` date not null
- `effort_hours` integer not null check (`effort_hours >= 1`)
- `buffer_weeks` integer not null default 2 check (`buffer_weeks between 0 and 16`)
- `priority` integer not null default 3 check (`priority between 1 and 5`)
- `status` text not null default 'active' check (`status in ('active','done','archived')`)
- `created_at`, `updated_at`

### 7.3 `trajectory_windows` (persisted)

- `id` uuid pk
- `user_id` uuid not null references auth.users(id)
- `title` text not null
- `window_type` text not null check (`window_type in ('internship','master_cycle','exam_period','other')`)
- `start_date` date not null
- `end_date` date not null check (`end_date >= start_date`)
- `confidence` text not null default 'medium' check (`confidence in ('low','medium','high')`)
- `notes` text null
- `created_at`, `updated_at`

### 7.4 `trajectory_blocks` (persisted)

- `id` uuid pk
- `user_id` uuid not null references auth.users(id)
- `goal_id` uuid not null references `trajectory_goals(id)` on delete cascade
- `title` text not null
- `start_date` date not null
- `end_date` date not null check (`end_date >= start_date`)
- `weekly_hours` integer not null check (`weekly_hours between 1 and 60`)
- `status` text not null default 'planned' check (`status in ('planned','in_progress','done','skipped')`)
- `source` text not null default 'trajectory_v1'
- `created_at`, `updated_at`

RLS:

- Owner-only read/write on all 4 tables.

## 8) Computation Model

### 8.1 Backward Planning

For each active goal:

1. `capacity = simulation_hours_per_week || baseline_hours_per_week`
2. `required_weeks = ceil(effort_hours / capacity)`
3. `block_end = due_date - buffer_weeks`
4. `block_start = block_end - required_weeks`

### 8.2 Collision Model

Given overlapping planned blocks:

1. `overlap_hours` computed by overlapping date range * min(capacity per week assumptions)
2. `overlap_ratio = overlap_hours / planned_block_hours`

### 8.3 Risk Thresholds (DoD-critical)

For each goal:

1. If `block_start < today` => `at_risk`
2. Else if `overlap_ratio >= 0.50` => `at_risk`
3. Else if `overlap_ratio >= 0.25` => `tight`
4. Else => `on_track`

The thresholds are fixed in V1 and must not be silently changed in UI.

### 8.4 Computed Alerts (no persistence)

`trajectory_alerts` response object is computed on demand from:

1. Active goals
2. Planned/generated blocks
3. Opportunity windows
4. Current effective capacity (baseline or simulation)

## 9) Conversion Behavior

"Create task package" from a selected block:

1. Create N `daily_tasks` entries across block range using deterministic spacing.
2. Naming format:
   - `[Trajectory] <Goal title> - Step <k>/<n>`
3. Add metadata in `description` with `trajectory_goal_id` and block date range.

"Block in Calendar" in V1:

1. Creates/updates `trajectory_blocks` only.
2. Optional: also create one summary `daily_task` for block start date.
3. No Google event write is required for V1.

## 10) API Surface (V1)

1. `GET /api/trajectory/overview`
   - returns settings, goals, windows, blocks, computed alerts, risk summary
2. `POST /api/trajectory/goals`
3. `PATCH /api/trajectory/goals/[id]`
4. `POST /api/trajectory/windows`
5. `PATCH /api/trajectory/windows/[id]`
6. `POST /api/trajectory/plan`
   - input: optional simulation capacity
   - output: generated plan + computed alerts (no persistence side effects)
7. `POST /api/trajectory/blocks/commit`
   - persists generated blocks
8. `POST /api/trajectory/tasks/package`
   - converts a block into daily tasks

## 11) Events / Telemetry

1. `trajectory_goal_created`
2. `trajectory_plan_generated`
3. `trajectory_simulation_changed`
4. `trajectory_block_committed`
5. `trajectory_task_package_created`
6. `trajectory_risk_status_changed`

Required properties:

- `goal_id`
- `old_status`, `new_status` (when applicable)
- `capacity_hours`
- `overlap_ratio`
- `horizon_months`

## 12) QA + Acceptance (Release-Blocking for this feature)

Unit:

1. Backward planning formula correctness.
2. Risk threshold boundaries (`0.24`, `0.25`, `0.49`, `0.50`).
3. `block_start < today` always `at_risk`.

Integration/API:

1. Owner isolation via RLS.
2. Plan generation with and without simulation value.
3. Task package creation idempotency guard (no duplicate batch on retry).

E2E:

1. Create goal -> generate plan -> commit block -> create task package.
2. Lower simulation capacity -> status changes to `tight/at_risk`.
3. Verify new tasks appear in `/today`.

## 13) Rollout Strategy

1. Feature flag: `trajectory_tab_v1` (default off in production).
2. Internal dogfood first.
3. Enable for beta users.
4. Full rollout after one stable week (no P0/P1 regressions).

## 14) Agent Split

Core Agent:

1. Data model, APIs, planning/risk engine, RLS.

UI Agent:

1. `/trajectory` page UI, timeline visualization, simulation slider, action rail.

QA Agent:

1. Unit/integration/e2e coverage + release audit entry.

## 15) Definition of Done

1. `/trajectory` tab is navigable and stable on desktop + tablet.
2. Goals and windows are persisted with owner-only access.
3. Planning output is deterministic for same inputs.
4. Risk statuses follow fixed V1 thresholds.
5. Task package conversion creates visible tasks in `/today`.
6. CI green (`Quality Checks` + `E2E Blocker Suite`) on release commit.
