# Context Canon (Single Source of Truth)

Stand: 2026-03-01 (post-stabilization refresh)  
Status: Active

## Zweck
Dieses Dokument definiert verbindlich, welche Quellen für aktuelle Entscheidungen genutzt werden sollen.  
Wenn zwei Dokumente widersprüchlich sind, gilt immer diese Prioritätsliste.

## Prioritätsreihenfolge (verbindlich)
1. `docs/PHASE14_RELIABILITY_OPS.md` (aktueller Reliability-Ausfuehrungsstand inkl. Blocker)
2. `docs/PHASE13.md` (abgeschlossene Gate-Struktur als Referenz)
3. `docs/PHASE13_RELEASE_AUDIT_2026-02-28.md` (Release-Gate Historie + QA-Kontext)
4. `docs/PHASE12_MASTERPLAN.md` (strategischer Parent)
5. `docs/PHASE12_EXECUTION_BLUEPRINT.md` (Execution-Baseline Tracks 3/4/5/6)
6. `docs/PHASE11_TRACK6_IMPLEMENTATION.md` (Reliability-Basis)
7. `docs/RELEASE_CHECKLIST.md`
8. `.github/workflows/ci.yml` (enforced quality gates incl. production build)
9. `docs/GO_LIVE_RUNBOOK.md`
10. `CLAUDE.md` + `llms.txt` / `llms-full.txt` (nur als Assistenz-Kontext)
11. Historische Phase-Dokumente (nur Referenz, nicht normativ)

## Aktive Dokumente
- `docs/PHASE14_RELIABILITY_OPS.md` (aktive Reliability-Umsetzung inkl. Audit-Status)
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

## Regeln für Codex/Claude
- "Active" Entscheidungen nur aus den aktiven Dokumenten ableiten.
- Historische Dokumente nur nutzen, wenn konkrete Legacy-Details benötigt werden.
- Bei Unklarheit in aktueller Ausfuehrung: `PHASE14_RELIABILITY_OPS.md` hat Vorrang.
- Bei strategischen KPI-/Roadmap-Fragen: `PHASE12_MASTERPLAN.md` hat Vorrang.
- Build-/Deploy-Integrität immer in CI erzwingen; Vercel darf nicht Erstentdecker von Compile-Fehlern sein.
- Nach jedem größeren Planwechsel muss diese Datei aktualisiert werden.
- KI-Kontextdateien (`CLAUDE.md`, `llms*.txt`) duerfen keine aktive Anweisung enthalten, die diesem Canon widerspricht.
