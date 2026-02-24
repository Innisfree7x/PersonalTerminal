> **Status: Archived (Historical).**
> This document is kept for historical traceability and is **not** the active execution source anymore.
> Use docs/PHASE12_MASTERPLAN.md and docs/CONTEXT_CANON.md as canonical context.

# Phase 11: Core UX, Performance & Notifications

Stand: 2026-02-21
Status: Archived — implementation baseline moved to docs/PHASE11_TRACK6_IMPLEMENTATION.md
Scope: Bug Fixes, Performance, E2E-Stabilisierung, Lucian Context-Aware, Email-Notifications

---

## Kontext & Priorisierung

Phase 11 kombiniert zwei Dinge:
- **Technische Schulden** die sich im eigenen Betrieb zeigen (Bugs, Performance, Tests)
- **Echter Nutzerwert** der fehlt (Lucian macht nichts, keine Erinnerungen)

Was explizit **nicht** in Phase 11 gehört:
- SLO/Error-Budget-Infrastruktur → erst nach echten Usern sinnvoll (Phase 12+)
- Vollständige Timing-Instrumentierung aller Endpoints → Vercel SpeedInsights übernimmt das bereits
- Neues Feature-Modul (Mobile, AI, Stripe) → Phase 12

---

## Milestones

### M1 — Bug Fixes (sofort, Claude)

#### M1.1 Analytics-Tab Real-Time Sync
**Problem:** Nach einer Focus-Session aktualisiert sich der Analytics-Tab nicht automatisch.
`refetchOnWindowFocus: false` + `refetchOnReconnect: false` in `app/(dashboard)/analytics/page.tsx` verhindert, dass beim Tab-Wechsel neue Daten geladen werden.

**Fix:** In `app/(dashboard)/analytics/page.tsx`:
- `refetchOnWindowFocus: false` → `true` auf beiden Queries (`['focus', 'analytics', selectedRange]` und `['focus', 'sessions', 'recent']`)
- `staleTime: 60 * 1000` → `30 * 1000` (30s, damit nach Session-Ende schneller aktualisiert wird)

**Dateien:**
- `app/(dashboard)/analytics/page.tsx`

---

#### M1.2 PowerHotkeysProvider Double-Fetch Fix
**Problem:** `components/providers/PowerHotkeysProvider.tsx` holt Dashboard-Daten mit eigenem Query-Key `['power-hotkeys', 'next-tasks']` statt dem zentralen Key `['dashboard', 'next-tasks']`. Das erzeugt einen unnötigen zweiten API-Call beim gleichen Endpoint.

**Fix:** In `PowerHotkeysProvider.tsx` denselben Query-Key verwenden wie `today/page.tsx`:
```ts
queryKey: ['dashboard', 'next-tasks']
```
Damit wird der Cache geteilt, kein zweiter Fetch.

**Dateien:**
- `components/providers/PowerHotkeysProvider.tsx`

---

### M2 — Performance (Codex)

#### M2.1 DB Composite Indexes
Neue Migration `docs/migrations/2026-02-21_phase11_perf_indexes.sql`:

```sql
-- Daily Tasks: Hauptabfrage auf Today-Page
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date
  ON daily_tasks(user_id, date, completed);

-- Exercise Progress: Toggle + Progress-Fetch
CREATE INDEX IF NOT EXISTS idx_exercise_progress_user_course
  ON exercise_progress(user_id, course_id, exercise_number);

-- Job Applications: Kanban-Board nach Status
CREATE INDEX IF NOT EXISTS idx_job_applications_user_status
  ON job_applications(user_id, status, interview_date);

-- Goals: Filter nach Target-Date
CREATE INDEX IF NOT EXISTS idx_goals_user_target
  ON goals(user_id, target_date);

-- Focus Sessions: Analytics-Queries nach Zeitraum
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started
  ON focus_sessions(user_id, started_at DESC);
```

**Dateien:**
- `docs/migrations/2026-02-21_phase11_perf_indexes.sql` (neu)

---

