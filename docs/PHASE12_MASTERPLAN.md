# PHASE 12 MASTERPLAN (Canonical)

Stand: 2026-02-24  
Status: Active  
Owner: Engineering (Codex + Claude)

## 0) Zweck
Phase 12 ist die operative Skalierungsphase nach den Build-Phasen 4-11.  
Ziel ist nicht "mehr Features", sondern ein belastbarer Produktkern mit klaren Metriken, stabilen Release-Gates und messbarer Nutzerwirkung.

## 1) Ausgangslage
- Phase 4-11 Deliverables sind technisch geliefert und als historische Referenz archiviert.
- Track 6 Baseline ist live (Flow-Metriken, Ops-Snapshot, Blocker-Härtung, Flake-Gate).
- Command Intent Engine v1 ist live (Parser + Preview + Executor-Basis).
- Weekly Review v1 (rule-based) ist integriert.

## 2) Phase-12 Nordstern
- Reliability zuerst, dann Wachstum.
- Jede P0-Arbeit muss ein messbares Qualitäts- oder Aktivierungsziel verbessern.
- Kein neuer "großer" Scope ohne harte KPI-Definition und Kill-Kriterium.

## 3) P0 Workstreams (verbindlich)

### P0.1 Reliability Operations
Ziel: Produktivbetrieb mit Incident-Disziplin.

Deliverables:
- Burn-rate Alerts auf `ops_flow_metrics` (login, create_task, toggle_exercise, today_load)
- Incident-Runbook pro kritischem Flow
- Ops-Review-Rhythmus (wöchentlich) mit klarer Ownership

DoD:
- Alerting-Regeln dokumentiert und getestet
- On-call Runbook für jede kritische Störung vorhanden
- Keine "silent failure" Pfade in kritischen APIs

### P0.2 Command OS v2 (Safety + Undo)
Ziel: Command Palette wird zu verlässlichem Action-Layer.

Deliverables:
- Executor-Guards (idempotent / confirm-gated)
- Undo-Mechanik für sichere Actions (mind. create-task, create-goal)
- Parser/Executor Integrationstests

DoD:
- Keine destructive Action ohne Confirm-Step
- Duplicate execute nicht möglich (idempotent keys / guard)
- Integrationstests grün

### P0.3 Weekly Review v2 (Hybrid)
Ziel: Reviews liefern konkrete nächste Schritte statt nur Zusammenfassung.

Deliverables:
- Stabile Datenaggregation (rule-based)
- Optionaler AI-Textlayer mit Budget-Cap + deterministischem Fallback
- Tracking: "recommendation adopted" Event

DoD:
- Drei definierte Datenlagen korrekt abgedeckt
- Bei AI-Ausfall bleibt Review vollständig nutzbar
- Empfehlungstexte nicht generisch

### P0.4 KPI Operating System
Ziel: Entscheidungen aus belastbaren Metriken.

Verbindliche KPIs:
- Onboarding Completion >= 60%
- First-Value Completion >= 50%
- Day-2 Return stabil steigend
- Blocker E2E Gate grün (bei gesetzten Secrets)
- P1 Incident/Woche = 0

DoD:
- KPI-Dashboard dokumentiert
- Wöchentlicher KPI-Review fix terminiert
- Jede P0-Änderung hat vor/nach-Messung

## 4) P1 Workstreams (nach P0-Stabilität)

### P1.1 Personalization Engine
- Adaptive Priorisierung für Next-Best-Action
- Ziel: höhere tägliche Completion, niedrigerer Overdue-Backlog

### P1.2 Lucian 3.0 (Retention-Layer)
- Streak/Quest Loop, adaptive Interventionen (nicht spammy)
- Ziel: D7 Retention + Focus-Minuten/User verbessern

### P1.3 Collaboration Light
- Shareable Weekly Snapshot / Accountability Buddy (read-only)
- Ziel: organisches Re-Engagement

## 5) Sprintstruktur (empfohlen)

Sprint A:
- P0.1 Reliability Ops
- P0.2 Command OS v2 Core

Sprint B:
- P0.3 Weekly Review v2
- P0.4 KPI Operating System

Sprint C:
- P1.1 Personalization Core
- P1.2 Lucian 3.0 Core

Sprint D:
- P1.3 Collaboration Light
- Hardening + Release Audit

## 6) Rollen (Duo Split)

Codex:
- Reliability, API/Action-Guards, CI-Gates, DB/Migrations, Tests, Runbooks

Claude:
- UI/UX Layer, Interaction Design, Copy, Weekly Review Presentation, Lucian Experience

## 7) Qualitäts-Gates
- Gate A: P0.1 + P0.2 abgeschlossen und verifiziert
- Gate B: P0.3 + P0.4 mit KPI-Review aktiv
- Gate C: P1-Rollout nur mit stabiler Error-Budget-Lage

## 8) Risiken + Gegenmaßnahmen
- Feature creep: max. 3 P0 Deliverables parallel
- Messblindheit: keine Änderung ohne KPI-Event
- AI-overreach: fallback-first Architektur
- Reliability drift: harte Release-Checkliste bleibt verpflichtend

## 9) Referenzdokumente
- `docs/CONTEXT_CANON.md`
- `docs/PHASE11_TRACK6_IMPLEMENTATION.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/GO_LIVE_RUNBOOK.md`
