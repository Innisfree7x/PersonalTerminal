# Phase 10 M2 — Acceptance Scenarios (Claude Track)

User-perspective validation for the three core E2E flows.
Codex uses this document to assess test coverage and write missing checks.

---

## Flow 1: Signup → Onboarding → First Task

### User Story
A first-time user discovers INNIS, creates an account, completes the 5-step onboarding wizard, and creates their first task for today — leaving the app with immediate perceived value.

### Happy Path

| Step | User Action | Expected Result |
|------|-------------|-----------------|
| 1 | Navigate to `/auth/signup` | Signup form with Name, Email, Password, Confirm Password fields, "Konto erstellen" submit button, footer with Nutzungsbedingungen link |
| 2 | Fill in valid name, email, 8+ char password | No error shown |
| 3 | Click "Konto erstellen" | Success screen appears: green checkmark, "Konto erstellt!", instruction to check email; OR immediate redirect to `/onboarding` if Supabase session returned immediately |
| 4 | Land on `/onboarding` | Progress bar shows step 1/5; StepWelcome displayed with brand copy and "Loslegen" primary button |
| 5 | Click "Loslegen" | Slides to step 2/5; StepProfile shows name input pre-filled from profile if available |
| 6 | Fill name, click "Weiter" | Slides to step 3/5; StepCourses shows course form with one empty entry |
| 7 | Fill in course name + ECTS + exercises, click "Kurs anlegen & weiter" | Course created via API; slides to step 4/5; StepFirstTask shows task input |
| 8 | Fill task title (e.g. "Übungsblatt 8"), click "Aufgabe anlegen & weiter" | Task created via API; slides to step 5/5; StepComplete shows summary |
| 9 | Step 5 visible | Summary lists the created course and task; Lucian hint visible; "Zum Dashboard" button |
| 10 | Click "Zum Dashboard" | Redirect to `/today`; `onboarding_completed` event fired; `innis_onboarding_v1` cleared from localStorage |
| 11 | `/today` page | Created task visible in today's list; welcome banner shown (first visit); no dead ends |

### UX Assertions (must pass from user POV)

- **Progress indicator**: Step counter updates correctly at every step (e.g. "2 / 5" on StepProfile).
- **Back navigation**: Back button visible on steps 2–4, hidden on steps 1 and 5.
- **Back preserves draft**: After filling course name and going back to step 2, then forward again — course name draft is still there.
- **Skip paths work**: "Später hinzufügen" on StepFirstTask advances to StepComplete without error.
- **Course skip**: StepCourses skip button ("Weiter" without filling) advances correctly.
- **Duplicate prevention**: If the user refreshes mid-wizard and returns, `localStorage['innis_onboarding_v1']` restores the correct step — no data re-entry required.
- **Already-completed guard**: A user with `onboardingCompleted: true` visiting `/onboarding` is immediately redirected to `/today`.
- **Error state on task creation failure**: If `/api/daily-tasks` returns an error, the error message is shown inline (German) and the user can retry.

### Current Test Coverage Assessment

The existing `auth-onboarding-settings.spec.mjs` only covers:
- ✅ Login → `/today` redirect
- ✅ Settings display name update

Missing from test suite:
- ❌ Full 5-step wizard completion via new account
- ❌ Task creation in onboarding (step 4)
- ❌ Course creation in onboarding (step 3)
- ❌ StepComplete → "Zum Dashboard" → `/today`
- ❌ `localStorage['innis_onboarding_v1']` cleared after completion
- ❌ Progress bar step counter
- ❌ Back navigation preserves draft state

### Auth Helper Gap (Codex action required)

The current `login()` helper in `tests/e2e/helpers/auth.mjs` handles onboarding with:
```js
const fullNameInput = page.locator('#fullName');
await fullNameInput.fill('E2E Prism User');
await page.getByRole('button', { name: /continue to dashboard/i }).click();
```
This matches the **old single-step onboarding** — the new wizard has 5 steps and a "Zum Dashboard" button (German). The helper must be updated to step through the full wizard or use a pre-onboarded test account to avoid failing all other specs.

---

## Flow 2: Add Course → Exercise Tracking

### User Story
An onboarded user adds a university course with exercise sheets and marks the first sheet as completed — seeing their progress reflected immediately on the card.

### Happy Path

| Step | User Action | Expected Result |
|------|-------------|-----------------|
| 1 | Navigate to `/university` | Course list or empty state; "+ Kurs anlegen" action available |
| 2 | Click add course (via `?action=new-course` or button) | "Neuen Kurs anlegen" modal opens with Name, ECTS, Exercise Sheets (numExercises), Semester, Exam Date fields |
| 3 | Fill valid data, click submit | Modal closes; new course card appears in list; optimistic or confirmed update |
| 4 | Click expand/detail on course card | Exercise sheet list expands: "Blatt 1", "Blatt 2", … shown |
| 5 | Click "Blatt 1" | Exercise marked complete; progress count updates (e.g. "1 / 3"); progress bar fills accordingly |
| 6 | Click "Blatt 1" again | Exercise un-marked; count reverts |
| 7 | Mark all sheets complete | Progress shows "3 / 3"; visual completion indicator |

### UX Assertions

- **Empty state**: When no courses exist, the empty state is shown with "Ersten Kurs anlegen" CTA — not a blank page.
- **Immediate feedback**: After marking an exercise, the count updates within 1 second without full page reload.
- **Progress persistence**: Reload the page — completed exercises remain marked.
- **Exam date display**: If an exam date is set, it appears on the card as "Prüfung am …" or similar.
- **Error on creation failure**: If POST `/api/courses` fails, the modal shows a German error message inline.
- **Optimistic rollback**: If exercise completion fails (network error), the optimistic update reverts and an error toast appears.
- **StudyProgress widget on `/today`**: After adding a course, the StudyProgress widget on Today shows the course and its progress.