#### M2.2 Dashboard Query-Optimierung
**Problem:** `fetchGoals` und `fetchApplications` nutzen Default-Pagination (20 Items) ohne expliziten Limit für den Dashboard-Use-Case. `select('*')` auf großen Tabellen lädt unnötige Felder.

**Fix in `lib/dashboard/queries.ts`:**
- Dashboard-spezifische Reads mit `select()` nur auf benötigten Feldern
- Explizite `limit`-Strategie: für Dashboard max. 5 Goals, 5 Applications
- Filter soweit möglich in SQL (nicht in-memory)

**Fix in `components/providers/PowerHotkeysProvider.tsx`:**
- Query nur aktivieren wenn Hotkey-Overlay offen ist (`enabled: isOverlayOpen`)

**Dateien:**
- `lib/dashboard/queries.ts`
- `components/providers/PowerHotkeysProvider.tsx`

---

### M3 — E2E Blocker-Suite (Codex)

#### M3.1 Blocker-Flows markieren
Blocker-Flows (Release-blockierend wenn rot):
- Login → `/today`
- Task erstellen
- Exercise togglen

Umsetzung: Eigener Ordner `tests/e2e/blocker/` oder `@blocker` Tag im Testtitel.

#### M3.2 Shared-State-Flakes verhindern
**Problem:** `fullyParallel: true` + Shared Credentials → parallele Specs können sich gegenseitig Testdaten zerstören.

**Fix:**
- Blocker-Suite in CI serialisieren: `workers: 1` für Blocker-Run
- Keine `sleep()`-Waits, nur event-/state-getriebene Waits (`waitForURL`, `waitForSelector`)
- Testdaten mit Timestamp-Suffix isolieren (bereits teilweise gemacht, konsequent durchziehen)

#### M3.3 Nightly Flake-Check (optional, wenn CI-Budget vorhanden)
- Blocker-Suite mit `--repeat-each=10` nightly
- Ziel: Flake-Rate < 2%

**Dateien:**
- `tests/e2e/blocker/` (neu)
- `playwright.config.mjs`
- `.github/workflows/ci.yml`

---

### M4 — Lucian Context-Aware (Claude + Codex)

**Ziel:** Lucian liest echte User-Daten und gibt konkrete, relevante Hinweise — kein statischer Text, keine KI-API-Kosten.

#### Hint-Logik (Priorität-Reihenfolge)

```
1. KRITISCH — Prüfung in ≤ 3 Tagen
   → "Prüfung [Kursname] übermorgen. Alles vorbereitet?"

2. DRINGEND — Prüfung in ≤ 7 Tagen + letzte Focus-Session > 2 Tage zurück
   → "Letzte Lernsession vor 3 Tagen — Prüfung [Kursname] in 5 Tagen."

3. AUFGABEN — Heute keine Aufgabe erledigt + es ist nach 14 Uhr
   → "Noch nichts erledigt heute. Was ist deine eine Sache?"

4. ÜBUNGSBLÄTTER — Offene Blätter + Abgabe diese Woche
   → "Blatt [N] in [Kursname] noch offen."

5. KARRIERE — Bewerbung seit > 14 Tagen ohne Status-Update
   → "Keine Rückmeldung von [Firma] seit 2 Wochen. Follow-up?"

6. STANDARD — Kein kritischer Trigger
   → Kein Hint (Lucian schweigt lieber als zu nerven)
```

**Implementierung:**

Neue Datei `lib/lucian/hints.ts`:
- `getLucianHint(data: LucianContext): string | null`
- `LucianContext`: Typ mit courses (+ examDates), tasks (today), focusSessions (last 7d), applications

Angepasst in `components/features/lucian/LucianBubble.tsx` (oder Equivalent):
- Daten via React Query fetchen (kein neuer API-Call nötig — Dashboard-Queries wiederverwenden)
- Hint nur anzeigen wenn `getLucianHint()` !== null
- Max. 1x pro Session anzeigen (localStorage-Flag `innis_lucian_shown_at`)

