> **Status: Archived (Historical).**
> This document is kept for historical traceability and is **not** the active execution source anymore.
> Use docs/PHASE12_MASTERPLAN.md and docs/CONTEXT_CANON.md as canonical context.

# NEXT LEVEL Masterplan (Tracks 3, 4, 5, 6)

Stand: 2026-02-24
Status: Archived — superseded by docs/PHASE12_MASTERPLAN.md
Owner: Engineering

---

## 0) Zielbild

INNIS auf das nächste Produktlevel in 4 Tracks:
- **Track 6** — Core UX-Speed & Reliability (Gate für Track 4 + 5)
- **Track 3** — Lucian 2.0 (Companion + Playability)
- **Track 4** — Command Palette als Operating System
- **Track 5** — Weekly Review Copilot

---

## 1) Reihenfolge & Parallelisierung

### Parallel-Start (sofort)
Track 6 und Track 3 blockieren sich nicht — beide starten gleichzeitig:

| Codex | Claude |
|-------|--------|
| Track 6 (Reliability, API, E2E) | Track 3 (Lucian UI, Break Game) |

### Gate-abhängige Tracks
Track 4 und Track 5 starten erst wenn Gate A (Track 6) grün ist.

```
[jetzt]
  Codex: Track 6 ──────────────── Gate A ──→ Track 4 → Track 5
  Claude: Track 3 ─────────────── (unabhängig fertig) ──→ Track 4 UI
```

### Release Gates
- **Gate A**: Blocker-Tests grün, SLO-Zielwerte erreicht oder Fixplan dokumentiert
- **Gate B**: Lucian Break-Loop stabil, keine Regression in Provider-Flows
- **Gate C**: Command Parser + Executor sicher, Preview-UX vorhanden
- **Gate D**: Weekly Review korrekt, Empfehlungen nicht generisch

---

## 2) Track 6: Core UX-Speed & Reliability

**Owner: Codex**
Claude-Beitrag: Loading-State UI, Skeleton-Verbesserungen falls nötig

### SLOs (verbindlich)

| Flow | Availability | p95 API | p95 E2E |
|------|-------------|---------|---------|
| login | ≥ 99.9% | — | < 1.5s |
| create task | ≥ 99.5% | < 700ms | < 1.8s |
| toggle exercise | ≥ 99.5% | < 500ms | < 1.2s |
| /today load | ≥ 99.5% | — | < 2.0s |

### Umsetzung (Codex)
- `app/api/**/route.ts` — standardisierte Timing-Logs (`duration_ms`, `route`, `status`, `request_id`)
- `lib/analytics/events.ts` — Event-Typen für Blocker-Flows
- `tests/e2e/blocker/**` — 4 Blocker-Specs (login, create-task, toggle-exercise, today-load)
- Idempotente Mutation-Pfade für Task/Exercise toggles
- Harte Fehlercodes in allen API-Routes (keine stillen 500)

### DoD Track 6
- [ ] SLO-Zielwerte erreicht oder Fixplan mit Datum
- [ ] Blocker-Suite stabil, Flake < 2%
- [ ] Alle API-Routes mit Timing-Logs
- [ ] Error Budget dokumentiert

---

## 3) Track 3: Lucian 2.0

**Owner: Claude** (UI, Copy, Motion)
**Codex-Beitrag:** Provider-Tests, Break-Game unit tests, Metrics-Hooks

### Bereits fertig
- Speech Bubble über Lucian mit Tail, Anchor-Logik, Mood-Coding ✅
- LucianSpriteAnimator, Mood-Animationen ✅
- +10 neue Copy-Lines, Zap-Icon, Dismiss-Fix ✅

### Noch offen

**M4 — Break Activity (Claude + Codex)**
- Break-Invite CTA in Bubble nach Inaktivität
- `LucianBreakOverlay.tsx` — 60s Target Drill Minigame
- `lib/lucian/game/targetDrill.ts` — Spawn/Score/Combo-Logik (pure functions)
- `tests/unit/lucian-target-drill.test.ts` — Codex schreibt Tests
- End-Screen: celebrate/recovery Reaktion + Score

**Offene Entscheidungen (User)**
- Break-Trigger: nach wie vielen Minuten Inaktivität? *(Vorschlag: 7 min)*
- Minigame-Dauer: 60s oder 90s? *(Vorschlag: 60s)*
- Voiceline-Tone: cool/edgy oder warm? *(Vorschlag: 70/30)*

### File-Scope
- `components/features/lucian/LucianBubble.tsx` — Claude
- `components/features/lucian/LucianBreakOverlay.tsx` — Claude (neu)
- `lib/lucian/game/targetDrill.ts` — Claude (neu), Codex testet
- `lib/lucian/copy.ts` — Claude
- `tests/unit/lucian-target-drill.test.ts` — Codex
- `tests/unit/LucianBubbleProvider.test.tsx` — Codex

### DoD Track 3
- [ ] Break-Loop stabil (invite → start → run → end)
- [ ] Keine Regression in Provider-Flows
- [ ] Unit tests grün
- [ ] CTA und Bubble a11y-konform

---

## 4) Track 4: Command Palette als OS

**Owner: Claude** (UI, Parser-UX, Preview)
**Codex:** Executor-Sicherheit, Tests, Action-Guards

> Startet erst nach Gate A.

### Product Outcome
Command Palette wird von "Shortcut-Liste" zu "Intent Engine":
User schreibt Ziel in natürlicher Sprache → System erzeugt strukturierte Aktionen.

Beispiel:
```
> erstelle task "VWL Blatt 3" deadline morgen
→ Preview: Task "VWL Blatt 3" · due 25.02. [Bestätigen] [Abbrechen]
```

