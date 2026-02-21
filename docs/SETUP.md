# 🚀 Setup Guide

Step-by-step guide to get INNIS running locally on your machine.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Supabase Setup](#supabase-setup)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Google Calendar Setup (Optional)](#google-calendar-setup-optional)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Node.js** 18.x or higher
  - Check version: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)

- **npm** 9.x or higher (comes with Node.js)
  - Check version: `npm --version`

- **Git**
  - Check version: `git --version`
  - Download: [git-scm.com](https://git-scm.com/)

### Recommended

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript + JavaScript Language Features

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Innisfree7x/PersonalTerminal.git
cd bloomberg-personal
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- Supabase client
- React Query
- Zod
- Tailwind CSS
- All dev dependencies (ESLint, Vitest, etc.)

**Expected output:**
```
added 342 packages in 45s
```

---

## Supabase Setup

### 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com/)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### 2. Create a New Project

1. Click "New Project"
2. Fill in project details:
   - **Name:** `innis` (or your choice)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your location
3. Click "Create new project"
4. Wait 2-3 minutes for setup to complete

### 3. Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL:** `https://your-project.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

**Important:** Keep these keys safe! You'll need them in the next step.

---

## Environment Configuration

### 1. Create `.env.local` File

In the project root directory, create a file named `.env.local`:

```bash
touch .env.local
```

> **Note:** On Windows, use `type nul > .env.local` or create via File Explorer

### 2. Add Environment Variables

Open `.env.local` in your editor and add:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Calendar Integration (OPTIONAL)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**Replace placeholders:**
- `your-project.supabase.co` → Your actual Supabase project URL
- `eyJhbGci...` → Your actual Supabase anon key
- Google credentials (if using Calendar integration)

### 3. Verify Configuration

Check that `.env.local` is listed in `.gitignore`:

```bash
cat .gitignore | grep .env.local
```

**Expected output:**
```
.env.local
```

✅ This ensures your credentials are never committed to Git.

---

## Database Migration

### 1. Open Supabase SQL Editor

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "+ New query"

### 2. Run Schema Creation Script

Copy and paste the following SQL script:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Goals Table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 100),
  description TEXT,
  target_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fitness', 'career', 'learning', 'finance')),
  metrics_current INTEGER,
  metrics_target INTEGER,
  metrics_unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Job Applications Table
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('applied', 'interview', 'offer', 'rejected')),
  application_date DATE NOT NULL,
  interview_date DATE,
  notes TEXT,
  salary_range TEXT,
  location TEXT,
  job_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Courses Table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
  ects INTEGER NOT NULL CHECK (ects >= 1 AND ects <= 15),
  num_exercises INTEGER NOT NULL CHECK (num_exercises >= 1 AND num_exercises <= 20),
  exam_date DATE,
  semester TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Exercise Progress Table
CREATE TABLE exercise_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  exercise_number INTEGER NOT NULL CHECK (exercise_number >= 1),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id, exercise_number)
);

-- Daily Tasks Table
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 500),
  completed BOOLEAN NOT NULL DEFAULT false,
  source TEXT CHECK (source IN ('manual', 'goal', 'application')),
  source_id UUID,
  time_estimate TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('meeting', 'task', 'break')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Indexes
