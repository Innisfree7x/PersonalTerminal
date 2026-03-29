# CLAUDE.md - Project Context

## Project Overview
**INNIS** — personal productivity system. Next.js 14 (App Router), TypeScript strict, Supabase, React Query v5, Tailwind, Framer Motion.

<important>
## Quality Standards — Non-Negotiable
- **Kein Blind-Merge bei UI-Änderungen.** Vor jedem Commit mit visuellen Änderungen: im Browser prüfen oder Screenshot anfordern.
- **Ein Widget nach dem anderen.** Bauen → prüfen → committen → nächstes.
- **Schlechtes Ergebnis = Rollback, kein Patch.** Revert und neu machen, nicht mit Patches kaschieren.
- **A-Game immer.** Wenn etwas nicht gut genug ist: sagen und neu machen.
- **Fehler direkt eingestehen.** Klar benennen, Ursache verstehen, besser machen.
</important>

## Canonical Context
- Active planning:
  - `docs/CONTEXT_CANON.md`
  - `docs/PHASE44_KIT_CONNECTORS_AND_TODAY_FUSION_2026-03-29.md`
  - `docs/PHASE42_KIT_SYNC_CONNECTOR_EXECUTION_CONTRACT_2026-03-29.md`
  - `docs/PHASE43_KIT_ILIAS_DASHBOARD_CONNECTOR_2026-03-29.md`
  - `docs/PHASE41_MEASURED_PERFORMANCE_PASS_2026-03-28.md`
  - `docs/PHASE40_PERFORMANCE_AND_CI_STABILIZATION_2026-03-27.md`
- Context priority map: `docs/CONTEXT_CANON.md` (read first before planning)
- Documents marked historical in Context Canon are non-normative.

## App Structure
- `app/(marketing)` — landing + public pages (`/`, `/features`, `/pricing`, `/about`, `/privacy`, `/terms`)
- `app/(dashboard)` — authenticated product routes
- `app/auth` — login/signup
- `app/onboarding` — 4-step trajectory-first onboarding gate
- `app/actions` — server actions | `app/api` — API routes

## Tech Stack
Next.js 14 (App Router) · TypeScript strict (`exactOptionalPropertyTypes: true`) · Supabase (PostgreSQL + Auth via `@supabase/ssr`) · React Query v5 · Zod · React Hook Form · Tailwind CSS · Radix UI · Framer Motion · Lucide · cmdk · Recharts · Vercel Analytics

<important>
## Auth — Critical Rules
- **API Protection**: `requireApiAuth()` from `lib/api/auth.ts` for user APIs, `requireApiAdmin()` for admin, `requireCronAuth()` for cron
- **Server Client**: `createClient()` from `lib/auth/server.ts` — request-scoped, per-function, NEVER singleton
- **Never** use `lib/supabase/client.ts` in API routes (no request cookies → RLS failure)
- **Admin Client**: `createAdminClient()` from `lib/auth/admin.ts` (cron/admin/ops only)
</important>

## Middleware (`middleware.ts`)
Auth redirects · onboarding gate (`user_metadata.onboarding_completed`) · redirect authenticated from `/auth/*` · admin gate for `/analytics/ops`

## Data Patterns
- Client: `Page → lib/api/*.ts → /api/* → lib/supabase/*.ts → Supabase`
- Server Actions: `Page/Component → app/actions/*.ts → data/auth layer`
- Hybrid rendering: most dashboard = client-heavy (`useQuery`), some server components pass initial data

## Provider Trees
**Root**: AuthProvider → ThemeProvider → SoundProvider → QueryProvider → FocusTimerProvider → LucianBubbleProvider → CommandPaletteProvider + ToastProvider + PerformanceMonitor
**Dashboard**: SidebarProvider → PowerHotkeysProvider → ChampionProvider

## Key Routes
`/` landing · `/onboarding` setup · `/today` command center · `/calendar` weekly · `/goals` tracking · `/university` courses · `/career` applications · `/analytics` focus · `/analytics/ops` admin health · `/settings` preferences

## Database Tables
`goals` · `job_applications` · `courses` · `exercise_progress` · `daily_tasks` · `focus_sessions` · `admin_audit_logs` · `ops_flow_metrics` · `kit_sync_profiles` · `kit_sync_runs` · `kit_campus_events` · `kit_campus_modules` · `kit_campus_grades` · `kit_ilias_favorites` · `kit_ilias_items` · `events` (legacy, unused)
RLS: owner-based isolation via `user_id` columns + owner-only policies.

## KIT Sync
- Wave 1: CAMPUS WebCal (`/api/kit/webcal`, `/api/kit/status`, `/api/kit/sync`, Cron-Import)
- Wave 2: CAMPUS Academic Snapshot (`campus_connector` für Module, Noten, Prüfungen)
- Wave 3: ILIAS Snapshot (`ilias_connector` für Favoriten + Items)
- Lokaler CAMPUS Academic Exporter: `public/connectors/kit-campus-academic-exporter.js`
- Lokaler ILIAS-Dashboard-Exporter: `public/connectors/kit-ilias-dashboard-exporter.js`
- Lokaler ILIAS-Kursseiten-Exporter: `public/connectors/kit-ilias-course-items-exporter.js`
- Manueller JSON-Import läuft über `components/features/university/KitSyncPanel.tsx`
- `/today` zieht KIT-Signale jetzt direkt aus `kit_*` Tabellen in das Morning Briefing

## Commands
```bash
npm run dev              # Dev server
npm run build            # Production build
npm run type-check       # TypeScript check
npm run lint             # ESLint
npm run test:unit        # Unit tests (pre-commit)
npm run test:e2e:blocker # Critical Playwright suite
```

## Conventions
- DB columns `snake_case`, app models `camelCase`, conversion helpers in `lib/supabase/*.ts`
- Dates: `YYYY-MM-DD`, timestamps: ISO strings
- Pre-commit: Husky + lint-staged (eslint --fix, prettier --write)
- German conversation, English code/content

## Git Workflow
Feature branches only · `main` protected (Quality Checks + E2E Blocker) · Vercel Preview = Staging

---

<important>
## Architecture Principles
**Layer Ownership** — each layer has one job:
- UI (`components/`, pages) → how things look
- API Routes (`app/api/`) → validate + respond
- Logic (`lib/`) → business rules, calculations
- Data (`lib/supabase/`) → DB queries only

**Single Source of Truth** — if logic exists in two places, one is wrong.
**Feature Isolation** — secondary features must have own loading/error state, never block core page.

**Before building anything new**, answer:
1. Where does data live? (DB / localStorage / URL)
2. Who can access? (RLS / requireApiAuth)
3. What breaks if this fails? (isolated or blocking?)
4. TypeScript contract first, implementation second.
5. Which layer owns this logic?
</important>
