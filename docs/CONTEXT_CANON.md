# Context Canon (Single Source of Truth)

Stand: 2026-03-30 (post KIT ILIAS acknowledge loop)
Status: Active

## Neu seit 2026-03-15 (hoch priorisiert)
- `docs/PHASE45_KIT_ILIAS_ACKNOWLEDGE_LOOP_2026-03-30.md` (Unread-ILIAS-Preview im KIT Hub, Acknowledge-Mutation, erster Read-State-Loop fuer Studienmaterial)
- `docs/PHASE44_KIT_CONNECTORS_AND_TODAY_FUSION_2026-03-29.md` (CAMPUS Academic Exporter, ILIAS Kurs-Items Exporter, kompakter KIT-Hub-Management-Flow, KIT-Signale in Today)
- `docs/PHASE42_KIT_SYNC_CONNECTOR_EXECUTION_CONTRACT_2026-03-29.md` (KIT Sync Wave 1+2+3: WebCal-Fundament, CAMPUS Academic Snapshot und ILIAS Favorites Snapshot)
- `docs/PHASE43_KIT_ILIAS_DASHBOARD_CONNECTOR_2026-03-29.md` (lokaler ILIAS-Dashboard-Exportpfad für Favoriten)
- `docs/PHASE41_MEASURED_PERFORMANCE_PASS_2026-03-28.md` (Analytics lazy-loaded, Settings in schwere Sektionen gesplittet, CommandPalette/Sidebar/Layout-Interaktionskosten reduziert)
- `docs/PHASE40_PERFORMANCE_AND_CI_STABILIZATION_2026-03-27.md` (Today/Focus/Dashboard-Performance-Welle, CI-Hotfixes, Blocker-E2E-Härtung, mobile Landing-Dot-Fix, Focus-Timer-Render-Entkopplung)
- `docs/PHASE39_MARKETING_ART_DIRECTION_2026-03-23.md` (aktive Landing ueber `CinematicLanding`, asymmetrischer Hero, Proof-Layer pro Section, tote Marketing-Mockups bewusst ignoriert)
- `docs/PHASE38_CAREER_INTELLIGENCE_V3_2026-03-22.md` (Company Lens, Recovery Playbook, tieferes Career Dossier)
- `docs/PHASE37_CRITICAL_PATH_INTEGRATION_2026-03-21.md` (Today/Career/Trajectory-Integrationstests + Coverage-Lift auf grüne Function-Schwelle)
- `docs/PHASE36_QUALITY_HARDENING_2026-03-21.md` (Green Baseline, Coverage-Gate in CI, Type-Hardening, Build-Verifikation)
- `docs/PHASE35_CAREER_INTELLIGENCE_V2_2026-03-21.md` (Career Radar V2 mit CV-Signal, Recovery-State und Action-Stack)
- `docs/PHASE34_CAREER_DOSSIER_2026-03-19.md` (Career Dossier, Decision Surface, kompaktere Ergebnis-Karten)
- `docs/PHASE33_SHOWCASE_AND_CAREER_BRIDGE_2026-03-19.md` (proof-first ProductShowcase, Career->Trajectory Bridge)
- `docs/PHASE32_MARKETING_CONVERSION_AND_CAREER_TRUST_2026-03-19.md` (Marketing Hero/Proof-Reframe + Career Explainability)
- `DEVELOPMENT_GUIDE.md` (aktualisiert: Feature-Branch-Workflow, Staging via Vercel Preview, Pre-commit mit Tests, CI/CD-Pipeline-Referenz, Test-Patterns)
- `docs/PHASE31_MARKETING_PREMIUM_REFRESH_2026-03-15.md` (neue Marketing-Designphilosophie und Relaunch fuer Landing/Features/Pricing/About)
- `docs/PHASE31_CAREER_HARDENING_2026-03-15.md` (Rate-Limits, LLM-Budget-Guard, Gap->Task-Bridge, Verifikation)
- `docs/ONBOARDING_V2_TRAJECTORY_ACTIVATION.md` (live 4-step onboarding, trajectory-first activation, completion gate)
- `docs/LUCIAN_SPRITE_V2_UPGRADE.md` (Lucian Sprite V2 live, config + tests verdrahtet)