CREATE INDEX idx_goals_category ON goals(category);
CREATE INDEX idx_goals_target_date ON goals(target_date);
CREATE INDEX idx_applications_status ON job_applications(status);
CREATE INDEX idx_applications_interview_date ON job_applications(interview_date) WHERE interview_date IS NOT NULL;
CREATE INDEX idx_courses_exam_date ON courses(exam_date) WHERE exam_date IS NOT NULL;
CREATE INDEX idx_exercise_course_id ON exercise_progress(course_id);
CREATE INDEX idx_exercise_completed ON exercise_progress(completed) WHERE completed = false;
CREATE INDEX idx_tasks_date ON daily_tasks(date);
CREATE INDEX idx_tasks_date_completed ON daily_tasks(date, completed);
```

3. Click **"RUN"** (bottom right)
4. Verify success: **"Success. No rows returned"**

### 3. Enable Row Level Security (RLS)

Run this script to enable RLS with public access (development mode):

```sql
-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow all access (development only)
CREATE POLICY "Allow all access" ON goals FOR ALL USING (true);
CREATE POLICY "Allow all access" ON job_applications FOR ALL USING (true);
CREATE POLICY "Allow all access" ON courses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON exercise_progress FOR ALL USING (true);
CREATE POLICY "Allow all access" ON daily_tasks FOR ALL USING (true);
CREATE POLICY "Allow all access" ON events FOR ALL USING (true);
```

> ⚠️ **Production:** Replace with user-specific policies. See [`DATABASE.md`](./DATABASE.md) for examples.

### 4. Create Storage Bucket

1. In Supabase dashboard, click **Storage** (left sidebar)
2. Click "+ New bucket"
3. Fill in details:
   - **Name:** `cv-uploads`
   - **Public:** ❌ No (private)
4. Click "Create bucket"

### 5. Verify Tables

1. Click **Database** → **Tables** (left sidebar)
2. You should see 6 tables:
   - `goals`
   - `job_applications`
   - `courses`
   - `exercise_progress`
   - `daily_tasks`
   - `events`

---

## Google Calendar Setup (Optional)

Skip this section if you don't need Google Calendar integration.

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `innis`
4. Click "Create"

### 2. Enable Google Calendar API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click "Google Calendar API"
4. Click "Enable"

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Configure consent screen (if prompted):
   - User Type: **External**
   - App name: `INNIS`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Skip (add later)
   - Test users: Add your Gmail address
   - Click "Save and Continue"
4. Create OAuth client:
   - Application type: **Web application**
   - Name: `INNIS - Local`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
   - Click "Create"
5. Copy **Client ID** and **Client Secret**
6. Add them to your `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

### 4. Add Calendar Scope

1. Go to **OAuth consent screen**
2. Scroll to "Scopes" → Click "ADD OR REMOVE SCOPES"
3. Search for "Google Calendar API"
4. Check: `https://www.googleapis.com/auth/calendar.readonly`
5. Click "UPDATE" → "SAVE AND CONTINUE"

---

## Running the Application

### 1. Start Development Server

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.3s
```

### 2. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

**You should see:**
- Auth login page if not signed in
- Onboarding page after first successful login/signup
- Dashboard layout after onboarding completion

### 3. Complete Auth + Onboarding Flow

1. Create account at `/auth/signup` (or sign in at `/auth/login`)
2. If email confirmation is enabled, verify email and continue
3. Complete `/onboarding` once
4. Confirm redirect to `/today`

### 4. Test Database Connection

1. Click "Goals" in sidebar
2. Click "+ Add Goal"
3. Fill in form:
   - Title: "Test Goal"
   - Category: learning
   - Target Date: any future date
4. Click "Save"

**Expected result:**
- Goal appears in the list
- No errors in browser console

✅ **Success!** Your database is connected and working.

---

## Seeding Sample Data (Optional)

Populate the database with sample goals:

```bash
npm run seed
```

**Expected output:**
```
🌱 Seeding goals...
✅ Created 5 sample goals
✨ Done!
```

**Seeded data:**
- 5 goals across different categories
- Various due dates and priorities
- Mock metrics for progress tracking

---

## Testing

### Run Unit Tests

```bash
npm run test
```

**Expected output:**
```
✓ tests/unit/goal.schema.test.ts (3)
  ✓ Goal Schema Validation
    ✓ should validate correct goal data
    ✓ should reject invalid category
    ✓ should accept optional metrics

Test Files  1 passed (1)
     Tests  3 passed (3)
```

### Run Tests with UI

```bash
npm run test:ui
```

Opens Vitest UI in browser at [http://localhost:51204](http://localhost:51204)

### Generate Coverage Report

```bash
npm run test:coverage
```

Creates `coverage/` directory with HTML report.

### Run E2E (Playwright)

```bash
npx playwright install
npm run test:e2e
```

Optional credentials for authenticated E2E specs:

```bash
export E2E_EMAIL="your-test-user@example.com"
export E2E_PASSWORD="your-test-password"
```

If credentials are missing, authenticated specs are skipped.

---

## Troubleshooting

### Issue 1: "Missing Supabase environment variables"

**Error:**
```
Error: Missing Supabase environment variables
```

**Fix:**
1. Check `.env.local` exists in project root
2. Verify variable names match exactly:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart dev server: `npm run dev`

---

### Issue 2: "Failed to fetch goals" (RLS Error)

**Error in console:**
```
Error fetching goals: new row violates row-level security policy
```

**Fix:**
1. Go to Supabase SQL Editor
2. Run RLS policy creation script (see [Database Migration](#3-enable-row-level-security-rls))
3. Verify policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'goals';
   ```

