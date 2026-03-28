---
name: supabase-patterns
description: Supabase Patterns für INNIS — Auth, RLS, Queries, API-Routes
globs:
  - "lib/supabase/**/*.ts"
  - "lib/auth/**/*.ts"
  - "lib/api/**/*.ts"
  - "app/api/**/*.ts"
  - "app/actions/**/*.ts"
---

# Supabase Patterns für INNIS

## Auth Client Auswahl

<important>
Falscher Client = RLS-Bypass oder Auth-Fehler. Immer den richtigen wählen:
</important>

| Kontext | Client | Import |
|---------|--------|--------|
| API Routes / Server Actions | `createClient()` | `lib/auth/server.ts` |
| Admin/Cron Jobs | `createAdminClient()` | `lib/auth/admin.ts` |
| Client Components | Browser-Client | `lib/supabase/client.ts` |

```typescript
// API Route — IMMER so:
import { createClient } from '@/lib/auth/server';

export async function GET() {
  const supabase = await createClient(); // Request-scoped, Cookie-basiert
  // ...
}
```

**Nie** `lib/supabase/client.ts` in API Routes verwenden — keine Request-Cookies, RLS bricht.

## API Route Protection

```typescript
import { requireApiAuth } from '@/lib/api/auth';

export async function GET(req: Request) {
  const { userId } = await requireApiAuth(req);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId); // Immer user_id filtern
}
```

### Protection Modes
| Typ | Helper | Wann |
|-----|--------|------|
| User APIs | `requireApiAuth()` | Standard für alle geschützten Endpoints |
| Admin APIs | `requireApiAdmin()` | Monitoring, Debug, Admin-Panels |
| Cron Jobs | `requireCronAuth()` | Bearer Token Auth für Cron |
| Public Ingress | Kein Auth | Analytics Events, Error Reporting |

## RLS Patterns

Alle User-Daten haben `user_id` Column + Owner-Only Policy:
```sql
-- Lesen: nur eigene Daten
CREATE POLICY "users read own" ON daily_tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Schreiben: nur eigene Daten
CREATE POLICY "users insert own" ON daily_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Naming Conventions

| Layer | Convention | Beispiel |
|-------|-----------|---------|
| DB Columns | `snake_case` | `user_id`, `created_at` |
| TypeScript Models | `camelCase` | `userId`, `createdAt` |
| Conversion | Helper-Funktionen | `supabaseTaskToTask()` |
| Dates | `YYYY-MM-DD` (date-only) | `'2026-03-28'` |
| Timestamps | ISO String | `'2026-03-28T12:00:00Z'` |

## Query Patterns

```typescript
// Richtig: Select nur was gebraucht wird
const { data } = await supabase
  .from('goals')
  .select('id, title, status, deadline')
  .eq('user_id', userId)
  .order('deadline', { ascending: true });

// Falsch: Select *
const { data } = await supabase
  .from('goals')
  .select('*');
```

## Error Handling in API Routes

```typescript
export async function POST(req: Request) {
  try {
    const { userId } = await requireApiAuth(req);
    const body = schema.parse(await req.json()); // Zod Validation
    // ... business logic
    return Response.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```
