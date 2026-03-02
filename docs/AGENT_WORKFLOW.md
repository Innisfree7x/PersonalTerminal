# 3-Agent Workflow (Codex Trio)

Stand: 2026-03-02  
Status: Active

## Ziel
Mit drei parallel arbeitenden Agents schneller liefern, ohne Qualitaetsverlust, Merge-Chaos oder regressions.

## Rollenmodell
Verwendet immer genau diese Rollen:

1. Agent A (`core`):
   API, Actions, Data-Model, Business Logic, migrations.
2. Agent B (`ui`):
   Components, Layout, motion, copy, responsive behavior.
3. Agent C (`qa`):
   Tests, audits, perf checks, docs updates, release gate.

Ein Agent darf nur dann in den Bereich eines anderen Agents eingreifen, wenn es ein expliziter handoff ist.

## Arbeitsstruktur (gleichzeitig arbeiten)
Verwendet pro Agent ein eigenes worktree:

```bash
git worktree add ../agent-a -b agent-a/main
git worktree add ../agent-b -b agent-b/main
git worktree add ../agent-c -b agent-c/main
```

Jeder Agent arbeitet nur im eigenen worktree auf eigener branch.

## File Ownership (Default)
Diese Aufteilung minimiert Konflikte:

- Agent A:
  - `app/api/**`
  - `app/actions/**`
  - `lib/**`
  - `docs/migrations/**`
- Agent B:
  - `app/(dashboard)/**` (UI-only)
  - `components/**`
  - `app/globals.css`
- Agent C:
  - `tests/**`
  - `.github/workflows/**`
  - `docs/**` (Release/Audit/Runbook/Phase updates)

## Delivery Cadence (45-Minuten Zyklus)
Ein Cycle hat 3 Phasen:

1. 5 min scope lock:
   - task-id, acceptance criteria, file ownership festlegen.
2. 30 min execution:
   - parallel umsetzen, keine scope-ausweitung.
3. 10 min integration:
   - Agent C validiert, merge/rework Entscheidung.

## Handoff Standard
Jeder Agent liefert am Zyklusende:

- Commit hash.
- Geaenderte Dateien.
- Was verifiziert wurde (`type-check`, `lint`, Tests).
- Bekannte Risiken/offene Punkte.

Format:

```md
Task: T-XYZ
Commit: abc1234
Files: app/actions/..., components/...
Checks: type-check ✅, lint ✅, tests (targeted) ✅
Risks: none / [kurz]
```

## Merge Reihenfolge
Immer in dieser Reihenfolge integrieren:

1. Core/Data (Agent A)
2. UI (Agent B)
3. QA/Docs/Test gate (Agent C)

Wenn zwei Agents dieselbe Datei brauchen:
- zuerst split versuchen (extract helper/component).
- wenn nicht moeglich: Agent C moderiert einen bewussten merge.

## Quality Gate (verbindlich)
Vor Push:

- `npm run type-check`
- `npm run lint`
- betroffene tests

Vor Release:

- blocker e2e flows gruen
- keine offenen `TODO` fuer security/data-loss
- docs updated (`phase`, `runbook`, `context`)

## Integration Governance (verbindlich)
Diese Regeln gelten immer, auch unter Zeitdruck:

1. Kein Direkt-Push auf `main` fuer Feature-Arbeit.
2. `main` Merge nur wenn beide Checks gruen sind:
   - `Quality Checks`
   - `E2E Blocker Suite (Authenticated, Serial)`
3. CI/Workflow/Secrets/Build-Integrity gehoeren zum Core-Agent Scope:
   - `.github/workflows/**`
   - `app/api/**`
   - `lib/ops/**`
   - `docs/RELEASE_CHECKLIST.md`
4. Wenn CI oder Deploy rot ist: Incident-Freeze fuer UI/Feature-Arbeit bis Root Cause geschlossen ist.
5. Bei Incident wird strikt in dieser Reihenfolge gearbeitet:
   - Diagnose
   - minimaler Fix
   - Verifikation (lokal + CI)
   - erst danach weitere Aenderungen

## Incident Handoff Template (Pflicht bei roten Runs)
Jeder rote CI/Deploy-Fall bekommt sofort ein kompaktes Incident-Handoff:

```md
Incident: [kurzer Titel]
Timestamp (UTC): [yyyy-mm-dd hh:mm]
Run/Deploy: [github run id / vercel deployment id]
Scope: [betroffener flow oder route]
Root cause: [1-2 saetze, technisch konkret]
Fix commit: [sha]
Verification: [welche checks wieder gruen sind]
Prevention: [eine dauerhafte guardrail]
Owner: [core/ui/qa]
```

## Prompt-Templates pro Agent
Nutzt kurze, harte briefs:

### Agent A Prompt
```md
Task: [id]
Goal: [1 Satz]
Scope: [Dateien]
DoD: [konkrete Kriterien]
Constraints: no UI polish, no unrelated refactor
```

### Agent B Prompt
```md
Task: [id]
Goal: [UX/UI Ergebnis]
Scope: [Dateien]
DoD: [responsive + visual criteria]
Constraints: no API/schema changes
```

### Agent C Prompt
```md
Task: [id]
Goal: [validate + harden]
Scope: tests/docs/workflows
DoD: checks green + risk list + final recommendation
Constraints: no feature creep
```

## Konfliktregeln
Wenn Konflikt auftritt:

1. Stop parallel edits auf betroffener Datei.
2. Definiere canonical version + owner fuer final patch.
3. Re-run quality gate nach merge.

## Anti-Pattern (vermeiden)
- Ein Agent aendert "kurz noch" fremde domains.
- Große Sammel-Commits mit vielen Features.
- Merge ohne checks.
- Docs erst spaeter aktualisieren.

## Verbindliche Referenzen
- `docs/CONTEXT_CANON.md`
- `docs/PHASE12_MASTERPLAN.md`
- `docs/PHASE12_EXECUTION_BLUEPRINT.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/GO_LIVE_RUNBOOK.md`