---

### Issue 3: "Module not found: lucide-react"

**Error:**
```
Module not found: Can't resolve 'lucide-react'
```

**Fix:**
```bash
npm install lucide-react
```

Then restart dev server.

---

### Issue 4: Port 3000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**

**Option A:** Kill process on port 3000
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Option B:** Use different port
```bash
PORT=3001 npm run dev
```

---

### Issue 5: Google Calendar Not Syncing

**Error:**
```
401 Unauthorized - Google Calendar API
```

**Fix:**
1. Check redirect URI matches exactly:
   - Google Cloud Console: `http://localhost:3000/api/auth/google/callback`
   - `.env.local`: `GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback`
2. Ensure Google Calendar API is enabled in Google Cloud Console
3. Check OAuth consent screen is configured
4. Clear browser cookies and re-authenticate

---

### Issue 6: Missing `exercise_progress` Entries

**Error:**
```
Study tasks not appearing on Dashboard
```

**Fix:**
Run the fix script:
```bash
npm run fix-courses
```

**What it does:**
- Creates missing `exercise_progress` entries for existing courses
- Sets `completed = false` for all NULL values

---

### Issue 7: Build Errors (TypeScript)

**Error:**
```
Type error: Property 'xyz' does not exist on type 'XYZ'
```

**Fix:**
1. Run type check:
   ```bash
   npm run type-check
   ```
2. Fix errors shown in output
3. Common fixes:
   - Add missing properties to interfaces
   - Update import paths
   - Add type annotations to function params

---

## Development Workflow

### File Structure

```
innis/
├── app/                   # Next.js app directory
│   ├── (dashboard)/       # Dashboard routes
│   └── api/               # API endpoints
├── components/            # React components
├── lib/                   # Utilities and helpers
│   ├── supabase/          # Database functions
│   └── schemas/           # Zod schemas
├── docs/                  # Documentation
└── tests/                 # Test files
```

### Recommended Extensions

**VS Code:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Code Style

- **Linting:** `npm run lint`
- **Formatting:** Use Prettier (auto-format on save)
- **Commit Messages:** Conventional Commits (`feat:`, `fix:`, `docs:`)

---

## Next Steps

After successful setup:

1. **Explore Features:**
   - Add a goal → `/goals`
   - Create a course → `/university`
   - Upload CV → `/career`
   - Connect Google Calendar → `/calendar`

2. **Read Documentation:**
   - [Features Guide](./FEATURES.md) - Learn what each feature does
   - [API Docs](./API.md) - Understand API endpoints
   - [Database Schema](./DATABASE.md) - Database structure

3. **Customize:**
   - Update branding (colors, logo)
   - Add more categories
   - Extend database schema
   - Add new features

4. **Deploy:**
   - See [README.md](../README.md#deployment) for Vercel deployment

---

## Getting Help

### Resources

- **Documentation:** [`/docs`](./README.md)
- **Issues:** [GitHub Issues](https://github.com/Innisfree7x/PersonalTerminal/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Innisfree7x/PersonalTerminal/discussions)

### Common Questions

**Q: Can I use a different database?**
A: Theoretically yes, but you'd need to rewrite all Supabase client code. PostgreSQL via Supabase is recommended.

**Q: Do I need Google Calendar integration?**
A: No, it's optional. The app works fine without it. Simply skip the Google setup steps.

**Q: Can I self-host?**
A: Yes! Deploy to Vercel (free tier) or any Node.js host. See deployment guide in main README.

**Q: How do I add authentication?**
A: Implement Supabase Auth and update RLS policies. See [Supabase Auth docs](https://supabase.com/docs/guides/auth).

---

## Update Guide

To update the project to the latest version:

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run database migrations (if any)
# Check /docs/DATABASE.md for migration scripts

# Restart dev server
npm run dev
```

---

<div align="center">
  <strong>🎉 Congratulations! You're ready to use INNIS.</strong>
  <br><br>
  <a href="../README.md">← Back to README</a>
</div>
