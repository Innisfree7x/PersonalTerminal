# Context Canon (Single Source of Truth)

Stand: 2026-03-09 (post Wave-22 bis Wave-26 hardening/polish)  
Status: Active

## Neu seit 2026-03-09 (hoch priorisiert)
- `docs/PHASE26_FEATURE_OPTIMIZATION_WAVE1_5_2026-03-09.md` (Wave-1-5 Feature-Optimierung: shared status tones, today/trajectory/calendar/career polish)
- `docs/PHASE25_DASHBOARD_BUNDLE_AND_SOUND_2026-03-09.md` (Today-Bundle + Sound + Theme-Readability)
- `docs/PHASE24_TODAY_QUERY_DEDUPE_2026-03-09.md` (Query-Dedupe + Key-Klarheit)
- `docs/PHASE23_TODAY_CRITICAL_PATH_BUNDLE_2026-03-09.md` (Morning-Snapshot + API-Bundle)
- `docs/PHASE22_CALENDAR_TRAJECTORY_FOCUS_POLISH_2026-03-08.md` (Calendar/Trajectory/Focus UX-Polish)

## Zweck
Dieses Dokument definiert verbindlich, welche Quellen für aktuelle Entscheidungen genutzt werden sollen.  
Wenn zwei Dokumente widersprüchlich sind, gilt immer diese Prioritätsliste.

## Prioritätsreihenfolge (verbindlich)
1. `docs/PHASE20_ARCH_UX_RETENTION_HARDENING_2026-03-07.md` (Storage-Migration + Done/Weekly-Rhythm + Typ-Cleanup)
2. `docs/PHASE21_WAVE1_PERF_RELIABILITY_SECURITY_2026-03-07.md` (API-Hotpath-Optimierung + CSRF-Guard + private SWR + Premium-Polish)
3. `docs/ERROR_MONITORING_AND_TENANT_ISOLATION_2026-03-07.md` (persistentes Error-Monitoring + reale Tenant-Isolation-Checks)
4. `docs/PHASE20_MARKETING_DASHBOARD_POLISH.md` (Tab-by-Tab Premium-Polish + Marketing-Contract)
5. `docs/PHASE19_MOMENTUM_SOUND_EXECUTION_CONTRACT.md` (verbindlicher Scope + AC + cooldown/ops gates)
6. `docs/PHASE19_DESIGN_ELEVATION.md` (visueller Contract fuer Dashboard/CommandRail Glass-Layer)
7. `docs/PHASE19_PREMIUM_POLISH.md` (Dashboard-Premium-Polish Contract)
8. `docs/PHASE19_RELEASE_AUDIT_2026-03-07.md` (Ist-Stand, Verifikation, bekannte Risiken)
9. `docs/PHASE18_ACTIVATION_CONVERSION_WAVES.md` (shared risk model, interactive hero, risk-to-action bridge, signup segmentation)
10. `docs/PHASE17_BLOCK3_ACTIVATION_AND_BRIDGE.md` (Onboarding/Today/Trajectory Bridge + contract updates)
11. `docs/PHASE17_AI_GUARDRAILS_EVALS.md` (AI-runtime guardrails + eval gate)
12. `docs/PHASE14_RELIABILITY_OPS.md` (aktueller Reliability-Ausfuehrungsstand inkl. Blocker)
13. `docs/PHASE16_FOCUS_OAUTH_SEARCH_IMPROVEMENTS.md` (aktueller Scope + AC fuer Focus/OAuth/Search)
14. `docs/PHASE16_AUDIT_2026-03-03.md` (Verifikation, Risiken, Handoff)
15. `docs/PHASE13.md` (abgeschlossene Gate-Struktur als Referenz)
16. `docs/PHASE13_RELEASE_AUDIT_2026-02-28.md` (Release-Gate Historie + QA-Kontext)
17. `docs/PHASE12_MASTERPLAN.md` (strategischer Parent)
18. `docs/PHASE12_EXECUTION_BLUEPRINT.md` (Execution-Baseline Tracks 3/4/5/6)
19. `docs/PHASE11_TRACK6_IMPLEMENTATION.md` (Reliability-Basis)
20. `docs/RELEASE_CHECKLIST.md`
21. `.github/workflows/ci.yml` (enforced quality gates incl. production build + eval suite)
22. `docs/GO_LIVE_RUNBOOK.md`
23. `CLAUDE.md` + `llms.txt` / `llms-full.txt` (nur als Assistenz-Kontext)
24. Historische Phase-Dokumente (nur Referenz, nicht normativ)

## Aktive Dokumente
- `docs/PHASE26_FEATURE_OPTIMIZATION_WAVE1_5_2026-03-09.md` (abgeschlossene Wave-1-5 Feature-Optimierung inkl. Audit)
- `docs/PHASE25_DASHBOARD_BUNDLE_AND_SOUND_2026-03-09.md` (Today-Bundle + Sound + Theme/Readability-Pass)
- `docs/PHASE24_TODAY_QUERY_DEDUPE_2026-03-09.md` (Today Next-Tasks Dedupe + Query-Key-Separation)
- `docs/PHASE23_TODAY_CRITICAL_PATH_BUNDLE_2026-03-09.md` (Morning-Snapshot Bundle + API-Refactor)
- `docs/PHASE22_CALENDAR_TRAJECTORY_FOCUS_POLISH_2026-03-08.md` (Calendar Ghost Events + Focus/Trajectory Polish)
- `docs/PHASE17_BLOCK3_ACTIVATION_AND_BRIDGE.md` (Onboarding/Today/Trajectory Bridge inkl. Deep-Link- und Analytics-Contract)
- `docs/PHASE18_ACTIVATION_CONVERSION_WAVES.md` (Activation/Conversion Wave-Umsetzung inkl. shared risk model und risk-to-action bridge)
- `docs/PHASE20_ARCH_UX_RETENTION_HARDENING_2026-03-07.md` (Storage-Key-Konsolidierung, Done-for-Today, Weekly-Check-in, Typ-Cleanup)
- `docs/PHASE21_WAVE1_PERF_RELIABILITY_SECURITY_2026-03-07.md` (API-Hotpath-Optimierung, Security-Hardening, Premium-Polish-Umsetzung)
- `docs/ERROR_MONITORING_AND_TENANT_ISOLATION_2026-03-07.md` (persistentes Monitoring + Tenant-Isolation-Runbook)
- `docs/PHASE20_MARKETING_DASHBOARD_POLISH.md` (Premium-Dashboard/Marketing-Ausfuehrungsvertrag)
- `docs/PHASE19_MOMENTUM_SOUND_EXECUTION_CONTRACT.md` (Momentum + Sound Phase 1 Scope Contract)
- `docs/PHASE19_DESIGN_ELEVATION.md` (Design Elevation Contract fuer Glass/Glow-Layer)
- `docs/PHASE19_PREMIUM_POLISH.md` (Dashboard Premium-Polish Contract)
- `docs/PHASE19_RELEASE_AUDIT_2026-03-07.md` (Release- und Verifikationsstand inkl. Overnight-Hardening)
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
