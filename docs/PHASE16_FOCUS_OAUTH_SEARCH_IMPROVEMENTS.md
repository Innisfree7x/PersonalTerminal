# PHASE 16 — Focus Themes + OAuth Reliability + Search Hardening

Status: Implemented (local verification complete)
Date: 2026-03-03
Mode: Core-led execution with UI/QA support

## Goal
Deliver a polished and reliable iteration for three user-critical areas:
1. Focus screen premium customization (high-end background themes + overlays).
2. Google Calendar OAuth reliability fix (`redirect_uri_mismatch`).
3. Stable, deterministic search/command interaction with no regression.

## Problem Statement
Recent regressions and UX gaps show three issues:
- Focus screen is visually strong but not configurable enough (theme/overlay selection missing, quote layout consistency issues).
- Google OAuth callback setup is brittle in production if redirect URI resolution diverges from provider config.
- Command palette/search had state control conflicts and needs explicit regression coverage.

## Scope
### In Scope
- Focus screen:
  - Background theme presets ("Revolut-style" premium dark gradients).
  - Overlay presets (subtle texture/light bands/vignette variants).
  - Persist user choice locally.
  - Improve quote + author centering and vertical rhythm.
- OAuth:
  - Normalize redirect URI resolution for `/api/auth/google` and callback route.
  - Prefer explicit configured origin when present, with strict callback path enforcement.
  - Improve diagnostics when configured URI mismatches runtime assumptions.
- Search:
  - Keep cmdk interaction deterministic (single source of truth for query input).
  - Add regression notes/checks to prevent controlled/uncontrolled reintroduction.
- Documentation + audit:
  - Update phase docs and run a local quality audit (`type-check`, `lint`, targeted tests).

### Out of Scope
- Full auth provider redesign.
- Net-new backend persistence for Focus visual settings.
- Calendar feature expansion beyond OAuth fix.

## Deliverables
1. Focus visual system update in `components/features/focus/FocusScreen.tsx` (and related style utilities if needed).
2. OAuth reliability patch in:
   - `app/api/auth/google/route.ts`
   - `app/api/auth/google/callback/route.ts`
3. Search hardening validation in:
   - `components/shared/CommandPalette.tsx`
   - related tests/docs if needed.
4. Phase audit doc with final status and validation evidence.
   - Completed in `docs/PHASE16_AUDIT_2026-03-03.md`

## Implementation Plan
1. Baseline + verify current behavior
   - Confirm current command palette fix remains active.
   - Reproduce OAuth redirect selection path from code and env assumptions.
2. Focus UX implementation
   - Add `themePreset` and `overlayPreset` controls.
   - Define 4-6 premium presets (dark metal, blue steel, bronze, obsidian, etc.).
   - Persist via localStorage key (namespaced for focus screen).
   - Refine quote container alignment so quote and author remain visually centered across viewport sizes.
3. OAuth implementation
   - Canonicalize redirect URI to exact callback path.
   - Ensure both auth start + callback token exchange use same resolved URI.
   - Add guardrails for malformed env values (clear server logs / error response).
4. Audit + documentation
   - Run `npm run type-check`.
   - Run `npm run lint`.
   - Run targeted tests if modified paths have tests.
   - Document results and residual risks.

## Acceptance Criteria
- Focus screen:
  - User can select theme + overlay without reload.
  - Selection persists across refresh.
  - Quote block appears centered and balanced on desktop and tablet widths.
- OAuth:
  - Google connect flow does not fail with `redirect_uri_mismatch` when Google Console + env are correctly configured.
  - Redirect URI logic is deterministic and path-stable (`/api/auth/google/callback`).
- Search:
  - Typing in search consistently filters commands/results with no frozen input or dual-control glitch.
- Quality:
  - `type-check` green.
  - `lint` green.
  - No new P0/P1 regressions in touched areas.

## Risks and Mitigations
- Risk: Production env drift (Google Console URI vs runtime env).
  - Mitigation: strict canonical redirect resolution + explicit operator checklist.
- Risk: Visual over-design hurts readability.
  - Mitigation: keep overlays subtle by default and contrast-test quote block.
- Risk: Local persistence collisions.
  - Mitigation: namespaced storage keys + safe parsing fallback.

## Operator Checklist (Post-merge)
1. Verify Google OAuth authorized redirect URI includes exactly:
   - `https://<your-domain>/api/auth/google/callback`
2. Verify deployment env values:
   - `NEXT_PUBLIC_SITE_URL` (canonical app URL used by redirect resolver)
   - `GOOGLE_REDIRECT_URI` (if explicitly configured)
3. Smoke test:
   - `/focus` theme + overlay selection persist.
   - Search bar in header opens and filters reliably.
   - Connect Google Calendar completes roundtrip.

## Execution Notes
- Core executes sequentially to reduce integration risk:
  1) OAuth reliability
  2) Focus themes/overlays
  3) Search validation and regression safeguards
  4) Audit + docs finalization

## Implementation Status
- OAuth canonical redirect resolver: ✅
- Focus theme/overlay selector with persistence: ✅
- Focus selector UI upgraded to custom preset buttons (native select removed): ✅
- Storage key migrated from legacy `prism:*` to `innis:*` with backward-read compatibility: ✅
- Quote + author centering refinement: ✅
- Search stability regression check: ✅
- OAuth resolver tests expanded (configured/site/cookie/request/fallback): ✅
- Local quality gates (`type-check`, `lint`, targeted vitest, build): ✅
