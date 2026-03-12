# Phase 28 — Midnight Perf + OAuth Hardening (2026-03-12)

Status: Implemented  
Scope: `/today` first-load performance reduction + Google OAuth configuration reliability improvements.

## Ziele

1. `/today` schneller interaktiv machen (weniger Initial-Bundle auf dem Hotpath).
2. Google-Calendar OAuth robuster machen und `redirect_uri_mismatch` operativ entschärfen.
3. Fehlermeldungen für OAuth so präzisieren, dass Setup-Fehler ohne Debug-Sessions lösbar sind.

## Umsetzung

### 1) `/today` Hotpath gesplittet (Code-Splitting)

Datei: `app/(dashboard)/today/page.tsx`

Umgestellt auf `next/dynamic` (`ssr: false`) für nicht-kritische Widgets:
- `ScheduleColumn`
- `PomodoroTimer`
- `QuickActionsWidget`
- `StudyProgress`
- `WeekOverview`
- `UpcomingDeadlines`

Zusätzlich:
- kompakter Widget-Skeleton-Fallback für smoothes Nachladen.

Ergebnis (Build-Vergleich):
- `/today` Route Size: **24.5 kB → 18.7 kB**
- `/today` First Load JS: **212 kB → 187 kB**

### 2) OAuth-Redirect-Diagnose-Endpoint ergänzt

Neue Datei: `app/api/auth/google/redirect-uri/route.ts`

Neu:
- liefert die aktuell vom System genutzte Redirect URI zurück:
  - `redirectUri`
  - `source` (`configured|site_url|request_origin|cookie|fallback`)
  - `normalized`
  - `requestOrigin`
- nutzt private SWR-Policy + API Trace Headers.

Nutzen:
- exakte URI kann direkt in Google Cloud OAuth Client übernommen werden,
- reduziert Setup-Drift und Trial-and-Error bei Redirect-Mismatch.

### 3) Calendar-UI: self-service OAuth Setup Hint

Datei: `app/(dashboard)/calendar/page.tsx`

Neu im Not-Connected-State:
- Anzeige der exakten OAuth Redirect URI (vom neuen Endpoint)
- `Copy URI` Button
- Anzeige von `source` + `normalized` Flag

Nutzen:
- Setup-Schritt ist in der App sichtbar statt nur über externe Doku.

### 4) OAuth-Error Mapping verbessert

Dateien:
- `app/api/auth/google/callback/route.ts`
- `lib/hooks/useNotifications.ts`

Neu:
- Token-Exchange Fehler werden differenziert gemappt:
  - `redirect_uri_mismatch`
  - `invalid_grant`
  - fallback `token_exchange_failed`
- `oauth_source` wird bei Fehlern mitgegeben.
- Nutzertexte im Frontend präzisiert (deutsch, handlungsorientiert).

### 5) Tests ergänzt

Neue Datei:
- `tests/unit/oauth-callback-notifications.test.ts`

Abdeckung:
- `redirect_uri_mismatch` inkl. `oauth_source`
- `success=connected`
- leerer Callback-Query-State

## Verifikation

Ausgeführt:
- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run test -- --run tests/unit/google-oauth-redirect.test.ts tests/unit/oauth-callback-notifications.test.ts` ✅
- `npm run build` ✅

## Findings (P0/P1/P2)

- P0: keine
- P1: keine
- P2: keine funktionalen; visuelles Skeleton-Tuning bleibt optional

## GO / NO-GO

**GO** für Merge/Deploy.

Begründung:
- Performance auf `/today` messbar verbessert.
- OAuth-Setup-Drift operativ entschärft.
- Fehlerdiagnose und Selbsthilfe in der UI vorhanden.
- Alle relevanten Checks grün.
