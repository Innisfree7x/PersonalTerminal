# CLAUDE.md - Project Context

## Project Overview
**INNIS** is a personal productivity system built with Next.js 14 (App Router), TypeScript, Supabase, and TanStack React Query. It combines university tracking, goals, career pipeline management, daily tasks, focus sessions, and Google Calendar integration.

## Canonical Context (must-read)
- Active planning source: `docs/PHASE12_MASTERPLAN.md`
- Active execution source: `docs/PHASE12_EXECUTION_BLUEPRINT.md`
- Context priority map: `docs/CONTEXT_CANON.md`
- Reliability implementation baseline: `docs/PHASE11_TRACK6_IMPLEMENTATION.md`

Important:
- Documents marked as historical/archived in `docs/CONTEXT_CANON.md` are non-normative.
- If a historical phase doc conflicts with active planning docs, always follow Phase 12 + Context Canon.
- Execution decisions must not be derived from archived phase docs unless explicitly requested for legacy analysis.
- Before planning or implementation work, read `docs/CONTEXT_CANON.md` first.

## Current App Structure
- `app/(marketing)` contains landing + public pages (`/`, `/features`, `/pricing`, `/about`, `/privacy`, `/terms`).
- `app/(dashboard)` contains authenticated product routes.
- `app/auth` contains login/signup pages.
- `app/onboarding` is the onboarding gate for authenticated users.
- `app/actions` contains server actions used by dashboard features.
- `app/api` contains API routes (user, admin, monitoring, cron, analytics ingress).

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript strict (`exactOptionalPropertyTypes: true`)
- **Data/Auth:** Supabase PostgreSQL + Supabase Auth (`@supabase/ssr`)
- **State/Fetching:** TanStack React Query v5
- **Validation:** Zod
- **Forms:** React Hook Form
- **UI/Styling:** Tailwind CSS, Radix UI, Framer Motion, Lucide, cmdk
- **Charts/Analytics:** Recharts, `@vercel/analytics`, `@vercel/speed-insights`

## Auth and Access Control

### Middleware
`middleware.ts` enforces:
- auth redirects for protected dashboard routes
- onboarding gate (`/onboarding`) until `user_metadata.onboarding_completed === true`
- authenticated users are redirected away from `/auth/*`
- admin-only gate for `/analytics/ops`

### API Protection Modes
- **User APIs:** mostly protected via `requireApiAuth()` (`lib/api/auth.ts`)
- **Admin APIs:** use `requireApiAdmin()` (e.g. monitoring health/incidents, debug)
- **Non-user-ingress APIs:** selected endpoints intentionally do not use `requireApiAuth()`:
  - `/api/analytics/event` (validated analytics ingestion, user optional)
  - `/api/monitoring/error` (client error intake with ingress throttling)
  - `/api/ops/flow-metrics` (login flow metric ingestion)
  - `/api/cron/*` (protected via `requireCronAuth()` bearer secret)

### Supabase Clients
- Request-scoped auth client: `createClient()` in `lib/auth/server.ts` (default for APIs/server logic).
- Service-role admin client: `createAdminClient()` in `lib/auth/admin.ts` (cron/admin/ops jobs).
- Avoid `lib/supabase/client.ts` in API routes because it is not request-cookie scoped.

## Data and Rendering Patterns
- Client pattern: `Page -> lib/api/*.ts -> /api/* -> lib/supabase/*.ts -> Supabase`.
- Server-action pattern: `Page/Component -> app/actions/*.ts -> data/auth layer`.
- Rendering is hybrid:
  - Most dashboard pages are client-heavy (`useQuery`/`useMutation`).
  - Some pages are server components (e.g. `app/(dashboard)/career/page.tsx`, `app/(dashboard)/analytics/ops/page.tsx`) and pass initial data to client components.

## Provider Trees

### Root (`app/layout.tsx`)
`AuthProvider -> ThemeProvider -> SoundProvider -> QueryProvider -> FocusTimerProvider -> LucianBubbleProvider -> CommandPaletteProvider`, plus `ToastProvider`, `PerformanceMonitor`, Vercel Analytics, and Speed Insights.

### Dashboard (`app/(dashboard)/layout.tsx`)
`SidebarProvider -> PowerHotkeysProvider -> ChampionProvider` around the dashboard shell (Sidebar, Header, animated page container, FloatingTimer).

## Key Routes
| Route | Purpose |
|------|---------|
| `/` | Marketing landing (redirects authenticated users to onboarding/today) |
| `/onboarding` | Mandatory first-time setup |
| `/today` | Command center (tasks, next best action, calendar context, stats) |
| `/calendar` | Weekly calendar |
| `/goals` | Goal tracking |
| `/university` | Courses + exercise progress |
| `/career` | Job application board |
| `/analytics` | Focus analytics |
| `/analytics/ops` | Admin operations health page |
| `/settings` | Themes, sounds, hotkeys, profile/preferences |

## Database Model (from `lib/supabase/types.ts`)
Tables currently typed:
- `goals`
- `job_applications`
- `courses`
- `exercise_progress`
- `daily_tasks`
- `focus_sessions`
- `admin_audit_logs`
- `ops_flow_metrics`
- `events` (legacy typed table; not used by current app flows)

### RLS Summary
Migration docs indicate owner-based isolation is expected:
- `docs/migrations/2026-02-15_user-isolation.sql` adds `user_id` and owner-only policies for core product tables.
- `docs/migrations/2026-02-16_admin_audit_logs.sql` adds admin-only read/insert policies.
- `docs/migrations/2026-02-24_ops_flow_metrics.sql` adds controlled insert/read policies for flow metrics.

## Key Files
| Path | Purpose |
|------|---------|
| `lib/auth/server.ts` | Request-scoped Supabase auth client + auth helpers |
| `lib/auth/admin.ts` | Service-role Supabase admin client |
| `lib/api/auth.ts` | API auth helpers (`requireApiAuth`, `requireApiAdmin`) |
| `lib/supabase/types.ts` | Supabase table typings |
| `middleware.ts` | Route protection + onboarding/admin gating |
| `app/layout.tsx` | Global providers + metadata |
| `app/(dashboard)/layout.tsx` | Dashboard shell/providers + floating timer |
| `lib/application/use-cases/execution-engine.ts` | Next Best Action ranking + execution score |
| `components/providers/ChampionProvider.tsx` | VFX gamification layer — Q/W/E/R ability effects, sprite HUD, Pentakill |
| `components/features/lucian/LucianBubble.tsx` | Contextual companion UI — Character-Card layout, mood-mapped sprite, walk-entry animation |
| `lib/lucian/copy.ts` | Lucian companion message library (5 moods, 80+ lines) |
| `lib/command/parser.ts` | Deterministic grammar parser for Command Palette intents (4 intents: task, goal, focus, page) |

## Commands
```bash
npm run dev                   # Dev server
npm run build                 # Production build
npm run type-check            # TypeScript check
npm run lint                  # ESLint
npm run test                  # Vitest
npm run test:e2e:blocker      # Critical Playwright blocker suite
npm run test:e2e              # Full Playwright suite
```

## Conventions
- Supabase DB columns are `snake_case`; app models are `camelCase`.
- Date-only fields are commonly stored as `YYYY-MM-DD`; timestamps are ISO strings.
- Conversion helpers live in `lib/supabase/*.ts` (`supabaseXToX`, `xToSupabaseInsert`).
- TS strict mode is enforced; avoid passing explicit `undefined` where optional properties are omitted.
- Pre-commit: Husky + lint-staged (`eslint --fix`, `prettier --write`).
- Team communication convention: German conversation, English code/content.
