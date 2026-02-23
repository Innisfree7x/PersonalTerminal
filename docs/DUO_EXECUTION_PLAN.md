# INNIS Duo Execution Plan (Codex + Claude)

Dieses Dokument teilt die Arbeit zwischen Codex und Claude so auf, dass ihr schnell shippt, ohne euch gegenseitig zu blockieren.
Fuer den wiederverwendbaren Multi-Projekt-Ansatz siehe: `docs/HIGH_END_DUO_PLAYBOOK.md`.

## Prinzip

- Codex = Stabilität, Architektur, Security, CI, harte Qualitätsarbeit.
- Claude = Geschwindigkeit bei UI/UX, Content, Explorations, schnelle Iterationen.
- Regel: Nie beide gleichzeitig an derselben Datei arbeiten.

## Rollen

### Codex owns

- Datenmodell, RLS, Migrations, API/Server Actions, Caching, Performance-Bottlenecks.
- Testpyramide (Unit/Integration/E2E), CI-Workflows, Flaky-Test-Fixes.
- Release-Härtung: Monitoring, Runbooks, Error Handling, Fallbacks.
- Security Advisor Findings in konkrete SQL/Code-Fixes übersetzen.

### Claude owns

- UI/UX Iterationen (Layout, Spacing, Micro-Interactions, Motion-Polish).
- Produkttext, Landing-Page-Copy, FAQ, In-App Empty States.
- Feature-Prototyping (schnelle Varianten), visuelle Exploration.
- Docs-Entwürfe für Produkt/Marketing/Onboarding.

## Dateigrenzen (wichtig)

- Codex-Zone:
  - `app/actions/**`
  - `app/api/**`
  - `lib/**`
  - `middleware.ts`
  - `.github/workflows/**`
  - `tests/**`
  - `docs/GO_LIVE_RUNBOOK.md`, `docs/RELEASE_CHECKLIST.md`, `docs/DATABASE.md`

- Claude-Zone:
  - `components/**`
  - `app/(dashboard)/**` (UI layer)
  - `app/(auth)/**` (UI layer)
  - `public/**` (assets)
  - `docs/FEATURES.md`, `docs/WIDGETS.md`, `docs/PHASE*.md` (Produktsicht)

- Shared nur nach Absprache pro PR:
  - `README.md`
  - `docs/ARCHITECTURE.md`

## Branching-Strategie

- `main` bleibt immer deploybar.
- Pro Stream ein Branch:
  - `codex/<topic>`
  - `claude/<topic>`
- Merge-Reihenfolge: erst infra/security, dann UI auf neue APIs.

## PR-Template (beide)

Jede PR enthält:

1. Scope (was genau geändert)
2. Risiko (low/med/high)
3. Testnachweis (Screenshots + Logs)
4. Rollback-Plan
5. Follow-ups (bewusst verschoben)

## Übergabeformat zwischen euch

Wenn Claude an Codex übergibt:

- "UI fertig auf Branch X"
- "Erwartete API-Contracts: ..."
- "Offene Punkte/Unsicherheiten: ..."

Wenn Codex an Claude übergibt:

- "Backend/Contracts fertig auf Branch Y"
- "Was sich im UI ändern muss: ..."
- "Edge cases: ..."

## 14-Tage Aufteilung (ab jetzt)

### Block A: Launch-Sicherheit (Codex-led)

- RLS/Policy-Audit final für alle produktiven Tabellen.
- Security Advisor cleanen (insb. `public.notes`, Legacy-Tabellen).
- CI stabil + E2E-Grundpfad grün.

Claude parallel:
- Fehler- und Empty-State UI sauber machen.
- Kleine UX-Polishes ohne API-Brüche.

### Block B: Activation + Onboarding (Claude-led)

- First-run Flow auf 5-Minuten Time-to-Value.
- Demo Seed / Guided Setup UX.

Codex parallel:
- Seed-Logik serverseitig sicher machen.
- Telemetrie-Events (activation funnel) einbauen.

### Block C: Monetization + GTM

Codex:
- Stripe Webhooks, Plan-Gates, Billing-Guards.

Claude:
- Landing/Pricing/FAQ Seiten + Conversion UX.

## Definition of Done (pro Feature)

Feature gilt nur als "done", wenn:

- funktional in Production Build läuft,
- passende Tests grün sind,
- Fehlerfall sichtbar und verständlich behandelt wird,
- Docs aktualisiert sind,
- Rollback klar ist.

## Fast Decision Rules (Manager-Mode)

Wenn unklar:

1. Security > Speed
2. Data correctness > Visual polish
3. Merge kleine PRs statt Big Bang
4. Was nicht messbar ist, ist nicht "fertig"

## Heute sofort umsetzbar

- Codex: Security Advisor Findings auf 0 für produktive Tabellen bringen.
- Claude: Landing + Onboarding UX passgenau auf Zielgruppe.
- Danach gemeinsamer Release-Kandidat mit Checkliste aus `docs/RELEASE_CHECKLIST.md`.
