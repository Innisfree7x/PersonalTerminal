# PR: High-End Roadmap (Scope 1,2,3,4,5,6,9)

## Title

`feat: complete high-end roadmap (excluding AI/predictive/storybook)`

## Base / Head

- Base: `main`
- Head: `feature/auth-setup`

## Summary

This PR completes the agreed high-end roadmap scope:

- 1. Server Actions + typed mutations
- 2. Optimistic UI improvements
- 3. Clean Architecture extension (ports/use-cases/repositories)
- 4. Layout identity transitions
- 5. Sound design integration
- 6. Command Bar V2 actions
- 9. E2E coverage for critical flows

Excluded by decision:

- 7. Prism AI / RAG
- 8. Predictive Productivity
- 10. Storybook

## Major Changes

- Migrated key write flows to Server Actions (daily tasks, focus sessions, notes, calendar disconnect).
- Added onboarding gate (`/onboarding`) with middleware/auth callback/login routing.
- Added persistent profile updates in settings (`user_metadata.full_name`).
- Upgraded command palette to action-first workflow (new goal/course/application, theme cycle, focus presets).
- Added course card-to-modal `layoutId` morph transitions.
- Improved optimistic UX in dashboard task interactions.
- Extended clean architecture to `career` and `daily-tasks` with:
  - `lib/application/ports/*`
  - `lib/application/use-cases/*`
  - `lib/infrastructure/supabase/repositories/*`
- Added performance monitor provider (Web Vitals + navigation timing capture).
- Added/updated docs:
  - release checklist
  - go-live runbook
  - setup/features/architecture/e2e docs refresh

## Validation

- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run test -- --run` ✅ (71/71)
- `npm run test:e2e`
  - spec coverage added for auth/onboarding/settings
  - full execution depends on environment credentials/network

## E2E Added

- `tests/e2e/auth-onboarding-settings.spec.mjs`
  - login with onboarding fallback
  - settings display-name persistence

## Risks / Notes

- Existing API routes remain for read paths and integrations where pragmatic.
- Release should follow:
  - `docs/RELEASE_CHECKLIST.md`
  - `docs/GO_LIVE_RUNBOOK.md`

## Suggested Review Focus

- Middleware redirect behavior (auth/onboarding interplay)
- Server Action boundaries and auth guarantees
- Clean architecture consistency for newly refactored modules
- Command bar UX and action routing reliability
