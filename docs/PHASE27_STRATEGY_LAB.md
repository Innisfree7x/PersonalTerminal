# PHASE 27 — Strategy Lab V1

## Ziel
Strategische Entscheidungen als first-class Feature in INNIS abbilden:
- mehrere Optionen pro Decision
- deterministisches Scoring mit transparenten Subscores
- Winner direkt als Today-Task committen

## Scope (implementiert)
- Neue Dashboard-Route: `/strategy`
- Sidebar + Header + Command Parser Integration (`open strategy`)
- Datenmodell V1 inkl. RLS:
  - `strategy_decisions`
  - `strategy_options`
  - `strategy_decision_commits`
- API Surface:
  - `GET/POST /api/strategy/decisions`
  - `PATCH/DELETE /api/strategy/decisions/[id]`
  - `POST /api/strategy/options`
  - `PATCH/DELETE /api/strategy/options/[id]`
  - `POST /api/strategy/decisions/[id]/score`
  - `POST /api/strategy/decisions/[id]/commit`
- Commit Bridge:
  - erzeugt idempotent einen Today-Task (`source='strategy'`)
  - dedupe über `source_id = strategy:<decisionId>:<optionId>:<taskDate>`

## Deterministische Score-Logik
Datei: `lib/strategy/scoring.ts`

Subscores:
- `impact`
- `confidence`
- `fit`
- `effortPenalty`
- `riskPenalty`
- `speedPenalty`

Ergebnis:
- `total` in `0..100`
- Winner = höchster Total Score

## Migration
Datei: `docs/migrations/2026-03-10_strategy_lab_v1.sql`

In Supabase SQL Editor ausführen.

## Akzeptanzkriterien
- User kann Decision erstellen, Option hinzufügen, Scores sehen
- Score ist für gleiche Inputs stabil/reproduzierbar
- Commit erzeugt Today-Task ohne Duplikat beim erneuten Commit mit gleichem Task-Date
- `/strategy` ist über Sidebar und Command Palette erreichbar

## Nicht-Ziele V1
- KI-gestützte Empfehlung
- Shared/Collaborative Decision Boards
- automatische externe Datenanreicherung
