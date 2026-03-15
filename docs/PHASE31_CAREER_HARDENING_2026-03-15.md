# Phase 31 - Career Hardening (2026-03-15)

Status: Delivered
Owner: Core

## Ziel
Career-Intelligence Flows gegen Abuse, Kosten-Spikes und Duplicate-Actions haerten, ohne den bestehenden UX-Flow zu brechen.

## Geliefert

### 1) API Rate Limits (serverseitig)
- `POST /api/cv/upload` -> `8/min`
- `POST /api/cv/extract` -> `15/min`
- `POST /api/cv/analyze` -> `10/min`
- `GET /api/career/opportunities` -> `30/min`
- `POST /api/career/opportunities/gap-task` -> `12/min`

Implementierung:
- `lib/api/rateLimit.ts`
- Route-Integrationen in den oben genannten Endpunkten
- Responses setzen `X-RateLimit-Remaining` und bei Block `Retry-After`

Hinweis:
- In Test-Laeufen sind Limits deaktiviert (`NODE_ENV=test` oder `DISABLE_RATE_LIMITS=true`), damit Unit-Tests deterministisch bleiben.

### 2) CV Upload Robustheit
- `app/api/cv/upload/route.ts` nutzt `createAdminClient()` fuer Storage-Write.
- Upload-Pfad ist strikt user-scoped: `{user_id}/cv/{timestamp}_{sanitizedName}`.
- Auth bleibt verpflichtend ueber `requireApiAuth()`.

### 3) LLM Budget Guard + Usage Logging
- Neue Budget-Logik in `lib/career/llmUsage.ts`:
  - `getCareerLlmBudgetSnapshot(userId, maxDailyUnits)`
  - `recordCareerLlmUsage(userId, units)`
- `GET /api/career/opportunities`:
  - liest Tagesbudget,
  - begrenzt Enrichment per Request,
  - schreibt Verbrauch in `llm_usage_logs`.
- API-Meta liefert LLM-Budgetzustand zur UI (`enabled`, `used`, `remaining`, `enrichedThisRequest`).

### 4) Gap -> Today Task Bridge
- Neuer Endpoint: `POST /api/career/opportunities/gap-task`
- Zweck: identifizierte Radar-Gaps direkt als Today-Task committen.
- Dedupe: gleicher Titel + gleiches Datum erzeugt keinen Duplikat-Task.
- Opportunity Radar hat dafuer eine direkte CTA pro Karte.

## Datenbank

Migration-Datei:
- `docs/migrations/2026-03-15_phase31_llm_usage_logs.sql`

Enthaelt:
- Tabelle `public.llm_usage_logs`
- Index `(user_id, usage_date, route)`
- RLS + Policies (read/insert/update/delete nur eigener `user_id`)

## Verifikation

Lokal gruen:
- `npm run type-check`
- `npm run lint`
- `npm run build`
- `npm run test -- --run tests/unit/api/cv-upload.test.ts tests/unit/api/cv-extract.test.ts tests/unit/api/cv-analyze.test.ts tests/unit/api/career-opportunities.test.ts tests/unit/api/career-gap-task.test.ts tests/unit/career-opportunity-radar.test.ts tests/unit/career-target-firms.test.ts`

## Ops-Checkliste

1. Supabase SQL Migration ausfuehren (`llm_usage_logs`).
2. Env-Variablen fuer Produktionsbudget setzen:
   - `CAREER_LLM_DAILY_LIMIT` (default 50)
   - `CAREER_LLM_MAX_PER_REQUEST` (default 5)
3. Monitoring:
   - 429-Rate auf Career/CV Endpunkten beobachten
   - taeglichen LLM-Verbrauch pro User monitoren

## Bekannte Restpunkte

- Rate-Limit Store ist in-memory (pro Instanz). Fuer verteilte harte Limits spaeter Redis/Upstash nutzen.
- Wenn `llm_usage_logs` fehlt, faellt Budget-Guard absichtlich auf `enabled=false` zurueck (degradiert, aber kein Hard-Fail).
