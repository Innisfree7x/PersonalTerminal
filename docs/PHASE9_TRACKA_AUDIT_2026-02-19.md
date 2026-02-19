# PHASE 9 Track A Audit — 2026-02-19

## Scope
- API/Auth/Guard Audit
- Security-Hardening für OAuth + sensitive API routes
- Legal/Trust Konsistenzcheck
- Review der parallelen Claude-Änderungen auf Regressionen

## Ergebnis (Kurz)
- **Blocker:** 0
- **Kritische Findings gefixt:** 2
- **Niedrige Findings offen:** 1

## Gefixte Findings

### 1) OAuth-Flow war nicht an Session + CSRF-state gebunden
- Risiko: Callback konnte ohne robuste state/session-Bindung verarbeitet werden.
- Fix:
  - `app/api/auth/google/route.ts`
    - `requireApiAuth()` verpflichtend
    - `state`-Token erstellt und als httpOnly Cookie gesetzt
  - `app/api/auth/google/callback/route.ts`
    - `requireApiAuth()` verpflichtend
    - `state` gegen Cookie + `user.id` validiert
    - state-cookie cleanup auf success/error
  - `app/api/auth/google/disconnect/route.ts`
    - `requireApiAuth()` verpflichtend

### 2) Sensitive Calendar/Debug endpoints unzureichend gehärtet
- Risiko: Calendar-Routen ohne explizite API-Auth; Debug endpoint in Prod erreichbar.
- Fix:
  - `app/api/calendar/today/route.ts` und `app/api/calendar/week/route.ts`
    - `requireApiAuth()` ergänzt
    - `Cache-Control: no-store` für sensible Antworten
  - `app/api/debug/route.ts`
    - in Production -> `404`
    - sonst nur für Admin via `requireApiAdmin()`

### 3) Legal/Trust Inkonsistenz
- Risiko: Privacy-Seite verwies auf Impressum/Footer-Email, aber keine konkrete Kontaktangabe vorhanden.
- Fix:
  - `app/(marketing)/privacy/page.tsx`
    - Verantwortlicher + Kontaktadresse konkretisiert
  - `components/features/marketing/MarketingFooter.tsx`
    - Kontakt-Mail sichtbar ergänzt

## Claude-Review (parallele Änderungen)

Geprüfte Bereiche:
- Empty-State/Copy-Änderungen in
  - `app/(dashboard)/today/page.tsx`
  - `app/(dashboard)/goals/page.tsx`
  - `app/(dashboard)/university/page.tsx`
  - `components/features/goals/GoalsList.tsx`
  - `components/features/career/CareerBoard.tsx`
  - `components/features/career/CvUpload.tsx`
  - `components/features/dashboard/*`
  - `components/shared/ErrorBoundary.tsx`

Bewertung:
- Keine funktionalen Blocker entdeckt.
- Änderungen sind überwiegend UX/Copy-Verbesserungen mit konsistenten Error-Messages.
- Confirm-Delete in Career ist korrekt integriert (`ConfirmModal` statt `confirm()`).

## Offene Low-Priority Items

1. Duplicate empty-state logic für Goals:
- `GoalsList` enthält jetzt eigenes Empty-State Rendering.
- `app/(dashboard)/goals/page.tsx` hat zusätzlich einen separaten Empty-State-Branch.
- Kein Bug, aber redundant; optional in Track-B Cleanup konsolidieren.

## Verifikation
- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run build` ✅

