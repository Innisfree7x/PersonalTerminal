# Error Monitoring + Multi-Tenant Isolation (2026-03-07)

## 1) Error Monitoring: current state

### Neu umgesetzt
- Runtime errors werden jetzt **persistent** in `public.ops_error_events` gespeichert (best-effort, server-side).
- Optionaler Sentry-Transport über `SENTRY_DSN` ist integriert (DSN-envelope Ingest).
- Ops-Health zeigt zusätzlich ein 24h-Snapshot der persistenten Fehler:
  - Total
  - Critical/Error/Warning Counts
  - Top-Fehlermeldungen

### Warum das wichtig ist
- Vorher war Incident-Storage in-memory (nach Restart leer).
- Jetzt bleiben echte User-Fehler für Analyse und Incident-Review erhalten.

### Voraussetzungen
- SQL-Migration ausführen:
  - `docs/migrations/2026-03-07_ops_error_events.sql`
- Optional Sentry:
  - `SENTRY_DSN` in Env setzen

## 2) Multi-User Isolation: verification state

### Bereits vorhanden
- RLS auf Kern-Tabellen aktiv.
- API-Routen scopen Mutationen mit `user_id`.
- Unit-Test-Suite deckt tenant-scoped ID-Routen bereits ab (`tests/unit/api/tenant-isolation.test.ts`).

### Neu umgesetzt
- Echte Zwei-Account-Verifikation per Script:
  - `scripts/qa-tenant-isolation-check.ts`
  - prüft, dass Tenant A keine Rows von Tenant B lesen kann (`daily_tasks`, `trajectory_goals`)
  - prüft gleichzeitig, dass A eigene Daten lesen kann

### Runbook
```bash
export NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
export TENANT_A_EMAIL="<email-a>"
export TENANT_A_PASSWORD="<password-a>"
export TENANT_B_EMAIL="<email-b>"
export TENANT_B_PASSWORD="<password-b>"

npm run test:tenant-isolation
```

## 3) Release Gate Empfehlung
- Block release wenn einer der folgenden Punkte fehlschlägt:
  1. `npm run type-check`
  2. `npm run lint`
  3. `npm run test -- --run tests/unit/api/tenant-isolation.test.ts`
  4. `npm run test:tenant-isolation` (nur wenn Tenant A/B Secrets gesetzt sind)