## Seit 2026-03-09
- `docs/AGENT_STANDARD_COMPLIANCE_2026-03-10.md` (Compliance-Abgleich aktiver Wave-Doks mit Agent-Standard)
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
4. `docs/PHASE45_KIT_ILIAS_ACKNOWLEDGE_LOOP_2026-03-30.md` (Unread-ILIAS-Preview im KIT Hub, Acknowledge-Mutation, erster Read-State-Loop fuer Studienmaterial)
5. `docs/PHASE44_KIT_CONNECTORS_AND_TODAY_FUSION_2026-03-29.md` (CAMPUS Academic Exporter, ILIAS Kurs-Items Exporter, kompakter KIT-Hub-Management-Flow, KIT-Signale in Today)
6. `docs/PHASE42_KIT_SYNC_CONNECTOR_EXECUTION_CONTRACT_2026-03-29.md` (KIT Sync Wave 1+2+3: WebCal-Fundament, CAMPUS Academic Snapshot und ILIAS Favorites Snapshot)
7. `docs/PHASE43_KIT_ILIAS_DASHBOARD_CONNECTOR_2026-03-29.md` (lokaler ILIAS-Dashboard-Exportpfad für Favoriten)
8. `docs/PHASE41_MEASURED_PERFORMANCE_PASS_2026-03-28.md` (Analytics lazy-loaded, Settings in schwere Sektionen gesplittet, CommandPalette/Sidebar/Layout-Interaktionskosten reduziert)
9. `docs/PHASE40_PERFORMANCE_AND_CI_STABILIZATION_2026-03-27.md` (Today/Focus/Dashboard-Performance-Welle + CI-/Blocker-Stabilisierung + Focus-Timer-Render-Entkopplung)
10. `docs/PHASE39_MARKETING_ART_DIRECTION_2026-03-23.md` (aktive Landing ueber `CinematicLanding`, asymmetrischer Hero, Proof-Layer und premium Art Direction)
11. `docs/PHASE38_CAREER_INTELLIGENCE_V3_2026-03-22.md` (Company Lens + Recovery Playbook + tieferes Career Dossier)
12. `docs/PHASE37_CRITICAL_PATH_INTEGRATION_2026-03-21.md` (Today/Career/Trajectory-Integrationstests + Coverage-Lift)
13. `docs/PHASE36_QUALITY_HARDENING_2026-03-21.md` (Green Baseline + Coverage-Gate + Type-Hardening)
14. `docs/PHASE35_CAREER_INTELLIGENCE_V2_2026-03-21.md` (CV-Signal, Recovery-State, Action-Stack)
15. `docs/PHASE34_CAREER_DOSSIER_2026-03-19.md` (Career Dossier / Decision Surface)
16. `docs/PHASE33_SHOWCASE_AND_CAREER_BRIDGE_2026-03-19.md` (proof-first Showcase + Career->Trajectory)
17. `docs/PHASE32_MARKETING_CONVERSION_AND_CAREER_TRUST_2026-03-19.md` (Marketing Conversion + Career Trust)
18. `docs/PHASE31_CAREER_HARDENING_2026-03-15.md` (Rate-Limits + LLM-Budget-Guard + Gap->Task-Bridge)
19. `docs/PHASE31_MARKETING_PREMIUM_REFRESH_2026-03-15.md` (verbindliche Marketing-Designphilosophie + Relaunch-Richtung)
17. `docs/PHASE20_MARKETING_DASHBOARD_POLISH.md` (Tab-by-Tab Premium-Polish + Marketing-Contract)
18. `docs/PHASE19_MOMENTUM_SOUND_EXECUTION_CONTRACT.md` (verbindlicher Scope + AC + cooldown/ops gates)
19. `docs/PHASE19_DESIGN_ELEVATION.md` (visueller Contract fuer Dashboard/CommandRail Glass-Layer)
20. `docs/PHASE19_PREMIUM_POLISH.md` (Dashboard-Premium-Polish Contract)
21. `docs/PHASE19_RELEASE_AUDIT_2026-03-07.md` (Ist-Stand, Verifikation, bekannte Risiken)
22. `docs/PHASE18_ACTIVATION_CONVERSION_WAVES.md` (shared risk model, interactive hero, risk-to-action bridge, signup segmentation)
23. `docs/PHASE17_BLOCK3_ACTIVATION_AND_BRIDGE.md` (Onboarding/Today/Trajectory Bridge + contract updates)
24. `docs/PHASE17_AI_GUARDRAILS_EVALS.md` (AI-runtime guardrails + eval gate)
25. `docs/PHASE14_RELIABILITY_OPS.md` (aktueller Reliability-Ausfuehrungsstand inkl. Blocker)
26. `docs/PHASE16_FOCUS_OAUTH_SEARCH_IMPROVEMENTS.md` (aktueller Scope + AC fuer Focus/OAuth/Search)
27. `docs/PHASE16_AUDIT_2026-03-03.md` (Verifikation, Risiken, Handoff)
28. `docs/PHASE13.md` (abgeschlossene Gate-Struktur als Referenz)
29. `docs/PHASE13_RELEASE_AUDIT_2026-02-28.md` (Release-Gate Historie + QA-Kontext)
30. `docs/PHASE12_MASTERPLAN.md` (strategischer Parent)
31. `docs/PHASE12_EXECUTION_BLUEPRINT.md` (Execution-Baseline Tracks 3/4/5/6)
32. `docs/PHASE11_TRACK6_IMPLEMENTATION.md` (Reliability-Basis)
33. `docs/RELEASE_CHECKLIST.md`
34. `.github/workflows/ci.yml` (enforced quality gates incl. production build + eval suite + coverage gate)
35. `docs/GO_LIVE_RUNBOOK.md`
36. `CLAUDE.md` + `llms.txt` / `llms-full.txt` (nur als Assistenz-Kontext)
37. Historische Phase-Dokumente (nur Referenz, nicht normativ)

