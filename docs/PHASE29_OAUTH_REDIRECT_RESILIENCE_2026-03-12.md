# Phase 29 — OAuth Redirect Resilience Follow-up (2026-03-12)

Status: Implemented  
Scope: Google OAuth Redirect-Mismatch Risiko weiter reduziert und Calendar-Diagnose präzisiert.

## Ziel

1. `redirect_uri_mismatch` durch stale/abweichende Env-Origins im Alltag robuster vermeiden.
2. Token-Exchange stabil halten, indem Callback auf exakt denselben Redirect-Wert wie im Consent-Start zurückgreift.
3. Misconfiguration in der Calendar-UI klar sichtbar machen (ohne externe Debug-Session).

## Umsetzung

### 1) Redirect-Resolver mit Prioritätsmodi erweitert

Datei: `lib/google/oauth.ts`

Neu:
- `preferRequestOrigin?: boolean`
- `preferCookie?: boolean`

Effekt:
- Start-Route kann die aktive App-Origin priorisieren (weniger Risiko bei veralteter `GOOGLE_REDIRECT_URI`).
- Callback kann den im OAuth-Start gesetzten Cookie-Wert priorisieren (stabiler Code-Exchange).

### 2) OAuth Start/Callback konsistent verdrahtet

Dateien:
- `app/api/auth/google/route.ts`
- `app/api/auth/google/callback/route.ts`

Änderung:
- Start (`/api/auth/google`): Resolver mit `preferRequestOrigin: true`
- Callback (`/api/auth/google/callback`): Resolver mit `preferCookie: true`

### 3) Redirect-Diagnose erweitert

Datei: `app/api/auth/google/redirect-uri/route.ts`

Neu im Response:
- `configuredRedirectUri`
- `configuredOrigin`
- `configuredMatchesRequestOrigin`

Damit kann die UI explizit anzeigen, wenn Env-Origin und aktive Origin auseinanderlaufen.

### 4) Calendar-Auth UX präzisiert

Datei: `app/(dashboard)/calendar/page.tsx`

Neu:
- OAuth-Fehlertexte über `parseOAuthCallbackParams()` (gleiches Verhalten wie `/today`)
- Badge + Warntext bei `env origin mismatch`
- konkrete Fehlersicht statt generischer Auth-Fehlermeldung

## Tests / Verifikation

Ausgeführt:
- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run test -- --run tests/unit/google-oauth-redirect.test.ts tests/unit/oauth-callback-notifications.test.ts` ✅
- `npm run test -- --run tests/unit/api/calendar.test.ts` ✅
- `npm run test -- --run tests/integration/Dashboard.test.tsx` ✅
- `npm run build` ✅

Ergänzte Unit-Cases:
- `preferRequestOrigin` priorisiert aktive Origin.
- `preferCookie` priorisiert OAuth-Start-Cookie für Callback-Exchange.

## GO / NO-GO

**GO**  
Keine offenen P0/P1 im Scope. Änderungen sind minimal-risk, testabgedeckt und build-validiert.

