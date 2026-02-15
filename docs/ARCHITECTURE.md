# Architecture Reference

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.5 |
| Language | TypeScript (strict, `exactOptionalPropertyTypes`) | ^5.5.4 |
| Database | Supabase (PostgreSQL) | @supabase/supabase-js ^2, @supabase/ssr ^0.8.0 |
| Data Fetching | TanStack React Query | ^5 |
| Forms | React Hook Form + Zod | ^7.71.1 / ^3 |
| Styling | Tailwind CSS | ^3.4.1 |
| Animations | Framer Motion | ^12.30.0 |
| Charts | Recharts | ^3.7.0 |
| UI Primitives | Radix UI (Dialog, Dropdown, Select, Tabs, Tooltip) | various ^1-2 |
| Icons | Lucide React | ^0.562.0 |
| Command Palette | cmdk | ^1.1.1 |
| Dates | date-fns | ^3 |
| CV Parsing | pdf-parse ^1, mammoth ^1 | |
| Google Calendar | googleapis ^144 | REST API, not SDK |
| Analytics | @vercel/analytics, @vercel/speed-insights | |

## Project Structure

```
app/
  (dashboard)/          # Route group — all pages share Sidebar + Header + FloatingTimer
    layout.tsx          # 'use client' — SidebarProvider, AnimatePresence page transitions
    today/page.tsx      # Daily dashboard
    calendar/page.tsx   # Week calendar (Google Calendar)
    goals/page.tsx      # Goal CRUD + filter/sort
    university/page.tsx # Course + exercise tracking
    career/page.tsx     # Job application Kanban
    analytics/page.tsx  # Focus session charts
  api/                  # API routes (see API.md)
  auth/                 # Login, signup, callback pages
  layout.tsx            # Root layout — providers, Inter font, dark mode
  page.tsx              # Redirects to /today

components/
  ui/                   # Button, Card, Badge, Input, Checkbox, Skeleton
  layout/               # Sidebar, Header, SidebarProvider
  providers/            # QueryProvider, FocusTimerProvider
  shared/               # CommandPalette, CommandPaletteProvider, ErrorBoundary
  features/
    dashboard/          # FocusTasks, ScheduleColumn, DashboardStats, PomodoroTimer,
                        # StudyProgress, UpcomingDeadlines, WeekOverview, QuickActionsWidget
    analytics/          # DailyFocusChart, HourlyDistributionChart, CategoryBreakdown,
                        # WeekdayChart, RecentSessionsList, AnalyticsStatCard
    goals/              # GoalCard, GoalsList, GoalModal, GoalForm
    career/             # ApplicationCard, ApplicationModal, ApplicationForm,
                        # ApplicationStats, CvUpload
    university/         # CourseCard, CourseModal
    focus/              # FloatingTimer
    calendar/           # EventCard

lib/
  api/                  # Frontend fetch wrappers (goals, applications, daily-tasks,
                        # focus-sessions, calendar, errors, auth)
  auth/                 # AuthProvider.tsx, client.ts, server.ts
  supabase/             # Server-side data layer (goals, applications, courses,
                        # focusSessions, types, client, browserClient)
  schemas/              # Zod schemas (goal, application, course, dailyTask, focusSession)
  google/               # calendar.ts — Google Calendar REST API calls
  hooks/                # useNotifications.ts
  data/                 # mockEvents.ts (CalendarEvent type)
  design-system/        # Design tokens (not used at runtime — mirrored in tailwind.config.ts)
  utils.ts              # cn() — clsx + tailwind-merge
  utils/                # colors.ts, goalUtils.ts
  env.ts                # Zod-validated env vars (serverEnv, clientEnv)
```

## Auth System

### Supabase Auth (email/password)

| File | Purpose |
|------|---------|
| `lib/auth/server.ts` | `createClient()` — server-side `createServerClient` from `@supabase/ssr`. Per-function, NOT singleton. Also exports `getCurrentUser()`, `requireAuth()`, `getUserId()` |
| `lib/auth/client.ts` | `createClient()` — browser `createBrowserClient`. Also exports `signIn()`, `signUp()`, `signOut()`, `resetPassword()`, `updatePassword()` |
| `lib/auth/AuthProvider.tsx` | React context — `useAuth()` hook returns `{ user, loading, signOut }`. Listens to `onAuthStateChange` |
| `lib/api/auth.ts` | `requireApiAuth()` — returns `{ user, errorResponse }`. If no user, `errorResponse` is 401 JSON. Used in every API route |
| `middleware.ts` | Protects `/today`, `/calendar`, `/goals`, `/university`, `/career` — redirects to `/auth/login`. Also redirects authenticated users away from auth pages |
| `lib/supabase/client.ts` | **DEPRECATED** bare Supabase client. DO NOT use in API routes (bypasses RLS) |

