> **Status: Archived (Historical).**
> This document is kept for historical traceability and is **not** the active execution source anymore.
> Use docs/PHASE12_MASTERPLAN.md and docs/CONTEXT_CANON.md as canonical context.

# Phase 10.1 — Implementation Plan (Duo)

Stand: 2026-02-20
Scope: Analytics-Härtung + Demo-ID-Persistenz + Go/No-Go-Messbarkeit

## Ziel
Phase 10.1 bringt die bereits definierten KPIs (Onboarding Completion, First-Value, Day-2-Return) in einen technisch robusten Zustand, sodass echte Go/No-Go-Entscheidungen auf belastbaren Daten basieren.

## Aktueller Stand (vor Start)
- Activation-Basis aus Phase 9/10 ist live (Onboarding + Empty States + Narrative).
- Metrics-Spec ist vorhanden: `docs/PHASE10_1_METRICS_SPEC.md`.
- Offener Kern: belastbare Mess-Pipeline + Persistenz + Dashboard-Ops.

## Nicht-Ziel
- Kein Billing
- Kein großer UI-Redesign-Block
- Kein Data Warehouse/BI-Stack

## Workstream-Aufteilung (Duo)

### Codex Track (Engineering / Backend / Reliability)
1. Analytics Provider Layer einführen
- `lib/analytics/provider.ts` als zentrale Schnittstelle
- Fallback: Vercel-only
- Optional: PostHog-Aktivierung via Env (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`)

2. Event-Pipeline vereinheitlichen
- `/api/analytics/event` validiert + forwarded an Provider
- Einheitliches Event-Mapping für:
  - `signup_started`, `signup_completed`
  - `onboarding_started`, `onboarding_step_completed`, `onboarding_completed`
  - `first_task_created`, `first_course_created`
  - `demo_seed_started`, `demo_seed_removed`
  - `day2_return`

3. Demo-ID-Persistenz von localStorage nach `user_metadata`
- `demo_data_ids` in `auth.user_metadata` lesen/schreiben
- localStorage als Fallback (abwärtskompatibel)
- Remove-Flow löscht aus Metadata + local fallback

4. Guardrails + Tests
- Unit/Integration für Event-Validation und Demo-ID-Utilities
- E2E-Sanity: Seed -> Reload -> Remove funktioniert weiterhin

### Claude Track (Product Analytics / Ops / Copy QA)
1. KPI-Dashboard-Konfiguration finalisieren
- Vercel-Dashboard Views aus `PHASE10_1_METRICS_SPEC.md` konkret anlegen

2. Metrik-Review-Template operationalisieren
- Wöchentlicher Rhythmus (Owner, Zeitpunkt, Exportformat)

3. Naming/Taxonomy QA
- Prüfen, dass Eventnamen/Payloads in Docs exakt dem Code entsprechen

4. Copy/Legal QA
- Privacy/Settings/Onboarding-Claims konsistent halten

## Reihenfolge (empfohlen)
1. Codex: Provider Layer + API Forwarding
2. Codex: Demo-ID Metadata Persistenz
3. Codex: Tests/Hardening
4. Claude: Dashboard + KPI Ops Review
5. Gemeinsamer Go/No-Go Readout

## Konkrete Aufteilung (jetzt)
### Codex (umsetzen)
1. `lib/analytics/provider.ts` + serverseitiges Forwarding in `/api/analytics/event`
2. Strikte Event-Whitelist + Payload-Validation (400 bei Invalid)
3. `demo_data_ids` Persistenz in `auth.user_metadata` (+ local fallback nur legacy)
4. QA: Unit/Integration + E2E Seed/Reload/Remove
5. Final Audit-Query + kurze Ops-Notiz in Runbook

### Claude (parallel)
1. Vercel Dashboard Views aus Metrics-Spec anlegen/abgleichen
2. Weekly KPI Review Template als operativen Ablauf schärfen (Owner + Zeit + Export)
3. Naming QA: Eventnamen und Property Keys 1:1 gegen Code prüfen
4. Final Copy/Legal QA (Privacy/Settings konsistent mit realem Tracking)

## Parallelisierung ohne Kollision
- Codex ändert primär: `lib/analytics/*`, `app/api/analytics/event/route.ts`, Demo-Seed-Service + Tests
- Claude ändert primär: Docs/Ops-Playbooks und Dashboard-Konfiguration
- Gemeinsame Grenze: Eventnamen dürfen nach MP1 nicht mehr umbenannt werden

## Claude Prompt (ready-to-use)
```text
Arbeite nur auf dem Claude-Track von docs/PHASE10_1_IMPLEMENTATION.md.

Scope:
1) Richte die Vercel-Views exakt nach docs/PHASE10_1_METRICS_SPEC.md ein bzw. validiere sie.
2) Erzeuge/aktualisiere eine kurze KPI-Review-Operating-Section (Owner, Rhythmus, Exportformat, Entscheidungslogik).
3) Prüfe Event-Naming und Properties gegen den aktuellen Code-Contract, dokumentiere nur echte Abweichungen.
4) Mache ein finales Copy/Legal-QA für Privacy/Settings/Onboarding Claims.

Wichtig:
- Keine Änderungen an Analytics-Eventnamen ohne Rücksprache.
- Keine Backend-Code-Änderungen im Codex-Scope.
- Am Ende: kompakter Report mit "Done / Open / Risks / Handoff an Codex".
```

## Merge-Punkte
- MP1: Nach Provider-Layer (Code freeze auf Eventnamen)
- MP2: Nach Demo-ID Migration (Seed/Remove erfolgreich)
- MP3: Nach Dashboard-Setup (erste echte Woche messbar)

## Definition of Done (Phase 10.1)
1. Alle Funnel-Events laufen über eine zentrale Provider-Schnittstelle.
2. `/api/analytics/event` akzeptiert nur definierte Payloads und verwirft invaliden Input mit 400.
3. Demo-Seed IDs liegen nicht nur in localStorage, sondern in `user_metadata.demo_data_ids`.
4. Seed/Remove funktioniert nach Reload weiterhin zuverlässig.
5. KPI-Views sind in Vercel angelegt und dokumentiert.
6. Privacy-Claim ist konsistent mit tatsächlichem Tracking-Verhalten.

## Risks
- Doppeltes Event-Firing durch paralleles Client + API Tracking
- Stale localStorage IDs bei früheren Accounts
- Fehlende env vars für optionalen PostHog-Pfad

## Mitigation
- Single-source track helper + dedupe-Regel
- Metadata zuerst lesen, localStorage nur fallback
- Runtime-Checks + klare Warnlogs (kein Hard-Crash)

## Go/No-Go für Start von 10.1
- Ja: Plan ist klein genug, klar getrennt, parallelisierbar.
- Empfehlung: Sofort starten, zuerst Codex MP1 in einem separaten Commit-Block.
