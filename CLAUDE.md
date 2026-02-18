# CLAUDE.md - Project Context

## Project Overview
**INNIS** is a personal productivity dashboard built with Next.js 14 (App Router), TypeScript, Supabase, and TanStack React Query. It manages university courses, goals, career applications, daily tasks, focus time tracking, and Google Calendar integration.

## Tech Stack
- **Framework:** Next.js 14 (App Router, `app/` directory)
- **Language:** TypeScript (strict mode, `exactOptionalPropertyTypes: true`)
- **Database:** Supabase (PostgreSQL) via `@supabase/ssr`
- **State/Fetching:** TanStack React Query v5
- **Forms:** React Hook Form + Zod validation
- **Styling:** Tailwind CSS + Framer Motion animations
- **Charts:** Recharts v3.7
- **UI:** Radix UI primitives, Lucide icons, cmdk command palette

## Architecture Patterns

### API Layer
- API routes in `app/api/` — all protected with `requireApiAuth()` from `lib/api/auth.ts`
- Server-side Supabase client: `createClient()` from `lib/auth/server.ts` — create per-function, NOT singleton
- **NEVER** use bare client from `lib/supabase/client.ts` in API routes (causes RLS failures)
- Zod schemas in `lib/schemas/` validate all inputs
- Supabase data layer in `lib/supabase/` (courses.ts, goals.ts, applications.ts, focusSessions.ts)
- Frontend API client in `lib/api/` (goals.ts, applications.ts, daily-tasks.ts, calendar.ts, focus-sessions.ts)

### Frontend Layer
- Pages in `app/(dashboard)/` — all `'use client'` with React Query
- Pattern: `useQuery` for fetching, `useMutation` for create/update/delete
- Mutations invalidate queries on success, show error state on failure
- Feature components in `components/features/{feature}/`
- Shared UI components in `components/ui/`

### Data Flow
```
Page → lib/api/*.ts (fetch functions) → /api/* routes → lib/supabase/*.ts → Supabase DB
```

### Form Modal Pattern
Every CRUD feature follows this pattern:
1. Page has `editingX` state + `isModalOpen` state
2. `createMutation` + `updateMutation` + `deleteMutation`
3. Submit handler checks `editingX` to route to create or update
4. Modal/Form receives `initialData`, `isEdit`, `isSaving`, `error` props
5. Form uses `useEffect` with `reset(initialData ?? defaults)` for reactivity

### Global Providers (app/layout.tsx)
```
AuthProvider > QueryProvider > FocusTimerProvider > CommandPaletteProvider
```

## Pages
| Route | Purpose |
|-------|---------|
| `/today` | Daily dashboard with tasks, schedule, study progress, deadlines |
| `/calendar` | Weekly calendar with Google Calendar integration |
| `/goals` | Goal tracking (fitness, career, learning, finance) |
| `/university` | Course & exercise tracking (WS 2025/26) |
| `/career` | Job application Kanban pipeline |
| `/analytics` | Focus analytics with Recharts charts |

## Key Files
| Path | Purpose |
|------|---------|
| `lib/supabase/types.ts` | Database type definitions (7 tables) |
| `lib/schemas/*.schema.ts` | Zod validation schemas |
| `lib/api/auth.ts` | API route auth middleware (`requireApiAuth`) |
| `lib/auth/server.ts` | Server-side Supabase auth client (`createClient`) |
| `components/providers/FocusTimerProvider.tsx` | Global focus timer context |
| `components/features/focus/FloatingTimer.tsx` | Floating timer widget |

## Database Tables
`goals`, `job_applications`, `courses`, `exercise_progress`, `daily_tasks`, `focus_sessions`

Note: `events` table exists in types.ts but NOT in Supabase DB.

RLS: All tables use `FOR ALL TO authenticated USING (true) WITH CHECK (true)` — no `user_id` columns.

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check (tsc --noEmit)
npm run lint         # ESLint
npm run test         # Vitest
```

## Conventions
- Commit messages: conventional commits (feat:, fix:, docs:, etc.)
- All dates stored as `YYYY-MM-DD` strings in Supabase, converted to `Date` objects on frontend
- Supabase columns use `snake_case`, TypeScript types use `camelCase`
- Conversion functions: `supabaseXToX()` and `xToSupabaseInsert()` in `lib/supabase/*.ts`
- Pre-commit hooks: husky + lint-staged (eslint --fix, prettier --write)
- TypeScript strict: use explicit object building instead of `undefined` in optional properties
- User language: German for conversation, English for code