### Google Calendar OAuth (separate system)

| File | Purpose |
|------|---------|
| `/api/auth/google` | Redirects to Google OAuth consent (scope: `calendar.readonly`) |
| `/api/auth/google/callback` | Exchanges code for tokens, stores in httpOnly cookies (`google_access_token`, `google_refresh_token`, `google_token_expires_at`) |
| `/api/auth/google/disconnect` | Clears Google cookies |
| `lib/google/calendar.ts` | `fetchTodayEvents()`, `fetchWeekEvents()` — calls Google Calendar REST API. Handles token refresh if expiring within 5 minutes |

### Middleware matcher

```
/today/:path*, /calendar/:path*, /goals/:path*, /university/:path*, /career/:path*, /auth/:path*, /api/:path*
```

Note: `/analytics` is NOT in the middleware matcher — unprotected at middleware level (but API routes still require auth).

## Database Layer

### Two Supabase clients — when to use which

| Client | Import | Use in |
|--------|--------|--------|
| Server (SSR) | `createClient()` from `lib/auth/server.ts` | API routes, server components |
| Browser | `createClient()` from `lib/auth/client.ts` | React components (auth only) |
| **NEVER** | `lib/supabase/client.ts` | Deprecated bare client |

### Data flow

```
React Component → lib/api/*.ts (fetch wrapper) → /api/* route → lib/supabase/*.ts → Supabase DB
```

### Conversion pattern

Supabase uses `snake_case`, TypeScript uses `camelCase`. Each `lib/supabase/*.ts` file has:
- `supabaseXToX()` — converts DB row to frontend type
- `xToSupabaseInsert()` — converts frontend input to DB insert

## State Management

### Provider tree (app/layout.tsx)

```
AuthProvider > QueryProvider > FocusTimerProvider > CommandPaletteProvider
```

Dashboard layout adds `SidebarProvider` inside `(dashboard)/layout.tsx`.

### React Query config

```ts
staleTime: 60_000, refetchOnWindowFocus: false
```

### Query keys

| Key | Used by |
|-----|---------|
| `['goals']` | Goals page |
| `['applications']` | Career page |
| `['courses']` | University page |
| `['daily-tasks', date]` | FocusTasks component |
| `['calendar', 'today']` | Today page |
| `['calendar', 'week', isoString]` | Calendar page |
| `['focus', 'today']` | FocusTimerProvider (refetchInterval: 60s) |
| `['focus', 'analytics', days]` | Analytics page |
| `['focus', 'sessions', 'recent']` | Analytics page |
| `['dashboard', 'next-tasks']` | Today page |

### Contexts

| Context | Hook | State |
|---------|------|-------|
| `AuthContext` | `useAuth()` | `{ user, loading, signOut }` |
| `FocusTimerContext` | `useFocusTimer()` | Timer status, timeLeft, totalTime, sessionType, label, category, completedPomodoros, settings, controls |
| `CommandPaletteContext` | `useCommandPalette()` | `{ isOpen, open, close, toggle }` |
| `SidebarContext` | `useSidebar()` | `{ isCollapsed, setIsCollapsed, toggleCollapsed }` |

### localStorage persistence

| Key | Purpose |
|-----|---------|
| `prism-focus-timer` | Timer state — survives page refresh. Calculates elapsed from `startedAt` timestamp on restore |
| `prism-timer-settings` | Timer settings (focusDuration, breakDuration, etc.) |

## Routing

### Pages

| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Server redirect to `/today` |
| `/today` | Yes | Dashboard: tasks, calendar, stats, pomodoro, study progress, deadlines |
| `/calendar` | Yes | Week view with Google Calendar events |
| `/goals` | Yes | Goal CRUD with category filter and sort |
| `/university` | Yes | Course + exercise tracking, ECTS counter |
| `/career` | Yes | Job application Kanban (4 columns) |
| `/analytics` | Yes* | Focus session charts (4 charts + recent sessions) |
| `/auth/login` | No | Email/password login |
| `/auth/signup` | No | Email/password signup |
| `/auth/callback` | No | Supabase OAuth callback |

*`/analytics` is not in middleware matcher but API routes require auth.

### API Routes — see `docs/API.md`

## Key Patterns

### Form Modal Pattern (Goals, Career, University)

