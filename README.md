# 🔮 INNIS

> Personal productivity dashboard for students — study tracker, goal management, career pipeline, focus timer, and daily planner in one place.

## Canonical Planning Docs

For current roadmap and implementation decisions, use:
- `docs/CONTEXT_CANON.md`
- `docs/PHASE39_MARKETING_ART_DIRECTION_2026-03-23.md`
- `docs/PHASE38_CAREER_INTELLIGENCE_V3_2026-03-22.md`
- `docs/PHASE37_CRITICAL_PATH_INTEGRATION_2026-03-21.md`
- `docs/PHASE36_QUALITY_HARDENING_2026-03-21.md`
- `docs/PHASE35_CAREER_INTELLIGENCE_V2_2026-03-21.md`
- `docs/PHASE31_CAREER_HARDENING_2026-03-15.md`

Archived phase docs are historical references only.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)

---

## ✨ Features

### 🚀 Onboarding (`/onboarding`)
- **4-step trajectory activation**: Welcome → Trajectory goal → Capacity plan → Complete
- **Trajectory-first activation**: new users see an immediate `on track / tight / at risk` result instead of filling low-signal setup forms
- **Demo seed**: "Mit Beispieldaten starten" loads an end-to-end trajectory demo with visible status instantly
- **Confetti celebration** on completion (canvas-confetti)
- **LocalStorage persistence**: wizard state survives refresh and back-navigation
- **Back-navigation** with form draft preservation (no duplicate API calls)
- **Event tracking** stub (sessionStorage-based, ready for PostHog integration)

### 🎯 Daily Dashboard (`/today`)
- **Focus Tasks** with new-user empty state and add-task CTA
- **8 widgets**: Quick Stats Bar, Circular Progress, Quick Actions, Pomodoro Timer, Mood Tracker, Activity Feed, Time Block Visualizer, Week Overview
- **Smart task aggregation** from goals, university exercises, career interviews, and manual tasks
- **Urgency-based color coding** for exams and deadlines
- **Real-time sync** with Google Calendar

### 🎓 University (`/university`)
- Course management with ECTS, semester (WS 2025/26), and exam date tracking
- Exercise checkboxes (Blatt 1–N) with animated progress bars
- Exam countdown with urgency indicators

### 🎯 Goals (`/goals`)
- CRUD with categories (Career, Fitness, Learning, Finance) and priority levels
- Progress tracking and completion statistics

### 💼 Career (`/career`)
- Job application Kanban pipeline (Applied → Interview → Offer/Rejected)
- CV upload & storage via Supabase Storage
- PDF/DOCX text extraction for auto-filling application forms

### 📅 Calendar (`/calendar`)
- Google Calendar OAuth integration, week view, disconnect/reconnect

### 📊 Analytics (`/analytics`)
- Focus time charts (Recharts), streak tracking, productivity trends

### ⚙️ Settings (`/settings`)
- **6 Themes**: Midnight, Nord, Dracula, Ocean, Emerald, Gold
- **7 Accent colors**: Purple, Blue, Emerald, Orange, Pink, Red, Gold
- **Sound system**: toggleable UI sounds with volume control and preview
- **Power Hotkeys**: LoL-style summoner spell keybindings (QWER, 1–7, B, P, J/K)
- **Champion system**: XP and streak gamification settings
- **Demo data removal**: one-click delete with confirmation modal (only shown when demo data is active)

### ⏱️ Global Focus Timer
- Floating widget persists across all pages and browser refresh
- LocalStorage backup for timer state

---

## 🏗️ Architecture

```
Browser
  └── Next.js 14 (App Router)
        ├── /app/(dashboard)/*     ← Client pages + React Query
        ├── /app/api/*             ← Protected API routes (requireApiAuth)
        ├── /app/actions/*         ← Server Actions (mutations)
        └── /app/onboarding/*      ← Onboarding wizard + seed services
              │
              ├── Supabase (PostgreSQL + RLS)
              ├── Supabase Storage (CV uploads)
              └── Google Calendar API (optional)
```

**Data flow:** Page → `lib/api/*.ts` → `/api/*` route → `lib/supabase/*.ts` → Supabase DB

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 (strict mode) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (@supabase/ssr) |
| **Data Fetching** | TanStack React Query v5 |
| **Validation** | Zod |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **UI Primitives** | Radix UI (Dialog, Tooltip, Dropdown) |
| **Command Palette** | cmdk |
| **Forms** | React Hook Form + @hookform/resolvers |
| **Toasts** | react-hot-toast |
| **Confetti** | canvas-confetti |
| **Date Handling** | date-fns |
| **File Parsing** | pdf-parse, mammoth (DOCX) |
| **External API** | Google Calendar API (googleapis) |
| **Testing** | Vitest + @testing-library/react |
| **Linting** | ESLint + Prettier (pre-commit via Husky + lint-staged) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- Google Cloud project (optional, for Calendar)

### Installation

1. **Clone**
   ```bash
   git clone https://github.com/Innisfree7x/PersonalTerminal.git
   cd bloomberg-personal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables** — create `.env.local`:
   ```env
   # Supabase (required)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Google Calendar (optional)
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

   # Notifications + cron (Phase 11)
   RESEND_API_KEY=re_xxxxxxxxx
   RESEND_FROM_EMAIL="INNIS <onboarding@resend.dev>"
   CRON_SECRET=long-random-secret
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Database setup** — run SQL migrations in Supabase SQL Editor:
   - See [`docs/DATABASE.md`](docs/DATABASE.md) for full schema
   - Tables: `goals`, `job_applications`, `courses`, `exercise_progress`, `daily_tasks`, `focus_sessions`
   - Storage: create a `cv-uploads` bucket
   - RLS: owner-only policies per table (e.g. `auth.uid() = user_id`)