**Dateien:**
- `lib/lucian/hints.ts` (neu)
- `components/features/lucian/LucianBubble.tsx` (modify)

**Claude schreibt:** Hint-Texte (alle Varianten, Tonalität) + Logik-Spec
**Codex implementiert:** `getLucianHint()` Funktion + Daten-Fetching

---

### M5 — Email Notifications (Codex + Claude)

#### Setup-Voraussetzungen (Codex)
- **Resend** als Email-Provider (kostenlos bis 3.000 Mails/Monat, einfache API)
- **Vercel Cron Jobs** für Scheduling (kostenlos im Hobby-Plan)
- `RESEND_API_KEY` als Environment Variable in Vercel

#### M5.1 Deadline-Reminder Emails

**Trigger:** Vercel Cron täglich um 08:00 Uhr
**Logik:** Für jeden User: Kurse mit `examDate` in genau 14, 7 oder 3 Tagen → Email senden

**Cron-Route:** `app/api/cron/deadline-reminders/route.ts`
```
GET /api/cron/deadline-reminders
→ Auth: CRON_SECRET Header
→ Alle User mit Kursen + examDate abfragen
→ Für jeden Treffer: Resend Email senden
```

**Email-Inhalt (Claude schreibt die Texte):**

Betreff (14 Tage): `📅 Prüfung in 2 Wochen — [Kursname]`
Betreff (7 Tage): `⚠️ Noch 7 Tage bis zur Prüfung — [Kursname]`
Betreff (3 Tage): `🔴 Prüfung übermorgen — [Kursname]`

Body: Einfaches HTML-Template (kein fancy Design nötig):
```
Hallo [Name],

deine Prüfung in [Kursname] ist am [Datum] — also in [N] Tagen.

→ Zum Dashboard: https://innis.io/today

Viel Erfolg,
INNIS

---
Du erhältst diese Email weil du Kurse in INNIS angelegt hast.
Einstellungen: https://innis.io/settings
```

---

#### M5.2 Weekly Progress Report

**Trigger:** Vercel Cron jeden Montag um 08:00 Uhr
**Logik:** Für jeden User: Letzte Woche aggregieren → Email senden

**Cron-Route:** `app/api/cron/weekly-report/route.ts`

**Email-Inhalt — was drin steht:**

```
Deine Woche (KW [N])
────────────────────────
Fokus-Zeit gesamt:   4h 30min  (↑ 45min vs. Vorwoche)
Sessions:            8

Nach Kurs:
  Lineare Algebra    2h 15min  ████████░░
  Theo. Informatik   1h 45min  ███████░░░
  Sonstiges          0h 30min  ██░░░░░░░░

Aufgaben:            6 erledigt, 2 offen

Kommende Deadlines:
  Prüfung LA II      in 12 Tagen (15. März)
  Übungsblatt 9      noch offen
────────────────────────
→ Zum Dashboard öffnen
```

**Vergleich zur Vorwoche** nur wenn Vorwoche-Daten vorhanden, sonst weglassen.

---

#### M5.3 User-Präferenz (Opt-Out)
Neues Feld in User-Profil/Metadata: `email_notifications: boolean` (default: true)
Settings-Seite: Toggle "E-Mail-Benachrichtigungen" unter Datenschutz & Analytics.

**Dateien:**
- `app/api/cron/deadline-reminders/route.ts` (neu)
- `app/api/cron/weekly-report/route.ts` (neu)
- `lib/email/templates.ts` (neu — HTML-Templates)
- `lib/email/resend.ts` (neu — Resend Client)
- `app/(dashboard)/settings/page.tsx` (Opt-Out Toggle)
- `vercel.json` (Cron-Config)

---

## Arbeitsaufteilung

### Claude Track
| Task | Deliverable |
|------|-------------|
| M1.1 Analytics Sync Fix | Code-Änderung in `analytics/page.tsx` |
| M1.2 PowerHotkeys Fix | Code-Änderung in `PowerHotkeysProvider.tsx` |
| M4 Lucian Hint-Texte | Alle Hint-Strings + Logik-Spec in `lib/lucian/hints.ts` |
| M5 Email Copy | Betreffzeilen + Body-Texte für beide Email-Typen |
| M5 Settings Opt-Out Copy | Toggle-Label + Beschreibungstext |

