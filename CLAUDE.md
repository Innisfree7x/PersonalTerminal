# CLAUDE.md - Project Context

## Project Overview
**INNIS** is a personal productivity system built with Next.js 14 (App Router), TypeScript, Supabase, and TanStack React Query. It combines university tracking, goals, career pipeline management, daily tasks, focus sessions, and Google Calendar integration.

## Quality Standards — Non-Negotiable

Diese Regeln gelten immer. Keine Ausnahmen.

### Visual Work
- **Kein Blind-Merge bei UI-Änderungen.** Vor jedem Commit mit visuellen Änderungen: selbst im Browser prüfen oder Screenshot anfordern.
- **Ein Widget nach dem anderen.** Nie mehrere Komponenten gleichzeitig umbauen und dann blind committen. Reihenfolge: bauen → prüfen → committen → nächstes.
- **Kein UI-Agent ohne Review-Gate.** Wenn ein Agent visuelle Arbeit macht, wird das Ergebnis vor dem Merge explizit gesehen und abgenickt — nie automatisch durchgemerged.
- **Schlechtes Ergebnis = Rollback, kein Patch.** Wenn etwas schlecht aussieht, wird es reverted und neu gemacht — nicht mit weiteren Patches kaschiert.
- **Design Docs sind kein Ersatz für Augenkontrolle.** Ein guter Plan garantiert kein gutes Ergebnis. Immer selbst schauen.

### Allgemein
- **A-Game immer.** Kein "das geht so durch". Wenn etwas nicht gut genug ist, sagen und neu machen — nicht shippen.
- **Planqualität ≠ Ausführungsqualität.** Beide müssen stimmen. Plan approven heißt nicht Ergebnis approven.
- **Fehler direkt eingestehen.** Kein Kleinreden. Wenn etwas falsch gelaufen ist: klar benennen, Ursache verstehen, besser machen.

---

## Canonical Context (must-read)
- Active planning + execution source: `docs/PHASE13.md`
- Context priority map: `docs/CONTEXT_CANON.md`
- Career intelligence current state: `docs/PHASE38_CAREER_INTELLIGENCE_V3_2026-03-22.md`
- Critical path integration baseline: `docs/PHASE37_CRITICAL_PATH_INTEGRATION_2026-03-21.md`
- Quality hardening baseline: `docs/PHASE36_QUALITY_HARDENING_2026-03-21.md`
- Career intelligence previous state: `docs/PHASE35_CAREER_INTELLIGENCE_V2_2026-03-21.md`
- Reliability implementation baseline: `docs/PHASE11_TRACK6_IMPLEMENTATION.md`
- Phase 12 (completed): `docs/PHASE12_MASTERPLAN.md` — non-normative, historical reference only

Important:
- Documents marked as historical/archived in `docs/CONTEXT_CANON.md` are non-normative.
- If a historical phase doc conflicts with active planning docs, always follow Phase 13 + Context Canon.
- Execution decisions must not be derived from archived phase docs unless explicitly requested for legacy analysis.
- Before planning or implementation work, read `docs/CONTEXT_CANON.md` first.

## Current App Structure
- `app/(marketing)` contains landing + public pages (`/`, `/features`, `/pricing`, `/about`, `/privacy`, `/terms`).
- `app/(dashboard)` contains authenticated product routes.
- `app/auth` contains login/signup pages.
- `app/onboarding` is the live 4-step trajectory-first onboarding gate for authenticated users.
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
| `components/features/dashboard/CommandBar.tsx` | Unified command bar — stats (tasks/exercises/streak/career) + inline NBA, ~56px, card-surface |
| `lib/hooks/useStreak.ts` | React Query hook for `/api/user/streak` (task-based streak, 5min staleTime) |
| `public/sprites/lucian-sprites-v2.svg` | Lucian pixel art spritesheet V2 — 8×10 grid, 64×64px frames, 5 live animations |
| `lib/lucian/copy.ts` | Lucian companion message library (5 moods, 80+ lines) |
| `lib/command/parser.ts` | Deterministic grammar parser for Command Palette intents (4 intents: task, goal, focus, page) |

## Commands
```bash
npm run dev                   # Dev server
npm run build                 # Production build
npm run type-check            # TypeScript check
npm run lint                  # ESLint
npm run test                  # Vitest (all)
npm run test:unit             # Unit tests only (runs in pre-commit hook)
npm run test:watch            # Vitest watch mode
npm run test:coverage         # Coverage report (CI-enforced gate)
npm run test:evals            # AI guardrail eval suite
npm run test:e2e:blocker      # Critical Playwright blocker suite
npm run test:e2e              # Full Playwright suite
npm run test:tenant-isolation # Multi-tenant data isolation check
```

## Git Workflow
- Feature branches only — never push directly to `main`
- `main` protected via branch protection (required: Quality Checks + E2E Blocker Suite)
- Vercel Preview URLs = Staging (auto-deployed per branch)
- Pre-commit hook runs: type-check → lint → unit tests

## Conventions
- Supabase DB columns are `snake_case`; app models are `camelCase`.
- Date-only fields are commonly stored as `YYYY-MM-DD`; timestamps are ISO strings.
- Conversion helpers live in `lib/supabase/*.ts` (`supabaseXToX`, `xToSupabaseInsert`).
- TS strict mode is enforced; avoid passing explicit `undefined` where optional properties are omitted.
- Pre-commit: Husky + lint-staged (`eslint --fix`, `prettier --write`).
- Team communication convention: German conversation, English code/content.

---

## Architecture Principles (read before building anything new)

### Layer Ownership — each layer has exactly one job
```
UI (components/, app/(dashboard)/*/page.tsx)
  → knows how things look, not where data comes from

API Routes (app/api/*/route.ts)
  → knows how to validate requests and return responses, not how the DB is structured

Logic / Engines (lib/trajectory/planner.ts, lib/application/*, lib/command/*)
  → owns business rules and calculations, never imported by DB layer

Data Layer (lib/supabase/*.ts)
  → knows how to query the DB, nothing else
```

**Rule:** If you find business logic in a page component or a DB query in an API route — move it to the right layer first.

### Single Source of Truth
- Risk thresholds → only in `lib/trajectory/planner.ts`, never duplicated in UI
- OAuth redirect logic → only in `lib/google/oauth.ts`
- Auth helpers → only in `lib/api/auth.ts`
- If logic exists in two places, one of them is wrong.

### Feature Isolation — never let one feature block another
- If feature B fetches data from `/api/trajectory/*` and is shown on `/today` — it must have its own loading/error state.
- A slow or failing secondary feature must never block the core page from rendering.
- Pattern: independent `useQuery` per widget, never await-chained at page level.

### 5 Questions before implementing any new feature
1. **Where does this data live?** DB (Supabase), client (localStorage), or URL (query params)?
2. **Who can access this?** Does RLS cover it, or do we need `requireApiAuth()` + user_id filtering?
3. **What breaks if this fails?** Is it isolated or does it block a core page?
4. **What is the contract?** Define the TypeScript type before writing the function.
5. **Where does the logic live?** Calculation → `lib/`, HTTP handling → `app/api/`, display → `components/`.

### New Feature Planning Order
1. Define the problem (1 sentence) + success criterion (measurable)
2. Design the data model (DB schema) before any UI
3. Define the API surface (endpoints + request/response types)
4. Write the logic/engine in `lib/` (testable, no HTTP, no UI)
5. Build the API routes (thin: validate → call lib → respond)
6. Build the UI (last)
7. Write tests: unit for logic, API for routes, E2E for critical path
8. Write/update docs (design contract + agent handbook if complex)