### V1 (deterministisch, kein LLM)
- Grammar Parser für Kern-Intents:
  - `create task [title] [deadline?]`
  - `plan focus [duration]`
  - `create goal [title]`
  - `open [page]`
- Dry-run Preview vor Ausführung
- Multi-action support

### V2 (später, optional)
- Claude API fallback für nicht-erkannte Intents
- Confidence scoring + User-Correction Loop

### File-Scope
- `components/shared/CommandPalette.tsx` — Claude (UI-Schicht)
- `lib/command/parser.ts` — Claude (neu)
- `lib/command/executor.ts` — Codex (neu, mit Guards)
- `lib/hooks/useCommandActions.ts` — Claude
- `tests/unit/command-parser.test.ts` — Codex
- `tests/integration/command-executor.test.ts` — Codex

### Sicherheitsregeln
- Keine destructive Actions ohne Confirm-Step
- Jeder Action-Plan ist erst Preview, dann Commit
- Parser strikt typisiert, kein freies eval

### DoD Track 4
- [ ] 10+ Kernkommandos deterministisch stabil
- [ ] Preview + Confirm UX vorhanden
- [ ] Parsing-Tests decken Edge Cases ab
- [ ] Fehlertexte klar und handlungsorientiert

---

## 5) Track 5: Weekly Review Copilot

**Owner: Claude** (UI, Review-Logik, Copy)
**Codex:** API-Route, Cron-Integration, Tests

> Startet erst nach Gate A.

### Product Outcome
Jeder Montag: klarer Wochenrückblick mit Fortschritt, Blockern und konkreten Empfehlungen für die nächste Woche.

### Entscheidung: Rule-based vs. Claude API

| Ansatz | Vorteil | Nachteil |
|--------|---------|---------|
| Rule-based | Kein API-Cost, schnell, vorhersehbar | Wird generisch ohne viel Regelarbeit |
| Claude API | Wirklich personalisiert, nicht generisch | Cost, Latenz, API-Key nötig |

**Empfehlung: Claude API für Empfehlungstext, rule-based für Datenaggregation.**
→ Daten werden server-seitig aggregiert, dann als Kontext an Claude API übergeben.

### Datenquellen
- Focus sessions (Stunden, Completed rate)
- Daily tasks (Done/Total pro Tag)
- Exercises (Fortschritt pro Kurs)
- Goals (Fortschritt, Deadlines)
- Applications (neue, Status-Changes)

### File-Scope
- `app/(dashboard)/analytics/page.tsx` — Claude (Review-Sektion einbauen)
- `components/features/analytics/WeeklyReview.tsx` — Claude (neu)
- `lib/review/weeklyReview.ts` — Codex (Datenaggregation)
- `app/api/review/weekly/route.ts` — Codex (neu)
- `tests/unit/weekly-review.test.ts` — Codex

### DoD Track 5
- [ ] Weekly summary korrekt für 3 bekannte Datenlagen
- [ ] Empfehlungen nicht generisch (Claude API oder smarte Rules)
- [ ] API + UI tests grün
- [ ] Darstellung auf Analytics-Seite sauber integriert

---

## 6) Sprint-Struktur

### Sprint 1 (parallel, ~5-7 Tage)
| Codex | Claude |
|-------|--------|
| Track 6: Timing-Middleware, Blocker-E2E-Suite | Track 3: Break Game M4 (Invite + Overlay + Drill) |
| Track 6: p95-Optimierung /today | Track 3: Copy + Motion Polish |

### Sprint 2 (~4-6 Tage) — nach Gate A + Gate B
| Codex | Claude |
|-------|--------|
| Track 4: Executor + Guards + Tests | Track 4: Parser + CommandPalette UI + Preview |

### Sprint 3 (~4-6 Tage)
| Codex | Claude |
|-------|--------|
| Track 5: Datenaggregation + API-Route + Tests | Track 5: WeeklyReview UI + Claude API Integration |

---

## 7) Master-Backlog

### Track 6 (Codex)
- [ ] Per-route Timing-Middleware
- [ ] Blocker E2E Suite (4 Specs)
- [ ] Flake-Budget Report in CI
- [ ] /today p95 optimieren
- [ ] SLO/Error Budget dokumentieren

### Track 3 (Claude + Codex)
- [ ] Break-Invite Trigger in LucianBubbleProvider
- [ ] LucianBreakOverlay.tsx (Minigame UI)
- [ ] targetDrill.ts (Spawn/Score/Combo)
- [ ] Break-End Reaction (celebrate/recovery)
- [ ] Unit tests (Codex)

### Track 4 (Claude + Codex)
- [ ] Parser AST types
- [ ] Deterministischer Command Parser
- [ ] Preview + Confirm UI
- [ ] Executor mit Guards
- [ ] Parser + Executor Tests

### Track 5 (Claude + Codex)
- [ ] Weekly Review Datenaggregation
- [ ] API-Route /api/review/weekly
- [ ] WeeklyReview.tsx Komponente
- [ ] Claude API Integration für Empfehlungen
- [ ] Unit Tests

---

## 8) Risiken

| Risiko | Mitigation |
|--------|-----------|
| Scope creep Track 3 + 4 | Harte Sprint-Grenzen, M4 ist eigenständiger Block |
| Flaky E2E ohne Isolation | Serial run + stable fixtures (Codex) |
| Command Parser edge cases | V1 deterministisch, AI fallback erst V2 |
| Weekly Review generisch | Claude API für Empfehlungstext, nicht rule-only |
| Claude + Codex auf gleicher Datei | File-Ownership-Tabelle pro Track verbindlich |