### Codex Track
| Task | Deliverable |
|------|-------------|
| M2.1 DB Indexes | Migration SQL-File |
| M2.2 Query-Optimierung | Dashboard-Queries überarbeiten |
| M3 E2E Blocker-Suite | Blocker-Folder + CI-Config |
| M4 Lucian Implementierung | `getLucianHint()` + Daten-Fetching in Component |
| M5 Resend Setup | Resend Client + Cron-Routes + Vercel-Config |
| M5 Opt-Out Toggle | Settings-Page + Profil-Metadata |

---

## Reihenfolge

```
M1 (Claude, sofort) → M2 (Codex, parallel zu M1) → M4 (Claude Spec + Codex Impl) → M5 (Claude Copy + Codex Impl) → M3 (Codex)
```

M3 (E2E) läuft als letztes weil es von stabilen Features abhängt.

---

## Definition of Done

| Milestone | DoD |
|-----------|-----|
| M1 | Analytics-Tab aktualisiert sich nach Session ohne Page-Reload. Double-Fetch weg (Network-Tab zeigt 1 statt 2 Calls). |
| M2 | Migration deployed. Dashboard-Load subjektiv schneller. Keine `select('*')` auf großen Tabellen ohne Limit. |
| M3 | Blocker-Suite läuft seriell in CI. Kein Flake in 5 aufeinanderfolgenden Runs. |
| M4 | Lucian zeigt kontextuellen Hint wenn Prüfung ≤ 7 Tage. Schweigt wenn kein Trigger. Max 1x/Session. |
| M5 | Test-Email für Deadline-Reminder + Weekly Report empfangen. Opt-Out in Settings funktioniert. |

---

## Entscheidungspunkte vor Start

1. **Resend-Account:** Muss angelegt werden (kostenlos). API-Key in Vercel als `RESEND_API_KEY` hinterlegen.
2. **CRON_SECRET:** Zufälliger String als Vercel Env-Var, schützt Cron-Routes vor unautorisiertem Aufruf.
3. **Email-Absender:** Absender-Adresse für Resend braucht verifizierte Domain. Entweder `noreply@innis.io` (nach Domain-Kauf) oder temporär Resend-Subdomain nutzen.
4. **SLO-Infrastruktur:** Bewusst auf Phase 12 verschoben. Erst nach echten Usern sinnvoll.

---

## Execution Status (2026-02-21)

### Done
- `M1.1` Analytics real-time refetch angepasst (`app/(dashboard)/analytics/page.tsx`)
- `M1.2` Query-Key-Konsolidierung + Fetch-Gating im PowerHotkeys Provider
- `M2.1` Performance-Index-Migration erstellt (`docs/migrations/2026-02-21_phase11_perf_indexes.sql`)
- `M2.2` Dashboard-Reads auf selektive, limitierte Queries umgestellt (`lib/dashboard/queries.ts`)
- `M3.1` Blocker-Suite angelegt (`tests/e2e/blocker/*`)
- `M3.2` CI auf serialisierte Blocker-Suite umgestellt (`.github/workflows/ci.yml`)
- `M4` Context-aware Lucian-Hints integriert (`lib/lucian/hints.ts`, `components/providers/LucianBubbleProvider.tsx`)
- `M5.1` Deadline-Reminder Cron + Templates + Versandpfad implementiert
- `M5.2` Weekly-Report Cron + Aggregation + Versandpfad implementiert
- `M5.3` Email-Opt-out Toggle in Settings integriert und an `user_metadata.email_notifications` gebunden

### Offen vor endgültigem Production-Abschluss
- SQL-Migration aus `docs/migrations/2026-02-21_phase11_perf_indexes.sql` auf Supabase Production ausführen.
- Cron-ENVs in Vercel setzen (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`).
- Finalen CI-Run mit aktivierten E2E-Secrets verifizieren.
