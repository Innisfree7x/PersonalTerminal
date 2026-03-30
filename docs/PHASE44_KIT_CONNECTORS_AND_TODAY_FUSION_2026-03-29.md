# Phase 44 — KIT Connectors and Today Fusion

Date: 2026-03-29
Status: Implemented

## Scope
This wave moves KIT integration from basic sync plumbing to real product value:
- local CAMPUS Academic exporter for modules, grades, and exams
- local ILIAS course-items exporter for documents, announcements, folders, and links per favorite course
- compact import flows in the KIT Hub management area
- KIT signals fused into `/today` Morning Briefing

## Delivered

### 1. CAMPUS Academic local exporter
Files:
- `public/connectors/kit-campus-academic-exporter.js`
- `lib/kit-sync/campusAcademicExport.ts`

Behavior:
- runs locally inside authenticated CAMPUS pages
- accumulates data via local browser storage across multiple runs
- supports the practical three-page flow:
  - `Studienaufbau`
  - `Notenspiegel`
  - `Prüfungen`
- exports one JSON snapshot for `campus_connector`
- heuristics separate modules, grades, and exams without treating status tables as grades or grades as exams

### 2. ILIAS course-items local exporter
Files:
- `public/connectors/kit-ilias-course-items-exporter.js`
- `lib/kit-sync/iliasCourseExport.ts`

Behavior:
- runs locally inside a favorited ILIAS course page
- accumulates per-course exports via local browser storage across multiple runs
- extracts:
  - favorite course metadata
  - documents
  - announcements
  - folders
  - links
- exports one JSON snapshot for `ilias_connector`

### 3. KIT Hub management surface
Files:
- `components/features/university/KitSyncPanel.tsx`

Behavior:
- management area now split into four compact source cards:
  - `CAMPUS Kalender`
  - `CAMPUS Academic Snapshot`
  - `ILIAS Favoriten`
  - `ILIAS Kurs-Items`
- each card supports:
  - copy script
  - open script
  - JSON file import
  - optional manual JSON paste
- product-facing top area remains focused on student-relevant signals, not connector mechanics

### 4. Today fusion
Files:
- `lib/dashboard/queries.ts`
- `app/(dashboard)/today/page.tsx`

Behavior:
- `/api/dashboard/next-tasks` now includes `kitSignals`
- Morning Briefing can surface:
  - next KIT event
  - weekly KIT event load when the next event is not enough context
  - next KIT exam
  - latest campus grade
  - fresh ILIAS items
  - latest ILIAS item context
- links route directly to:
  - `/calendar`
  - `/university`

## Test Coverage
New or updated:
- `tests/unit/kit-campus-academic-export.test.ts`
- `tests/unit/kit-ilias-course-export.test.ts`
- `tests/unit/dashboard-queries.test.ts`
- `tests/integration/today-critical-path.test.tsx`

## Verification
- `npm run lint` ✅
- `npm run type-check` ✅
- `npm run test:unit` ✅
- `npm run build` ✅

## Product Impact
Before this wave, KIT sync was mainly visible as infrastructure.
After this wave:
- KIT data can be pulled from more real source pages
- ILIAS goes beyond favorites into course-level signal extraction
- Today starts reflecting KIT activity directly
- the management area remains secondary while the main University surface stays product-first

## Still Missing
- true CAMPUS connector automation without repeated manual page execution
- deeper ILIAS item quality tuning per real course layouts
- richer ILIAS read-state and summary quality beyond the implemented acknowledge loop
- stronger KIT-specific cards in weekly review beyond the compact Morning Briefing signals
- document binary import into INNIS storage
