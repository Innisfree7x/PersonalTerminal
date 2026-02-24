# High-End Duo Playbook (Codex + Claude)

Stand: 2026-02-21  
Ziel: Dieses Dokument ist euer wiederverwendbares System fuer neue Projekte mit hoher Engineering-Qualitaet.

## 1. Core Prinzipien

1. Build fuer echte Nutzung, nicht fuer Demo-Screens.
2. Erst Stabilitaet + Datenkonsistenz, dann visuelle Politur.
3. Jede grosse Entscheidung braucht klare `Definition of Done`.
4. Keine "magischen" Features ohne Messbarkeit (Events/KPIs).
5. Immer mit Release-Disziplin arbeiten, auch als Solo-Founder.

## 2. Rollenaufteilung (Duo-Mode)

## Codex (System-Track)
- Architektur, Datenmodell, RLS, API/Server Actions, CI/CD.
- Performance-Bottlenecks, Reliability, Security, QA-Gates.
- Error-Handling, Runbooks, Migrations, Release-Safety.

## Claude (Experience-Track)
- UI/UX-Iteration, Content/Copy, Onboarding-Narrative.
- Marketing-Seiten, Empty States, visuelle Explorations.
- Schnellere Varianten und Produkt-Kommunikation.

## Goldene Regel
- Nie gleichzeitig dieselbe Datei bearbeiten.
- Vor jedem Start: File Ownership klar festlegen.

## 3. Projektstart (Day 0-2)

## Day 0: Foundation
1. Stack + Architekturpfade festlegen (kurz, konkret).
2. DB-Schema + `user_id` + RLS von Anfang an richtig.
3. Envs + Secrets sauber definieren (`.env.example` + Runbook).
4. Baseline Tests und CI-Grundgeruest einziehen.

## Day 1: Minimal Vertical Slice
1. Ein End-to-End Flow komplett liefern (Auth -> Core Action -> Persistenz).
2. Fehlerpfade sofort mitbauen (nicht spaeter).
3. Logging/Monitoring-Basis setzen.

## Day 2: Quality Lock
1. Typecheck, Lint, Unit Tests, Blocker-E2E in CI.
2. Release Checklist + Go-Live Runbook anlegen.
3. "Can ship today?"-Frage immer ehrlich beantworten.

## 4. Quality Gates (non-negotiable)

- `npm run type-check` gruen
- `npm run lint` gruen
- `npx vitest run` gruen
- Blocker E2E gruen (kritische Nutzerjourneys)
- Keine offenen Security-Blocker (RLS/Auth/Secrets)
- Smoke-Test auf Production erfolgreich

Wenn einer rot ist: kein "nur kurz deployen".

## 5. Feature-Delivery-Muster (immer gleich)

1. Problem + Erfolgskriterium in 2-3 Saetzen.
2. Minimalen Scope schneiden.
3. Erst Daten-/API-Schicht, dann UI.
4. Optimistic UI nur mit sauberem Rollback.
5. Tests fuer den kritischen Pfad.
6. Doku sofort aktualisieren (`README`, Phase-Doc, Runbook falls relevant).

## 6. Prompt-Templates (Copy/Paste)

## 6.1 Prompt an Codex (System)
```text
Arbeite im System-Track:
- Ziel: <konkretes Ergebnis>
- Scope: <Dateien/Module>
- Muss enthalten: Auth-Guards, Error-Handling, Tests, Doku-Update
- Done wenn: type-check/lint/tests gruen + kurzer Risiko-Check
Bitte direkt implementieren, nicht nur planen.
```

## 6.2 Prompt an Claude (Experience)
```text
Arbeite im Experience-Track:
- Ziel: <UI/UX Ergebnis>
- Style Direction: <z.B. dark red/gold, premium, minimal>
- Fokus: Empty States, Onboarding clarity, Conversion
- Keine Eingriffe in: <Codex-owned Dateien>
Bitte mit klaren Copy-Verbesserungen und konsistentem Designsystem liefern.
```

## 6.3 Audit-Prompt (beide)
```text
Audit den aktuellen Stand hart und konkret:
1) Bugs/Regressionen (Severity sortiert)
2) Sicherheits-/Datenrisiken
3) UX-Brueche in Kernjourneys
4) Fehlende Tests
5) Exakte Fix-Reihenfolge (P0/P1/P2)
Keine Floskeln, nur umsetzbare Findings.
```

## 7. Weekly Arbeitsrhythmus

1. Montag: Top-3 Outcomes festlegen (nicht 20 Tasks).
2. Taeglich: 1 Delivery-Block + 1 Audit-Block.
3. Vor jedem Push: kurze lokale Gates.
4. Ende der Woche: Release-Snapshot + Lessons Learned.

## 8. Anti-Patterns (aus Learnings)

1. RLS spaeter "nachziehen" -> fuehrt fast immer zu Chaos.
2. Zu frueh neue Features statt bestehende Flows stabilisieren.
3. Marketing-Copy verspricht mehr als Produkt wirklich kann.
4. Docs nur sporadisch pflegen -> Kontextverlust + falsche Entscheidungen.
5. Ohne klare Duo-Grenzen arbeiten -> Merge-Konflikte + Rework.

## 9. Launch-Readiness Minimum

Ein Projekt ist erst "ready", wenn:
- Neue User ohne Hilfe in Core Value kommen.
- Kritische Flows stabil und messbar laufen.
- Envs/Secrets/cron/notifications sauber gesetzt sind.
- Rollback klar ist.
- Doku den echten Zustand beschreibt (nicht Wunschzustand).

## 10. Reuse-Checklist fuer neue Projekte

Vor Start eines neuen Projekts:
1. Dieses Playbook kopieren.
2. `docs/RELEASE_CHECKLIST.md` + `docs/GO_LIVE_RUNBOOK.md` sofort anlegen.
3. Duo-Zonen definieren (Codex/Claude).
4. KPI-Events minimal planen (`signup`, `first_value`, `retention`).
5. Phase-Plan nur mit messbaren Meilensteinen.

Wenn das steht, startet ihr schneller und mit deutlich weniger Rework.

