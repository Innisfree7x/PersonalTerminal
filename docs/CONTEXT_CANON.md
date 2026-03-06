# Context Canon (Single Source of Truth)

Stand: 2026-03-06 (post Phase-18 activation/conversion waves)  
Status: Active

## Zweck
Dieses Dokument definiert verbindlich, welche Quellen für aktuelle Entscheidungen genutzt werden sollen.  
Wenn zwei Dokumente widersprüchlich sind, gilt immer diese Prioritätsliste.

## Prioritätsreihenfolge (verbindlich)
1. `docs/PHASE18_ACTIVATION_CONVERSION_WAVES.md` (shared risk model, interactive hero, risk-to-action bridge, signup segmentation)
2. `docs/PHASE17_BLOCK3_ACTIVATION_AND_BRIDGE.md` (Onboarding/Today/Trajectory Bridge + contract updates)
3. `docs/PHASE17_AI_GUARDRAILS_EVALS.md` (AI-runtime guardrails + eval gate)
4. `docs/PHASE14_RELIABILITY_OPS.md` (aktueller Reliability-Ausfuehrungsstand inkl. Blocker)
5. `docs/PHASE16_FOCUS_OAUTH_SEARCH_IMPROVEMENTS.md` (aktueller Scope + AC fuer Focus/OAuth/Search)
6. `docs/PHASE16_AUDIT_2026-03-03.md` (Verifikation, Risiken, Handoff)
7. `docs/PHASE13.md` (abgeschlossene Gate-Struktur als Referenz)
8. `docs/PHASE13_RELEASE_AUDIT_2026-02-28.md` (Release-Gate Historie + QA-Kontext)
9. `docs/PHASE12_MASTERPLAN.md` (strategischer Parent)
10. `docs/PHASE12_EXECUTION_BLUEPRINT.md` (Execution-Baseline Tracks 3/4/5/6)
11. `docs/PHASE11_TRACK6_IMPLEMENTATION.md` (Reliability-Basis)
12. `docs/RELEASE_CHECKLIST.md`
13. `.github/workflows/ci.yml` (enforced quality gates incl. production build + eval suite)
14. `docs/GO_LIVE_RUNBOOK.md`
15. `CLAUDE.md` + `llms.txt` / `llms-full.txt` (nur als Assistenz-Kontext)
16. Historische Phase-Dokumente (nur Referenz, nicht normativ)

## Aktive Dokumente
- `docs/PHASE17_BLOCK3_ACTIVATION_AND_BRIDGE.md` (Onboarding/Today/Trajectory Bridge inkl. Deep-Link- und Analytics-Contract)
- `docs/PHASE18_ACTIVATION_CONVERSION_WAVES.md` (Activation/Conversion Wave-Umsetzung inkl. shared risk model und risk-to-action bridge)
- `docs/PHASE17_AI_GUARDRAILS_EVALS.md` (verbindliche Runtime-Contracts + Eval-Gate fuer AI-adjacent flows)
- `docs/PHASE14_RELIABILITY_OPS.md` (aktive Reliability-Umsetzung inkl. Audit-Status)
- `docs/PHASE16_FOCUS_OAUTH_SEARCH_IMPROVEMENTS.md` (aktuelle Umsetzung Focus/OAuth/Search)
- `docs/PHASE16_AUDIT_2026-03-03.md` (Phase-16 Verifikation + Handoff)
- `docs/TRAJECTORY_AGENT_HANDBOOK.md` (verbindlicher Guardrail- und Test-Handoff fuer `/trajectory`)
- `docs/PHASE13.md` (Gate-Referenz fuer Focus/Lucian/Density)
- `docs/PHASE13_RELEASE_AUDIT_2026-02-28.md` (Release-/Gate-Kontext)
- `docs/AGENT_CHANGE_REVIEW_2026-03-01.md` (aktueller Core-Review inkl. CI-Evidenz)
- `docs/MORNING_BRIEF_2026-03-01.md` (aktueller Hand-off fuer Team/Agenten)
- `docs/PHASE12_MASTERPLAN.md` (strategischer Rahmen, Nordstern und KPI-System)
- `docs/PHASE12_EXECUTION_BLUEPRINT.md` (Baseline fuer laufende Tracks 3/4/5/6)
- `docs/PHASE11_TRACK6_IMPLEMENTATION.md` (implementierte Reliability-Basis)
- `docs/AGENT_WORKFLOW.md` (verbindliches 3-Agent Operating Model)
- `docs/AGENT_TASK_TEMPLATE.md` (standardisiertes Task-Briefing fuer Agents)
- `docs/RELEASE_CHECKLIST.md` (Release-Gate)
- `.github/workflows/ci.yml` (verbindliche CI-Policy inkl. `npm run build`)
- `docs/GO_LIVE_RUNBOOK.md` (operativer Rollout)
- `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md` (technische Referenz)
- `docs/BENTO_REDESIGN.md` (Design-Referenz; nicht als "implementiert" interpretieren)
- `CLAUDE.md`, `llms.txt`, `llms-full.txt` (KI-Kontext; muessen diesen Canon spiegeln)