```
1. Page has editingX + isModalOpen state
2. createMutation + updateMutation + deleteMutation
3. onSubmit checks editingX → routes to create or update
4. Modal receives { initialData, isEdit, isSaving, error }
5. Form uses react-hook-form + zod resolver
6. useEffect(reset(initialData ?? defaults)) for reactivity
```

### API Route Pattern

```ts
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;

  try {
    const supabase = createClient(); // from lib/auth/server
    // ... query
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
```

### Error response format

Inconsistent across routes:
- Most: `{ message: string }` with status 500
- Zod validation: `{ message: 'Validation error', errors: ZodError }`
- Some: `{ error: string }` (dashboard/focus-time, user/streak)
- cv/extract: plain text string response
- Delete: empty body 204 (applications, courses, daily-tasks) or `{ message }` 200 (goals)

### Zod schemas used in API routes

| Schema | File | Used in |
|--------|------|---------|
| `createGoalSchema` | `lib/schemas/goal.schema.ts` | POST /api/goals, PATCH /api/goals/[id] (`.partial()`) |
| `createApplicationSchema` | `lib/schemas/application.schema.ts` | POST /api/applications, PATCH /api/applications/[id] (full, not partial) |
| `createCourseSchema` | `lib/schemas/course.schema.ts` | POST /api/courses |
| `createDailyTaskSchema` | `lib/schemas/dailyTask.schema.ts` | POST /api/daily-tasks |
| `createFocusSessionSchema` | `lib/schemas/focusSession.schema.ts` | POST /api/focus-sessions |

## Design System

### Theme: permanent dark mode (`<html className="dark">`)

| Token | Value |
|-------|-------|
| Background | `#0A0A0A` primary, `#141414` surface, `#1A1A1A` hover |
| Borders | `#262626` primary, `#333333` secondary, `#404040` tertiary |
| Text | `#EDEDED` primary, `#A1A1A1` secondary, `#6B6B6B` tertiary |
| Primary | `#8B5CF6` (purple) |
| Accent Goals | `#8B5CF6` purple |
| Accent Career | `#3B82F6` blue |
| Accent University | `#10B981` green |
| Accent Calendar | `#F59E0B` amber |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Font Sans | Inter |
| Font Mono | JetBrains Mono |
| Spacing | 4px base (Tailwind default override: 1=4px, 2=8px, 4=16px...) |
| Shadows | `glow: 0 0 20px rgb(139 92 246 / 0.3)` |

### Custom CSS classes (globals.css)

`card-surface`, `input-field` — utility classes for consistent card and input styling.

## Global Features

### Focus Timer (`FocusTimerProvider` + `FloatingTimer`)

- Pomodoro timer with focus/break cycles
- States: `idle | running | paused | break | break_paused`
- Settings: focus duration, break durations, sessions before long break, auto-start break, sound
- Persists to localStorage — survives page refresh and navigation
- Calculates elapsed time from `startedAt` timestamp on restore
- Saves sessions to `/api/focus-sessions` on completion (or stop if >10s elapsed)
- Sound: Web Audio API oscillator
- Keyboard: `Alt+F` toggle
- UI: floating pill (bottom-right), expands to full timer

### Command Palette (`CommandPaletteProvider` + `CommandPalette`)

- `Cmd+K` / `Ctrl+K` to open
- Sections: Navigation (6 routes), Focus Timer controls, Quick Actions (add goal/app/course/task)
- Built on `cmdk`

## Known Issues / TODOs

| Issue | Details |
|-------|---------|
| No `user_id` columns | Single-user app. All tables use RLS `USING (true) WITH CHECK (true)`. Multi-user would require schema migration |
| `events` table | Defined in `lib/supabase/types.ts` but does NOT exist in Supabase. Calendar uses Google Calendar API only |
| `notes` API | `/api/notes` exists but returns empty array (GET) and does nothing (POST). No `notes` table in DB |
| `activity/recent` API | Returns hardcoded mock data, no real DB query |
| `/analytics` unprotected | Not in middleware matcher. API routes still require auth, but page itself isn't redirected |
| Error format inconsistent | Mix of `{ message }`, `{ error }`, plain text across API routes |
| PATCH /applications | Uses full `createApplicationSchema` instead of `.partial()` — requires all fields on update |
| PATCH /courses/[id] | No Zod validation — manual field assembly |
| Google disconnect | No auth check — any request can clear Google cookies |
| Calendar page styling | Uses hardcoded Tailwind dark: classes instead of design system tokens |