## Aktive Dokumente
- `docs/PHASE45_KIT_ILIAS_ACKNOWLEDGE_LOOP_2026-03-30.md` (Unread-ILIAS-Preview im KIT Hub, Acknowledge-Mutation, erster Read-State-Loop fuer Studienmaterial)
- `docs/PHASE44_KIT_CONNECTORS_AND_TODAY_FUSION_2026-03-29.md` (CAMPUS Academic Exporter, ILIAS Kurs-Items Exporter, kompakter KIT-Hub-Management-Flow, KIT-Signale in Today)
- `docs/PHASE42_KIT_SYNC_CONNECTOR_EXECUTION_CONTRACT_2026-03-29.md` (KIT Sync Wave 1+2+3: WebCal-Fundament, CAMPUS Academic Snapshot und ILIAS Favorites Snapshot)
- `docs/PHASE43_KIT_ILIAS_DASHBOARD_CONNECTOR_2026-03-29.md` (lokaler ILIAS-Dashboard-Exportpfad für Favoriten)
- `docs/PHASE41_MEASURED_PERFORMANCE_PASS_2026-03-28.md` (Analytics lazy-loaded, Settings in dynamische Sektionen aufgeteilt, CommandPalette/Sidebar/Layout-Interaktionskosten reduziert)
- `docs/PHASE40_PERFORMANCE_AND_CI_STABILIZATION_2026-03-27.md` (Today/Focus/Dashboard-Performance-Welle, CI-/Blocker-Stabilisierung, mobile Landing-Dots, Focus-Timer-Render-Entkopplung)
- `docs/AGENT_STANDARD_COMPLIANCE_2026-03-10.md` (aktueller Compliance-Report fuer Agent-Standard in aktiven Wellen)
- `docs/PHASE38_CAREER_INTELLIGENCE_V3_2026-03-22.md` (Company Lens, Recovery Playbook, tieferes Career Dossier)
- `docs/PHASE37_CRITICAL_PATH_INTEGRATION_2026-03-21.md` (Critical Path Integration fuer Today/Career/Trajectory + Coverage-Lift)
- `docs/PHASE36_QUALITY_HARDENING_2026-03-21.md` (Quality-Baseline, Coverage-Gate, Type-Hardening, Build-Verifikation)
- `docs/PHASE35_CAREER_INTELLIGENCE_V2_2026-03-21.md` (Career Radar V2 mit CV-Signal, Recovery-State und Action-Stack)
- `docs/PHASE34_CAREER_DOSSIER_2026-03-19.md` (Career Dossier / Decision Surface fuer Opportunity-Auswahl)
- `docs/PHASE33_SHOWCASE_AND_CAREER_BRIDGE_2026-03-19.md` (Showcase proof-first + Career->Trajectory Bridge)
- `docs/PHASE32_MARKETING_CONVERSION_AND_CAREER_TRUST_2026-03-19.md` (Hero/Proof-Reframe + Career Explainability)
- `docs/PHASE31_CAREER_HARDENING_2026-03-15.md` (Rate-Limits, LLM-Budget-Guard, Gap->Task-Bridge inkl. Verifikation)
- `docs/ONBOARDING_V2_TRAJECTORY_ACTIVATION.md` (live trajectory-first onboarding, v1 step files entfernt)
- `docs/LUCIAN_SPRITE_V2_UPGRADE.md` (Lucian Sprite V2 live; Visual Review offen als optionaler Follow-up)
- `docs/PHASE31_MARKETING_PREMIUM_REFRESH_2026-03-15.md` (aktueller Marketing-Relaunch und verbindliche Designphilosophie fuer oeffentliche Routen)
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
- `.github/workflows/ci.yml` (verbindliche CI-Policy inkl. `npm run build` und `npm run test:coverage`)
- `docs/GO_LIVE_RUNBOOK.md` (operativer Rollout)
- `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md` (technische Referenz)
- `docs/BENTO_REDESIGN.md` (Design-Referenz; nicht als "implementiert" interpretieren)
- `CLAUDE.md`, `llms.txt`, `llms-full.txt` (KI-Kontext; muessen diesen Canon spiegeln)
- `DEVELOPMENT_GUIDE.md` (Git-Workflow, Staging, Testing, CI/CD, Environment-Referenz)

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
- KI-Kontextdateien (`CLAUDE.md`, `GEMINI*.md`, `llms*.txt`) duerfen keine aktive Anweisung enthalten, die diesem Canon widerspricht.