## Historische (nicht normative) Dokumente
Die folgenden Dokumente sind abgeschlossen oder durch neuere Planung ersetzt:
- `docs/PHASE4.md`
- `docs/PHASE5.md`
- `docs/PHASE6.md`
- `docs/PHASE7.md`
- `docs/PHASE8_1_APPEARANCE.md`
- `docs/PHASE8_DUO_MARKETING_SITE.md`
- `docs/PHASE9.md`
- `docs/PHASE9_TRACKA_AUDIT_2026-02-19.md`
- `docs/PHASE10_EXECUTION.md`
- `docs/PHASE10_1_METRICS_SPEC.md`
- `docs/PHASE10_1_IMPLEMENTATION.md`
- `docs/PHASE10_M2_ACCEPTANCE_SCENARIOS.md`
- `docs/PHASE11_CORE_UX_SPEED_RELIABILITY.md`
- `docs/NEXT_LEVEL_3_4_5_6_MASTERPLAN.md`
- `docs/PHASE12_14_LONG_TERM_ROADMAP.md`
- `docs/PHASE8_11_AUDIT_2026-02-21.md`
- `docs/DUO_EXECUTION_PLAN.md`
- `docs/HIGH_END_ROADMAP_STATUS.md`

## Proposal-Dokumente (nur nach expliziter Freigabe aktiv)
- `docs/PHASE15_INNOVATION_CANDIDATES.md`
- `docs/TRAJECTORY_TAB_V1.md`

## Regeln für Codex/Claude
- "Active" Entscheidungen nur aus den aktiven Dokumenten ableiten.
- Historische Dokumente nur nutzen, wenn konkrete Legacy-Details benötigt werden.
- Bei Unklarheit in aktueller Ausfuehrung: `PHASE14_RELIABILITY_OPS.md` hat Vorrang.
- Bei strategischen KPI-/Roadmap-Fragen: `PHASE12_MASTERPLAN.md` hat Vorrang.
- Build-/Deploy-Integrität immer in CI erzwingen; Vercel darf nicht Erstentdecker von Compile-Fehlern sein.
- AI-adjacent Flows muessen Runtime-Contracts + Eval-Coverage haben (siehe `PHASE17_AI_GUARDRAILS_EVALS.md`).
- Integration Governance aus `docs/AGENT_WORKFLOW.md` ist verbindlich (main-schutz, core ownership, incident freeze).
- `main` nur via PR-merge mit branch protection; required checks: `Quality Checks` und `E2E Blocker Suite (Authenticated, Serial)`.
- Jede rote CI/deploy bekommt sofort ein Incident-Ticket aus `.github/ISSUE_TEMPLATE/ci-deploy-incident.yml` (Root cause, Fix SHA, Prevention je Feld Pflicht).
- Nach jedem größeren Planwechsel muss diese Datei aktualisiert werden.
- KI-Kontextdateien (`CLAUDE.md`, `llms*.txt`) duerfen keine aktive Anweisung enthalten, die diesem Canon widerspricht.
