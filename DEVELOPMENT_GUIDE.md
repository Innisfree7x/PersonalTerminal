# Development Guide — INNIS

Stand: 2026-03-15

## Quick Start

```bash
npm run dev            # Dev server (localhost:3000)
npm run type-check     # TypeScript strict check
npm run lint           # ESLint
npm run test:unit      # Vitest unit tests (297 tests, 62 files)
npm run test:e2e       # Playwright E2E suite
npm run build          # Production build
```

## Git Workflow — Feature Branches + Staging

**Nie direkt auf `main` pushen.** Main ist geschützt via Branch Protection mit required checks.

```bash
# 1. Feature Branch erstellen
git checkout -b feature/my-feature

# 2. Arbeiten, committen
git add <files>
git commit -m "feat: description"

# 3. Pushen → Vercel erstellt automatisch Preview URL (= Staging)
git push -u origin feature/my-feature
# → Preview: innis-git-feature-my-feature.vercel.app

# 4. Testen auf Preview URL

# 5. PR erstellen → CI prüft automatisch → mergen
gh pr create --title "feat: my feature" --body "..."
```

### Vercel Preview = Staging

Jeder Feature Branch bekommt automatisch eine eigene Preview URL von Vercel.
Das ist dein Staging Environment — keine extra Infrastruktur nötig.

| Branch | URL | Zweck |
|--------|-----|-------|
| `main` | Production URL | Live für User |
| `feature/*` | `innis-git-feature-*.vercel.app` | Testen vor Merge |

## Pre-commit Hooks

Laufen automatisch bei jedem `git commit`:

1. TypeScript check (`tsc --noEmit`)
2. ESLint + Prettier (`lint-staged`)
3. Unit Tests (`vitest run tests/unit`)

Wenn einer der Schritte fehlschlägt, wird der Commit blockiert.

## CI/CD Pipeline (GitHub Actions)

Läuft automatisch bei jedem Push / PR:

```
Push/PR
  ├── Quality Checks (immer)
  │   ├── TypeScript check
  │   ├── ESLint
  │   ├── Unit Tests (vitest)
  │   ├── Tenant Isolation Check
  │   ├── AI Eval Suite
  │   └── Production Build
  │
  └── E2E Blocker Suite (nach Quality, nur bei relevanten Änderungen)
      ├── Seed Blocker Account
      ├── Playwright Blocker Tests (seriell)
      └── Upload Artifacts
```

**Required Checks für Merge in `main`:** Quality Checks + E2E Blocker Suite.

## Testing

### Test-Typen

| Typ | Befehl | Wann |
|-----|--------|------|
| Unit | `npm run test:unit` | Jeder Commit (Pre-commit Hook) |
| Evals | `npm run test:evals` | CI Pipeline |
| E2E Blocker | `npm run test:e2e:blocker` | CI Pipeline |
| E2E Full | `npm run test:e2e` | Manuell |
| Coverage | `npm run test:coverage` | Manuell |
| Tenant Isolation | `npm run test:tenant-isolation` | CI Pipeline |

### Test-Struktur

```
tests/
├── unit/                    # Vitest (jsdom)
│   ├── api/                 # API Route Tests (mocked auth/db)
│   ├── *.test.ts            # Pure function / logic tests
│   └── *.test.tsx           # Component tests
├── evals/                   # AI guardrail eval tests
└── e2e/                     # Playwright browser tests
    └── blocker/             # Critical path E2E tests
```

### Was testen?

**Immer testen:**
- Pure functions in `lib/` (Scoring, Parsing, Berechnung)
- API Route Handler (Auth, Validation, Response Format)
- Kritische User Flows (E2E)

**Nicht testen:**
- Styling / CSS
- Third-party Libraries
- Triviale Getter/Setter

### Test schreiben

```typescript
// tests/unit/my-feature.test.ts
import { describe, expect, it } from 'vitest';
import { myFunction } from '@/lib/my-feature';

describe('myFunction', () => {
  it('handles happy path', () => {
    const result = myFunction({ input: 'valid' });
    expect(result.score).toBe(100);
  });

  it('returns fallback for empty input', () => {
    const result = myFunction({ input: '' });
    expect(result.score).toBe(0);
  });
});
```

### API Route Test Pattern

```typescript
// tests/unit/api/my-route.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// 1. Mock auth + dependencies
vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));
vi.mock('@/lib/api/rateLimit', () => ({
  consumeRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  applyRateLimitHeaders: vi.fn((response) => response),
  readForwardedIpFromRequest: vi.fn().mockReturnValue('127.0.0.1'),
}));

// 2. Import after mocks
import { requireApiAuth } from '@/lib/api/auth';
import { GET } from '@/app/api/my-route/route';

describe('GET /api/my-route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireApiAuth).mockResolvedValueOnce({
      user: null,
      errorResponse: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    } as any);

    const response = await GET(new NextRequest('http://localhost:3000/api/my-route'));
    expect(response.status).toBe(401);
  });
});
```

## Architecture Rules

### Layer Ownership

```
UI (components/, pages)          → how things look
API Routes (app/api/)            → validate + respond
Logic (lib/)                     → business rules + calculations
Data Layer (lib/supabase/)       → DB queries only
```

Logik gehört in `lib/`, nie in Components oder API Routes.

### Auth Pattern

```typescript
// API Route — immer requireApiAuth()
export async function GET() {
  const { user, errorResponse } = await requireApiAuth();
  if (errorResponse) return errorResponse;
  // ... user.id ist jetzt sicher verfügbar
}
```

### Supabase Client

- **API Routes / Server:** `createClient()` aus `lib/auth/server.ts` (request-scoped)
- **Cron / Admin:** `createAdminClient()` aus `lib/auth/admin.ts`
- **Nie:** `lib/supabase/client.ts` in API Routes (kein Cookie-Scope → RLS-Fehler)

## Commit Messages

```
<type>: <kurze Beschreibung>

<Details / Begründung>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Types:** `feat` | `fix` | `refactor` | `test` | `docs` | `chore` | `perf`

## Environment Variables

Definiert und validiert in `lib/env.ts` via Zod.

| Variable | Required | Zweck |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Ja | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ja | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Nein | Admin/Cron Operations |
| `ANTHROPIC_API_KEY` | Nein | LLM Features (Career Radar) |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Nein | Live Job Search |
| `CRON_SECRET` | Prod: Ja | Cron Route Auth |
| `GOOGLE_CLIENT_ID/SECRET` | Nein | Calendar Integration |

## Quality Checklist

Vor jedem Merge in main:

- [ ] TypeScript check clean (`npm run type-check`)
- [ ] Lint clean (`npm run lint`)
- [ ] Unit Tests grün (`npm run test:unit`)
- [ ] Preview URL getestet (bei UI-Änderungen: Screenshot/Browser-Check)
- [ ] Keine `any` Types, keine `@ts-ignore`
- [ ] API Routes haben `requireApiAuth()` + Rate Limiting
- [ ] Neue DB-Queries filtern auf `user_id`
