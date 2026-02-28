# PHASE 13 — Focus + Lucian + Density (Gate-Driven)

Status: Active (execution in progress)  
Date: 2026-02-28  
Mode: Multi-agent (Core + UI + QA)

## Goal
Ship a stable, premium Focus/Lucian experience with measurable performance and release-safe QA gates.

## Current Snapshot (2026-02-28)

## Delivered so far
- Focus flicker hardening and calmer background motion in `components/features/focus/FocusScreen.tsx`.
- Focus Lucian toggle (`Lucian an/aus`) live in `components/features/focus/FocusScreen.tsx`.
- Custom duration support available in both:
  - `components/features/focus/FocusScreen.tsx`
  - `components/features/dashboard/PomodoroTimer.tsx`
- Lucian sprite/ability baseline improved:
  - rebuilt sprite sheet (`public/sprites/lucian-sprites.svg`)
  - frame guard + animation row transition safety in `components/providers/ChampionProvider.tsx`
- Dashboard study progress ordering by nearest exam date in `components/features/dashboard/StudyProgress.tsx`.
- Career board compact behavior for larger lists in `components/features/career/CareerBoard.tsx`.

## Gate status
- Gate 1 (13.1 Focus UX Stability): In progress (major fixes shipped, final performance baseline + visual signoff pending)
- Gate 2 (13.2 Lucian VFX 2.0): In progress
- Gate 2a (stability): In progress (flicker/disappear mitigations shipped, regression verification still required)
- Gate 2b (preset system): Not started
- Gate 3 (13.3 Dashboard Density & Control): In progress (partially shipped)
- Gate 4 (13.4 QA + Observability + Release): Not started (blocked by Gate 2 + 3 completion)

## Execution Model (Sequenced Gates)
Gate 1 must pass before Gate 2 starts.  
Gate 2 and Gate 3 may run in parallel after Gate 1.  
Gate 4 is final release gate after Gate 2 and Gate 3.

1. Gate 1 — Focus UX Stability (13.1)  
2. Gate 2 — Lucian VFX 2.0 (13.2)  
3. Gate 3 — Dashboard Density & Control (13.3)  
4. Gate 4 — QA + Observability + Release (13.4)

---

## 13.1 Focus UX Stability (Blocker Gate)
Owner: Core  
Support: UI, QA

### Scope
- Remove visible flicker/jitter artifacts in `FocusScreen`.
- Stabilize animation system for desktop + iPad layouts.
- Keep full functionality (timer, custom duration, lucian toggle, controls).

### Baseline (mandatory before fixes)
- Performance profile on `/focus`:
  - Chrome DevTools Performance recording (20s idle + 20s interaction).
  - FPS chart + long tasks capture.
- Lighthouse run for `/focus` (desktop profile).
- Minimal runtime counters (optional):
  - Quote transitions count.
  - Background animation repaint spikes.

### Acceptance Criteria
- No visible black flicker during idle focus screen.
- No animation-induced layout shift in controls area.
- Smoothness target:
  - No recurring long-task spikes caused by focus background animation.
  - Stable rendering under normal interaction.
- `type-check`, `lint`, `vitest` green.
- Controls include:
  - custom duration input
  - Lucian on/off toggle

### Blockers
- None (start here first).

---

## 13.2 Lucian VFX 2.0
Owner: Core (state), UI (visual layers)  
Support: QA

### 13.2a Stability First (required)
Scope:
- Fix all transition/state issues (including disappear/blank-frame bugs).
- Ensure spell/sprite/sound timing cannot desync or hide sprite.

Acceptance Criteria:
- No temporary sprite disappearance on Q/W/E/R casts.
- Ability transition graph deterministic under repeated casts.
- Regression tests pass.

### 13.2b Preset System (separate PR after 13.2a)
Scope:
- Introduce configurable VFX presets (quality tiers / stylistic variants).
- Keep state logic untouched where possible.

Acceptance Criteria:
- Presets switch without gameplay/state regressions.
- Clear fallback preset for low-performance mode.
- CI + visual checks green.

### Blockers
- Gate 1 must be green.
- `vfxConfig` contract must be published by Core before UI preset layering.

---

## 13.3 Dashboard Density & Control
Owner: UI  
Support: Core, QA

### Scope
- Career board compact mode for high item counts (e.g. >4 applications).
- Clarify and refine top command rail only for documented remaining issues.
- Keep focus/pomodoro controls visually compact without reducing capability.

### Command Rail Clarification (required before coding)
- Explicitly list unresolved issue(s), e.g.:
  - overlap at specific breakpoints
  - information hierarchy mismatch
  - discoverability issue
- No redesign without concrete problem statement.

### Acceptance Criteria
- Compact mode toggle and/or auto mode works without losing critical info.
- Command rail issue list resolved with before/after screenshots.
- No overlap regressions on target breakpoints.

### Blockers
- Gate 1 must be green.

---

## 13.4 QA + Observability + Release Gate
Owner: QA  
Support: Core

### Tooling Decisions (fixed now)
- Visual regression: Playwright screenshot snapshots.
- Baseline source: pinned baseline commit/tag before Gate 2/3 changes.
- Compare routes:
  - `/today`
  - `/focus`
  - `/settings`

### E2E Release Blockers
- Focus flow:
  - start/pause/resume/stop
  - custom duration input
  - lucian toggle on focus screen
- Lucian flow:
  - spell trigger stability
  - no disappear regression
- Settings flow:
  - theme + accent changes persist as expected

### Observability Events (minimum)
- `focus_screen_open`
- `focus_custom_duration_used`
- `lucian_toggle_changed`
- `lucian_spell_cast`

### Acceptance Criteria
- Release blocker E2E green.
- Visual baseline diff approved.
- CI fully green.
- No open P0/P1 issues.
- Final GO/NO-GO written in QA handoff doc.

### Blockers
- Gate 2 and Gate 3 completed.

---

## Agent Boundaries (to avoid merge conflicts)
Core files:
- `components/providers/ChampionProvider.tsx`
- state/logic contracts and event model

UI files:
- pure visual components and VFX presentation layers
- no direct state-model redesign without Core contract

QA files:
- `tests/e2e/**`
- regression snapshots
- release gate reports

Contract rule:
- Core publishes `vfxConfig` interface first.
- UI consumes `vfxConfig`; UI does not alter state transition logic.

---

## PR Strategy
1. PR-A: 13.1 stability baseline + fixes  
2. PR-B: 13.2a lucian stability  
3. PR-C: 13.3 dashboard density  
4. PR-D: 13.2b presets (after B)  
5. PR-E: 13.4 QA/observability/release

Each PR must include:
- scope
- before/after evidence
- risk note
- rollback note

---

## Definition of Done (Phase 13)
- Gate 1, 2, 3, 4 all green.
- CI green on main.
- No lucian disappear bug.
- Focus screen visually stable.
- Docs updated with final outcomes and no stale contradictory guidance.
