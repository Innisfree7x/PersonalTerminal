# Phase 46 — KIT Fixes and Landing Audit
Date: 2026-03-30
Status: completed

## Scope
- Fix KIT CAMPUS academic export fallback for headerless `contractview.asp` pages.
- Add single-delete flow for individual ILIAS favorites.
- Review current landing-page changes from parallel agents and harden the highest-value shared logic.
- Close audit blockers by extending tests and restoring full `type-check` health.

## Implemented

### 1. KIT CAMPUS fallback hardening
Files:
- `lib/kit-sync/campusAcademicExport.ts`
- `public/connectors/kit-campus-academic-exporter.js`
- `tests/unit/kit-campus-academic-export.test.ts`

Changes:
- Added standalone-grade detection so aggregate LP cells such as `101,0` / `180,0` no longer get misclassified as grades.
- Preferred trailing LP columns when parsing headerless rows.
- Kept fallback merge deduped by stable external IDs.
- Added regression test for headerless `contractview.asp` extraction.

Outcome:
- Headerless KIT pages now extract grades/modules more reliably.
- Aggregate rows no longer pollute the academic snapshot.

### 2. ILIAS favorite single delete
Files:
- `app/api/kit/ilias-favorites/[id]/route.ts`
- `components/features/university/KitSyncPanel.tsx`
- `lib/kit-sync/service.ts`
- `lib/kit-sync/types.ts`
- `lib/schemas/kit-sync.schema.ts`
- `tests/unit/api/kit-ilias-favorites-delete.test.ts`
- `tests/unit/api/kit-status.test.ts`

Changes:
- Added user-scoped DELETE route for individual ILIAS favorites.
- Added per-row remove action in `KitSyncPanel` instead of forcing full reset.
- Extended preview payloads with stable favorite `id` values.
- Deleting a favorite also clears dependent synced ILIAS items.

Outcome:
- Users can now remove a single favorite without resetting the entire ILIAS sync state.

### 3. Landing audit + shared proof logic
Files:
- `components/features/marketing/InteractiveDemo.tsx`
- `components/features/marketing/HeroProofTeaser.tsx`
- `components/features/marketing/ProductShowcase.tsx`
- `components/features/marketing/MarketingNavbar.tsx`
- `components/features/marketing/trajectoryProof.ts`
- `tests/unit/marketing-trajectory-proof.test.ts`

Changes:
- Extracted shared trajectory-proof helpers for date formatting, insight text, and status tone.
- Marked interactive landing surfaces explicitly with `data-landing-interactive="true"` so scroll-hijack logic does not swallow slider interaction.
- Reused the proof helper logic across the new trajectory proof surfaces to reduce drift.
- Aligned mobile navbar CTA styling with the desktop premium hierarchy.
- Added dedicated unit tests for the shared trajectory proof helpers.

Review findings
- Good direction: the cinematic landing has a much stronger visual thesis and better feature sequencing than the older static page.
- Fixed issue: interaction surfaces were at risk of conflicting with section-scroll capture.
- Fixed issue: proof copy/date/status logic had started to drift across multiple hero/demo surfaces.
- Remaining recommendation: keep all trajectory-proof phrasing centralized in `trajectoryProof.ts`; do not fork it again inside future showcase variants.

### 4. Lucian type compatibility hardening
Files:
- `lib/lucian/copy.ts`
- `components/features/lucian/LucianBubble.tsx`

Changes:
- Added normalized mood aliases so legacy mood names (`motivate`, `celebrate`, `warning`, `recovery`, `idle`) map cleanly to Lucian V2 mood cores.
- Normalized bubble rendering lookups to the canonical V2 mood before styling/animation access.

Outcome:
- `type-check` is green again without backing out Lucian V2 copy changes.
- Old call sites remain compatible while the V2 mood system stays canonical.

## Checks
Executed:
- `npm run test -- --run tests/unit/api/kit-ilias-favorites-delete.test.ts tests/unit/api/kit-status.test.ts tests/unit/kit-campus-academic-export.test.ts tests/unit/marketing-trajectory-proof.test.ts`
- `npm run test -- --run tests/unit/lucian-sprite-animator.test.tsx tests/unit/marketing-trajectory-proof.test.ts`
- `npm run lint`
- `npm run type-check`

Result:
- all above checks passed

## Notes for future agents
- Do not add more KIT export heuristics without adding a fixture-driven regression test.
- Do not couple landing proof text/date/status behavior to per-component local helpers again.
- Lucian currently supports both legacy aliases and V2 canonical moods; prefer canonical moods in all new code.
