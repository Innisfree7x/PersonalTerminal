# CLAUDE.md - Project Context

## Project Overview
**Prism** is a personal productivity dashboard built with Next.js 14 (App Router), TypeScript, Supabase, and TanStack React Query. It manages university courses, goals, career applications, daily tasks, and Google Calendar integration.

## Tech Stack
- **Framework:** Next.js 14 (App Router, `app/` directory)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (PostgreSQL) via `@supabase/supabase-js`
- **State/Fetching:** TanStack React Query v5
- **Forms:** React Hook Form + Zod validation
- **Styling:** Tailwind CSS + Framer Motion animations
- **UI:** Radix UI primitives, Lucide icons, cmdk command palette

## Architecture Patterns

### API Layer
- API routes in `app/api/` — all protected with `requireApiAuth()` from `lib/api/auth.ts`
- Each feature has `route.ts` (GET list, POST create) and `[id]/route.ts` (GET single, PATCH update, DELETE)
- Zod schemas in `lib/schemas/` validate all inputs
- Supabase DB functions in `lib/supabase/` (courses.ts, goals.ts, applications.ts)
- Frontend API client functions in `lib/api/` (goals.ts, applications.ts, daily-tasks.ts, calendar.ts)

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

## Key Files
| Path | Purpose |
|------|---------|
| `lib/supabase/types.ts` | Database type definitions (6 tables) |
| `lib/schemas/*.schema.ts` | Zod validation schemas |
| `lib/api/auth.ts` | API route auth middleware |
| `lib/env.ts` | Environment variable validation |
| `lib/auth/server.ts` | Server-side Supabase auth client |

## Database Tables
`goals`, `job_applications`, `courses`, `exercise_progress`, `daily_tasks`, `events`

See `docs/DATABASE.md` for full schema.

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check (tsc --noEmit)
npm run lint         # ESLint
npm run test         # Vitest
npm run seed         # Seed sample goals
npm run fix-courses  # Fix missing exercise_progress entries
```

## Conventions
- Commit messages: conventional commits (feat:, fix:, docs:, etc.)
- All dates stored as `YYYY-MM-DD` strings in Supabase, converted to `Date` objects on the frontend
- Supabase columns use `snake_case`, TypeScript types use `camelCase`
- Conversion functions: `supabaseXToX()` and `xToSupabaseInsert()` in `lib/supabase/*.ts`
- Pre-commit hooks: husky + lint-staged (eslint --fix, prettier --write)
