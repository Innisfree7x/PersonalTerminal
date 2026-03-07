# PHASE20 Architecture + UX Retention Hardening (2026-03-07)

Status: Implemented  
Scope: Low-risk hardening of storage architecture, daily completion UX, and weekly rhythm pull.

## Why
- Storage keys were fragmented (`prism:*` + `innis:*`) and hard to migrate/clean.
- Next Best Action dismissals were session-only (reappeared after tab close).
- `/today` had no explicit completion moment when all tasks were done.
- Companion had no structured morning check-in trigger.
- Weekly planning cadence was implicit, not explicit.
- `events` table type in `lib/supabase/types.ts` was dead in app usage.

## Implemented
1. Central storage key registry and legacy migration
- Introduced canonical key registry in `lib/storage/keys.ts`.
- Added `readStorageValueWithLegacy(...)` helper for one-time key migration.
- Migrated active providers/hooks to canonical `innis:*` keys with legacy fallback:
  - `components/providers/ThemeProvider.tsx`
  - `components/providers/FocusTimerProvider.tsx`
  - `components/providers/ChampionProvider.tsx`
  - `components/providers/PowerHotkeysProvider.tsx`
  - `lib/hooks/useCommandActions.ts`
  - `components/features/focus/FocusScreen.tsx`

2. Persistent NBA dismissals (local, not session)
- Added shared helper `lib/dashboard/nbaDismissals.ts`.
- Switched dismissal persistence to `localStorage` with day-scoped map and bounded history retention.
- Updated both implementations:
  - `components/features/dashboard/CommandBar.tsx`
  - `components/features/dashboard/NextBestActionWidget.tsx`

3. Done-for-today moment (EOD micro-celebration)
- Added all-done transition effect in `CommandBar`:
  - one trigger per day
  - toast feedback
  - sound cue (`task-completed`)
  - champion event dispatch `DONE_FOR_TODAY`

4. Lucian/Champion event extensions
- Extended event contract in `lib/champion/championEvents.ts`:
  - `DONE_FOR_TODAY`
  - `MORNING_CHECKIN`
- Added Lucian message mapping for both events in `components/providers/LucianBubbleProvider.tsx`.
- Added Champion reaction + XP mapping for `DONE_FOR_TODAY` in `components/providers/ChampionProvider.tsx`.

5. Weekly rhythm pull + progressive disclosure in `/today`
- Added weekly check-in strip in morning briefing card with:
  - `Review now` deep-link to `/trajectory?source=weekly_checkin`
  - `Later` snooze
  - week-level persistence (`innis:today:weekly-checkin-week-key:v1`)
- Added lightweight progressive disclosure for momentum details:
  - first-visit users see compact momentum signal
  - advanced risk/load pills shown after welcome phase
- Added daily morning companion check-in dispatch (once/day) after trajectory overview is fetched.

6. Dead type cleanup
- Removed unused `events` table typings from `lib/supabase/types.ts`.

## Verification
- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run build` ✅
- Added tests:
  - `tests/unit/storage-keys.test.ts` ✅
  - `tests/unit/nba-dismissals.test.ts` ✅

## Residual risks / next
- Command/event bus names still use `prism:*` for compatibility (`prism:champion-event`, `prism:command-action`, etc.). Not a blocker; can be migrated in a dedicated compatibility pass.
- `lib/supabase/types.ts` is manually edited in this pass; if regenerated from schema later, ensure `events` is either reintroduced intentionally or excluded by policy.
