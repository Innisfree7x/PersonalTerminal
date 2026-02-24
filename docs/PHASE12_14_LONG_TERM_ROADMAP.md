> **Status: Archived (Historical).**
> This document is kept for historical traceability and is **not** the active execution source anymore.
> Use docs/PHASE12_MASTERPLAN.md and docs/CONTEXT_CANON.md as canonical context.

# PHASE 12–14 LONG-TERM ROADMAP (INNIS)

Stand: 2026-02-21
Status: Archived planning snapshot — Phase 12 execution moved to docs/PHASE12_MASTERPLAN.md
Horizont: Nächste 3 Phasen nach 8–11 Stabilisierung

## Leitprinzip
INNIS soll von "starkes persönliches Tool" zu einem **verlässlichen, differenzierten Produkt** wachsen, ohne die Kernqualität (Speed, Klarheit, Fokus) zu verlieren.

## Strategische Leitlinien
1. **Reliability zuerst, Wachstum danach.**
2. **Activation-Metriken steuern Prioritäten**, nicht Feature-Impuls.
3. **Lucian bleibt Assistenz-Layer**, nicht Hauptprodukt.
4. **Jede Phase endet mit messbaren Go/No-Go-Kriterien.**

---

## PHASE 12 — Scale-Ready Core

### Ziel
Produkt für erste echte Nutzergruppe robust machen (Beta -> produktionsnahe Stabilität).

### Fokusbereiche
1. **Operational Reliability**
- Monitoring-Warnungen bereinigen (inkl. Dynamic-import Warnpfade).
- Incident-Playbook für Cron/API/Auth finalisieren.
- Alerts für harte Fehler (Auth, Cron, DB Writes, E2E blocker).

2. **Data & Migration Discipline**
- SQL-Migrations als versionierter Standardprozess (nicht mehr ad-hoc im Editor).
- Staging/Prod Migrations-Checkliste + Rollback-Strategie.

3. **Activation Instrumentation in Betrieb**
- KPI-Wochenrhythmus verbindlich (Onboarding Completion, First Value, Day2).
- Event-Qualität monitoren (duplikatfrei, konsistente Payloads).

4. **Core UX Closing Gaps**
- Letzte Friction-Punkte in Today/University/Career anhand echter Nutzung fixen.
- Error-Kommunikation auf kritischen Flows weiter vereinheitlichen.

### KPIs (Phase 12)
- Onboarding completion: `>= 60%`
- First-value completion: `>= 50%`
- Day-2 return: baseline + stabiler Trend
- Blocker-E2E in CI: `100% grün`
- P1 Incidents/Woche: `0`

### Duo Split
- **Codex:** Reliability, Migration-Prozess, Alerts, CI Gates, API/DB Qualität.
- **Claude:** Activation UX Iterationen, Copy-Microfixes, Empty-State-Qualität.

### Exit-Kriterien
- Kein kritischer Reliability-Blocker offen.
- KPI-Review über mindestens 2 Wochen mit konsistenten Daten.
- Reproduzierbarer Release-Prozess für häufige Deploys.

---

## PHASE 13 — Monetization & Growth Engine

### Ziel
Wachstum und Monetarisierung strukturieren, ohne Kernprodukt zu destabilisieren.

### Fokusbereiche
1. **Pricing & Packaging**
- Free vs Pro klar definieren (Limits + Value-Delta).
- In-App Upsell nur bei relevanten Triggern.

2. **Billing Foundations**
- Stripe Checkout + Webhooks + Subscription State.
- Entitlements-Layer (Feature Gates serverseitig).

3. **Growth Funnel**
- Landing/Signup A/B Iterationen auf Conversion-Ziele.
- Lifecycle-Emails (onboarding nudge, reactivation, weekly value digest).

4. **Retention Loops**
- Lucian-Mikrointerventionen nur datengetrieben (keine Spam-Rotation).
- Progress-Feedback Schleifen (weekly wins, milestone badges nur mit Sinn).

### KPIs (Phase 13)
- Visitor -> Signup: +X% (Baseline aus Phase 12)
- Signup -> First value: `>= 55%`
- Free -> Pro conversion: Zielwert nach Pricing-Test
- 4-week retention: klar messbar und steigend

### Duo Split
- **Codex:** Billing-Backend, entitlements, webhooks, conversion instrumentation.
- **Claude:** Pricing-Story, paywall copy, lifecycle messaging, growth page experiments.

### Exit-Kriterien
- Billing technisch stabil (keine Entitlement-Fehler).
- Mindestens 1 validierte Conversion-Verbesserung.
- Keine Verschlechterung der Produkt-Performance durch Monetization-Layer.

---

## PHASE 14 — Intelligent Product Layer

### Ziel
INNIS vom "Tracker" zu einem **proaktiven Execution-System** entwickeln.

### Fokusbereiche
1. **Decision Intelligence**
- Next-Best-Action 2.0 (nutzerindividuelle Priorisierung statt statischer Heuristik).
- Deadline-Risiko-Prognosen mit erklärbaren Signalen.

2. **Lucian Evolution (Produktiv, nicht gimmicky)**
- Kontextfenster über mehrere Tage (nicht nur Momenttrigger).
- Adaptive Hinweise nach Verhalten (weniger Wiederholungen, höhere Relevanz).
- Optionale "Coach Tone" Presets (strict / neutral / supportive).

3. **Knowledge Layer (optional, streng begrenzt)**
- Nur wenn nötig: Notes/Docs Retrieval für Study-Assist.
- Kein "Chat um des Chats willen".

4. **Team/Share Foundations (wenn Solo-Use stabil)**
- Erste einfache Sharing-Flows (read-only progress share).
- Kein vollwertiges Kollaborationstool in dieser Phase.

### KPIs (Phase 14)
- Nudge acceptance rate (aktion nach Hinweis)
- Task completion uplift vs. baseline cohort
- Retention uplift bei Nutzern mit aktivem Lucian Layer

### Duo Split
- **Codex:** Decision engine, signal pipelines, explainable scoring, guardrails.
- **Claude:** UX framing, trust messaging, anti-spam interaction design, feature narrative.

### Exit-Kriterien
- Intelligenz-Layer zeigt nachweisbaren Nutzen (nicht nur "neu").
- Keine regressiven Effekte auf Performance oder Klarheit.
- Lucian bleibt unterstützend und kontrollierbar.

---

## Übergreifende Risks (12–14)
1. **Feature Creep**: zu viele Richtungen gleichzeitig.
2. **Messblindheit**: Events da, aber keine konsequente Entscheidung daraus.
3. **Monetization Friction**: zu aggressive Paywall zerstört Activation.
4. **AI Overreach**: "smart" wirkt aufdringlich statt hilfreich.

## Übergreifende Guardrails
- Jede Phase hat max. 3 P0-Deliverables.
- Alles Neue braucht Messsignal + Kill-Kriterium.
- Kein Launch ohne grüne CI-Blocker + Release-Checklist.
- UX-Qualität immer gegen reale Nutzung validieren, nicht nur visuell.

---

## Empfohlene Startreihenfolge ab jetzt
1. Phase 11 sauber abschließen (DB-Migration live + Cron env + CI Run).
2. Direkt in Phase 12 mit Reliability + KPI-Betrieb.
3. Erst danach Phase 13 (Billing/Growth), dann Phase 14 (Intelligence).
