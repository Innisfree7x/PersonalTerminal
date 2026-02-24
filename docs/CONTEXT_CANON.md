# Context Canon (Single Source of Truth)

Stand: 2026-02-24  
Status: Active

## Zweck
Dieses Dokument definiert verbindlich, welche Quellen für aktuelle Entscheidungen genutzt werden sollen.  
Wenn zwei Dokumente widersprüchlich sind, gilt immer diese Prioritätsliste.

## Prioritätsreihenfolge (verbindlich)
1. `docs/PHASE12_MASTERPLAN.md`
2. `docs/PHASE12_EXECUTION_BLUEPRINT.md`
3. `docs/PHASE11_TRACK6_IMPLEMENTATION.md`
4. `docs/RELEASE_CHECKLIST.md`
5. `docs/GO_LIVE_RUNBOOK.md`
6. `CLAUDE.md` + `llms.txt` / `llms-full.txt` (nur als Assistenz-Kontext)
7. Historische Phase-Dokumente (nur Referenz, nicht normativ)

## Aktive Dokumente
- `docs/PHASE12_MASTERPLAN.md` (aktive Phase-Planung)
- `docs/PHASE12_EXECUTION_BLUEPRINT.md` (konkrete Umsetzung Tracks 3/4/5/6)
- `docs/PHASE11_TRACK6_IMPLEMENTATION.md` (implementierte Reliability-Basis)
- `docs/RELEASE_CHECKLIST.md` (Release-Gate)
- `docs/GO_LIVE_RUNBOOK.md` (operativer Rollout)
- `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md` (technische Referenz)
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

## Regeln für Codex/Claude
- "Active" Entscheidungen nur aus den aktiven Dokumenten ableiten.
- Historische Dokumente nur nutzen, wenn konkrete Legacy-Details benötigt werden.
- Bei Unklarheit: `PHASE12_MASTERPLAN.md` hat Vorrang.
- Nach jedem größeren Planwechsel muss diese Datei aktualisiert werden.
- KI-Kontextdateien (`CLAUDE.md`, `llms*.txt`) duerfen keine aktive Anweisung enthalten, die diesem Canon widerspricht.