### Current Test Coverage Assessment

`university-course.spec.mjs` covers:
- ✅ Login → create course via `?action=new-course` URL → course card visible
- ✅ Click "Blatt 1" → progress counter "1/3" visible

Missing:
- ❌ Empty state → CTA click → modal opens (user journey start, not URL param hack)
- ❌ Exercise un-marking (toggle off)
- ❌ Full sheet completion (all sheets marked)
- ❌ Progress persistence after page reload
- ❌ Optimistic rollback on API failure
- ❌ Error message on course creation failure
- ❌ StudyProgress widget on `/today` updates after course created

### Notes for Codex

- `data-testid="course-modal-submit"` — must exist on modal submit button
- `data-testid="career-column-interview"` pattern should be replicated as `data-testid="university-course-list"` or similar for stable selectors
- Exercise toggle selector is currently `card.getByText('Blatt 1').click()` — fragile; consider `data-testid="exercise-sheet-{n}"` for stability

---

## Flow 3: Add Application → Move to Interview / Offer

### User Story
An onboarded user tracks a job application, adds it to the Kanban board, and moves it through the pipeline from "Beworben" → "Gespräch" → "Angebot" to simulate realistic use.

### Happy Path

| Step | User Action | Expected Result |
|------|-------------|-----------------|
| 1 | Navigate to `/career` | Kanban board with columns: Beworben, Gespräch, Angebot, Abgelehnt |
| 2 | Click add application (via `?action=new-application` or button) | "Neue Bewerbung" modal opens with Company, Position, Link, Notes fields |
| 3 | Fill company + position, click "Erstellen" | Modal closes; new card appears in "Beworben" column |
| 4 | Drag card from "Beworben" to "Gespräch" | Card moves; success toast appears: "Verschoben: Gespräch" |
| 5 | Drag card from "Gespräch" to "Angebot" | Card moves; success toast: "Verschoben: Angebot" |
| 6 | Click delete on card | ConfirmModal opens: "Bewerbung löschen?" with company name in description |
| 7 | Click "Löschen" in modal | Card removed from board; no orphaned entries |

### UX Assertions

- **Empty state**: When no applications exist, the board shows an empty state — not blank columns.
- **Column labels in German**: "Beworben", "Gespräch", "Angebot", "Abgelehnt" — test the actual visible text.
- **Toast on move**: After drag, a success toast with the German column label is visible (not English "Applied", "Interview" etc.).
- **ConfirmModal on delete**: Native `window.confirm()` must NOT be called. ConfirmModal component must appear.
- **Delete confirmation shows name**: Modal description includes the application's company/position name.
- **Delete cancellable**: Clicking "Abbrechen" in ConfirmModal closes without deleting.
- **Per-column empty**: When a column has no cards, it shows "Noch keine Einträge hier" placeholder (dashed border).
- **Rollback on drag failure**: If PATCH `/api/applications/:id` fails, card reverts to original column and an error toast appears in German.

### Current Test Coverage Assessment

`career-kanban.spec.mjs` covers:
- ✅ Login → create application → card visible
- ✅ Drag from "Applied" column to "Interview" column (using raw bounding box drag)

Missing:
- ❌ Two-stage move (Applied → Interview → Offer)
- ❌ Toast text verification (German column label)
- ❌ Delete flow with ConfirmModal (not native `confirm()`)
- ❌ Delete cancellation (modal cancel)
- ❌ Empty state visible when no applications
- ❌ Per-column empty placeholder
- ❌ Error rollback on drag failure

### Notes for Codex

- `data-testid="career-card-{id}"` — must exist on each card for stable selectors
- `data-testid="career-column-interview"` exists — verify `career-column-offer` and `career-column-applied` exist too
- The current drag uses raw bounding box coordinates which is brittle. Consider using dnd-kit's accessible keyboard mode for more stable drag tests, or the Playwright drag API with `page.dragAndDrop()` if source/target locators are stable.

---

## Cross-Flow UX Assertions

These apply across all flows and should be checked in CI:

| Check | Description |
|-------|-------------|
| German UI language | No English user-facing strings in any modal, toast, or error message within the dashboard |
| Toast timeout | Success/error toasts disappear automatically (< 5 seconds) |
| No dead ends | Every error state has a retry path — no screens without a CTA |
| Auth guard | All `/` dashboard routes redirect to `/auth/login` when unauthenticated |
| Loading states | Submit buttons show spinner while async operations are pending |
| Mobile responsiveness | Core flows work at 390px viewport width (iPhone 14) |

---

## Recommended Test Additions (Priority Order)

1. **Update auth helper** for new 5-step onboarding wizard (`Weiter` → `Weiter` → `Weiter` → `Aufgabe anlegen & weiter` → `Zum Dashboard`) — **blocker for all other tests**
2. **Flow 1**: Add a dedicated spec `onboarding-wizard.spec.mjs` covering full wizard + skip paths
3. **Flow 3**: Add toast text assertion after drag in `career-kanban.spec.mjs`
4. **Flow 3**: Add delete + ConfirmModal scenario to `career-kanban.spec.mjs`
5. **Flow 2**: Add exercise un-toggle and reload-persistence to `university-course.spec.mjs`
6. **Cross-flow**: Add empty-state check to university and career specs (navigate to clean state before test)