5. **Start dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) — you'll be routed to `/onboarding` on first login.

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Server/Cron | Service role key for protected server-side jobs |
| `GOOGLE_CLIENT_ID` | ⚠️ Calendar | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | ⚠️ Calendar | Google OAuth 2.0 Client Secret |
| `GOOGLE_REDIRECT_URI` | ⚠️ Calendar | OAuth callback URL |
| `RESEND_API_KEY` | ✅ Notifications | API key for email delivery |
| `RESEND_FROM_EMAIL` | ✅ Notifications | Sender identity (`email` or `Name <email>`) |
| `CRON_SECRET` | ✅ Notifications | Bearer secret for cron route protection |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical site URL for links/metadata |
| `MONITORING_ALERT_WEBHOOK_URL` | Optional | Webhook for critical error alerts |

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript compiler check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Coverage report + enforced CI gate |
| `npm run test:e2e:blocker` | Critical Playwright flows (serial CI gate) |
| `npm run test:e2e` | Full Playwright suite |
| `npm run fix-courses` | Fix missing exercise_progress entries |

---

## 📂 Project Structure

```
bloomberg-personal/
├── app/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── today/                # Daily planner
│   │   ├── goals/                # Goal tracker
│   │   ├── career/               # Job application Kanban
│   │   ├── university/           # Course & exercise tracker
│   │   ├── calendar/             # Google Calendar
│   │   ├── analytics/            # Focus analytics
│   │   ├── settings/             # Themes, sounds, hotkeys, demo data
│   │   └── layout.tsx            # Sidebar + header layout
│   ├── onboarding/               # Onboarding wizard
│   │   ├── page.tsx              # 4-step trajectory activation controller
│   │   ├── analytics.ts          # Client-side event tracking
│   │   ├── demoData.ts           # Demo seed constants
│   │   └── demoSeedService.ts    # seedDemoData / removeDemoData
│   ├── api/                      # API routes (all protected via requireApiAuth)
│   │   ├── goals/
│   │   ├── applications/
│   │   ├── courses/
│   │   ├── daily-tasks/
│   │   ├── focus-sessions/
│   │   ├── user/streak/
│   │   ├── cv/extract/
│   │   ├── calendar/
│   │   └── auth/google/
│   ├── actions/                  # Next.js Server Actions
│   │   └── profile.ts
│   ├── globals.css
│   ├── layout.tsx                # Root layout + global providers
│   └── page.tsx                  # Auth redirect → /today or /onboarding
├── components/
│   ├── features/
│   │   ├── dashboard/            # FocusTasks, QuickStatsBar, PomodoroTimer, …
│   │   ├── onboarding/           # StepWelcome, StepTrajectoryGoal, StepTrajectoryPlan, StepComplete, OnboardingLayout
│   │   ├── goals/
│   │   ├── career/
│   │   ├── university/
│   │   ├── calendar/
│   │   └── focus/                # FloatingTimer widget
│   ├── providers/                # ThemeProvider, FocusTimerProvider, PowerHotkeysProvider, ChampionProvider, …
│   ├── shared/                   # ConfirmModal, ErrorBoundary, CommandPalette
│   ├── layout/                   # Sidebar, Header
│   └── ui/                       # Button, Input, Card, …
├── lib/
│   ├── supabase/                 # DB clients + typed query functions
│   ├── api/                      # Frontend fetch helpers
│   ├── auth/                     # Server-side Supabase client (createClient)
│   ├── schemas/                  # Zod schemas
│   ├── hooks/                    # Custom hooks (useAppSound, …)
│   └── utils/
├── scripts/
│   └── fixCourseExercises.ts
├── docs/
│   ├── HIGH_END_DUO_PLAYBOOK.md  # Reusable Codex+Claude project playbook
│   ├── API.md
│   ├── DATABASE.md
│   ├── FEATURES.md
│   └── SETUP.md
├── CLAUDE.md                     # AI assistant context
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

---

## 🔧 Key Patterns

```ts
// API routes — always use requireApiAuth + per-request server client
import { requireApiAuth } from '@/lib/api/auth';
import { createClient } from '@/lib/auth/server';

export async function GET() {
  const { supabase } = await requireApiAuth();
  // ...
}

// Server Actions — use createClient() per function call
import { createClient } from '@/lib/auth/server';

export async function myAction() {
  const supabase = await createClient();
  // ...
}
```

**Never** use the bare browser client (`lib/supabase/client.ts`) in server-side code — it causes RLS failures.

---

## 🚢 Deployment (Vercel)

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add required environment variables in Vercel dashboard (`Production` at minimum):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `CRON_SECRET`
4. Deploy — auto-deploys on every push to `main`

For production Google OAuth: update redirect URI to `https://your-app.vercel.app/api/auth/google/callback`.

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Missing Supabase environment variables" | Check `.env.local` exists with valid credentials |
| No study tasks on dashboard | Run `npm run fix-courses` to create missing exercise_progress entries |
| Google Calendar not working | Verify redirect URI matches exactly in Google Cloud Console |
| RLS errors | Verify owner-only policies and `user_id`-scoped queries (`auth.uid() = user_id`) |
| Demo data can't be removed | Clear `localStorage['innis_demo_ids']` in DevTools manually |

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built for personal use · WS 2025/26</strong>
</div>
