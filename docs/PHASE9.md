# PHASE 9 — Launch Readiness (ohne Billing, Duo-balanced)

## Ziel
INNIS von "starkes Projekt" zu "verlässlich launchbares Produkt" bringen, ohne Stripe/Payments in dieser Phase.

## Scope
- In Scope:
  - Legal/Trust finalisieren
  - Product-Hardening (Stabilität, Fehlerpfade, Security-Guards)
  - Onboarding/Activation verbessern
  - Performance + UX-Polish für reale Nutzung
  - Go-Live Runbook und Release-Checks final
- Out of Scope:
  - Stripe/Billing, Plan-Enforcement, Subscription Lifecycle

## Tracks (parallel)

### Track A (Codex) — P0 Security & Reliability
1. Legal & Trust
- Privacy/Terms auf aktuellen Feature-Stand bringen
- Kontakt/Impressum-Entscheidung dokumentieren (zielmarktabhängig)
- Account-Lifecycle klar dokumentieren (Reset, Löschung, Datenbezug)

2. Security & Isolation Verification
- Finaler RLS-Audit (owner-only, keine offenen Legacy-Policies)
- API-Guard-Check aller write-Routen (auth + user scoping)
- Basis-Header/Hardening prüfen (no-store auf sensiblen Endpoints, sichere Defaults)

3. Reliability Baseline
- Kritische Error-States mit Retry-Fallbacks
- Monitoring-Inzidentenpfad getestet (Error -> ingest -> sichtbar)
- Ops Health Page auf "actionable" trimmen (keine toten Widgets)

4. Release Gate
- `type-check`, `lint`, `build` grün
- Smoke-Test auf Production-URL für Kernrouten
- Go-Live-Checklist vollständig durchlaufbar

### Track B (Claude) — P0 Activation & First-User Experience
1. Empty States (alle Kernseiten)
- Jede Seite beantwortet: "Was ist mein erster sinnvoller Schritt?"
- Klare CTA pro Empty State (keine toten Enden)
- Tonalität: konkret, ruhig, handlungsorientiert

2. Onboarding Activation
- "2-Minuten-Aha"-Flow schärfen (klarer First-Win)
- Demo-/Starter-Daten verbessern
- Übergang nach Onboarding in echte Nutzung verstärken

3. Error-Kommunikation
- Einheitliche, hilfreiche Fehlermeldungen statt generischem "Something went wrong"
- Jede Fehlermeldung mit nächster Aktion (`Retry`, `Back`, `Contact`)
- Konsistente Sprachregeln über Auth, Onboarding, Dashboard

4. Marketing -> App Narrative
- Landing-Story und Onboarding-Story aufeinander abstimmen
- Konsistente Value Proposition von Hero bis erstem Task

### P1 — Nice-to-have vor Launch
1. UX Consistency
- Einheitliche Loading/Skeleton/Empty/Error Patterns
- CTA-Copy auf Conversion + Klarheit prüfen
- Mobile-Navigation und Form-Flows feinschleifen

2. Performance Pass (nur gezielt)
- Nur bei konkret beobachteten langsamen Seiten messen/fixen
- Kein breiter LCP/CLS-Optimierungsblock ohne Befund

## Duo Split (Codex + Claude, verbindlich)

### Codex (Track A)
- Security/RLS/API-Audits + Hardening
- Monitoring/Alerting/Reliability-Pfade
- Release-Checks, QA-Automation, Go-Live Runbook
- Support für Claude bei technischen Error-State-Integrationen

### Claude (Track B)
- Onboarding-Texte, Empty States, Aktivierungs-Copy
- Error-Kommunikation und UX-Konsistenz in kritischen Flows
- Marketing -> App Narrative-Konsistenz
- visuelle Politur mit Fokus auf Klarheit statt Effektlast

## Deliverables (Phase 9)
1. Aktualisierte Legal-Seiten + konsistente Product-Copy
2. Security/RLS Final-Audit-Protokoll
3. Reliability-Checklist + Incident-Flow verifiziert
4. Onboarding-/Empty-State-Activation-Paket
5. Einheitliche Error-Kommunikation in Kernflows
6. Finales Go-Live-Dokument mit klaren Gates + Merge-Protokoll Track A/B

## Definition of Done
- Keine kritischen Security-/Isolation-Gaps offen
- Kernflows stabil unter normalen Fehlerbedingungen
- Onboarding + Empty States führen zuverlässig in den ersten Produktnutzen
- Marketing -> Signup -> App Journey ist klar und messbar
- Release-Gates sind reproduzierbar und grün

## Merge Point (wichtig)
- Track A und Track B laufen parallel.
- Merge in `Go-Live Gate` erst wenn:
  - Track A: Security/Reliability grün
  - Track B: Activation/Empty States/Error-Kommunikation grün

## Startreihenfolge (empfohlen)
1. Parallelstart: Track A + Track B
2. Gemeinsamer Review-Sweep über Kernflows
3. Final Go-Live Gate Run
