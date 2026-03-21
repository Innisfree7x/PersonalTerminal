# Phase 35 — Career Intelligence V2

Date: 2026-03-21
Status: shipped

## Goal

Harden the Career Radar from "interesting cards" into an operational decision surface:

- make CV context visible inside the radar itself
- make weak match states recoverable instead of dead ends
- turn dossier insights into an explicit action stack

## Delivered

### 1. CV Signal surfaced in Radar

Files:

- `app/api/career/opportunities/route.ts`
- `lib/schemas/opportunity-radar.schema.ts`
- `components/features/career/OpportunityRadar.tsx`

What changed:

- response meta now includes:
  - `cvTopStrengths`
  - `cvTopGaps`
  - `cvUpdatedAt`
- radar renders a dedicated `CV-Signal` block whenever a persisted CV profile is active
- users can now see:
  - current CV rank tier
  - detected strengths
  - active gaps
  - last update timestamp

Why it matters:

- fit/explainability is no longer a black box
- the user sees what the radar is actually optimizing against

### 2. Weak Match Recovery Mode

Files:

- `components/features/career/OpportunityRadar.tsx`
- `components/features/career/CareerBoard.tsx`

What changed:

- if results exist but `realistic` count is `0`, radar now shows a dedicated recovery surface
- actions available directly from the weak state:
  - switch track
  - open band
  - open CV panel

Why it matters:

- "only target/stretch left" is now an actionable state, not a confusing one
- keeps the user inside the system instead of leaving them with no next move

### 3. Dossier Action Stack

Files:

- `lib/career/opportunityDossier.ts`
- `lib/career/opportunityActions.ts`
- `components/features/career/OpportunityRadar.tsx`

What changed:

- dossier now includes a structured `Action Stack`
- each selected opportunity gets a three-step action framing depending on band:
  - `realistic`: apply now + quick refinement
  - `target`: commit gap + prep this week + rescore
  - `stretch`: protect downside + prep + review before applying
- prep planning is centralized via `buildOpportunityPrepPlan()`

Why it matters:

- dossier now answers "what do I do next?" without forcing the user to infer it

### 4. Copy hygiene in touched Career surfaces

Files:

- `lib/career/opportunityReadout.ts`
- `lib/career/opportunityRadar.ts`
- `components/features/career/OpportunityRadar.tsx`

What changed:

- visible user copy in touched files now uses proper German umlauts where applicable
- removed remaining `oe/ae/ue` style fallback strings from the shipped Career V2 layer

## Tests

Added / updated:

- `tests/unit/OpportunityRadar.test.tsx`
- `tests/unit/opportunity-dossier.test.ts`
- `tests/unit/api/career-opportunities.test.ts`

Covered:

- dossier selection flow
- CV signal rendering
- weak match recovery state
- API meta propagation for CV strengths/gaps/timestamp
- dossier action stack generation

## Verification

- `npm run test -- --run tests/unit/OpportunityRadar.test.tsx tests/unit/opportunity-dossier.test.ts tests/unit/api/career-opportunities.test.ts`
- `npm run type-check`
- `npm run lint`
- `npm run build`

## Residual risks

- radar scoring is still deterministic and heuristic-first; this is intentional for trust/stability
- no external company-level deep fetch yet; dossier still works on role-level opportunity data
- CV upload UI itself still has visual room for a future premium redesign, but functionally the bridge is now much stronger

## Next logical follow-up

1. company-level dossier enrichment
2. gap-to-trajectory presets with stronger effort defaults
3. landing-page proof section using the new dossier/readout language
