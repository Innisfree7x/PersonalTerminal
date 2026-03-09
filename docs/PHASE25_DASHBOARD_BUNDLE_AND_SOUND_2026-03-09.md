# Phase 25 — Today Bundle + Focus-End Sound (2026-03-09)

Status: Implemented  
Scope: Wave 25 Start (`/today` Query-Bundle Erweiterung + Session-End Sound-Qualität)

## Ziel

1. Session-End Sound verbessern (weniger hart, hochwertigerer Abschluss).
2. `/today` weiter bündeln, damit Week-Events nicht separat nachgeladen werden müssen.

## Umsetzung

### 1) Focus-End Sound überarbeitet

- Datei: `components/providers/SoundProvider.tsx`
- Änderungen:
  - `focus-end` Gain reduziert (`0.65` -> `0.52`) für weniger aggressiven Peak.
  - Synthese ersetzt:
    - alt: kurzer, harter Single-Tone
    - neu: weicher 3-Noten-Chime (C5/E5/G5), Sine-Oszillatoren, Low-Pass, sauberes Envelope-Fade.
  - Bei `Teams Default` wird `focus-end` auf `/sounds/teams-default.mp3` gemappt.

Ergebnis: Session-End klingt deutlich runder und weniger "alarmartig".

### 2) Week-Events in Next-Tasks-Bundle integriert

- Neue Shared-Query:
  - Datei: `lib/dashboard/weekEvents.ts`
  - Funktion: `getDashboardWeekEvents(userId, weekOffset)`
- `GET /api/dashboard/week-events` nutzt jetzt die Shared-Query:
  - Datei: `app/api/dashboard/week-events/route.ts`
- `GET /api/dashboard/next-tasks` unterstützt jetzt CSV-Includes:
  - Datei: `app/api/dashboard/next-tasks/route.ts`
  - `include=trajectory_morning,week_events`
  - Gibt optional `weekEvents` im selben Payload zurück.
  - Server-Timing erweitert (`week_build`).

### 3) Today konsumiert das Bundle

- Datei: `app/(dashboard)/today/page.tsx`
  - Fetch URL umgestellt auf:
    - `/api/dashboard/next-tasks?include=trajectory_morning,week_events`
  - Prefetched Week-Events werden an `WeekOverview` gereicht.
- Datei: `components/features/dashboard/WeekOverview.tsx`
  - Prefetch wird nur für `weekOffset === 0` verwendet.
  - Beim Navigieren in andere Wochen wird weiterhin normal gefetcht.
  - Zurück auf aktuelle Woche nutzt wieder Prefetch (kein redundanter Call).

## Tests / Verifikation

- `tests/unit/api/dashboard-next-tasks-route.test.ts`
  - erweitert um:
    - `include=week_events`
    - CSV-`include=trajectory_morning,week_events`
- `tests/integration/Dashboard.test.tsx`
  - Erwartung auf neue Bundle-URL angepasst.

Lokal ausgeführt:

- `npm run test -- --run tests/unit/api/dashboard-next-tasks-route.test.ts tests/integration/Dashboard.test.tsx` ✅
- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run build` ✅

## Ergebnis

- Besserer Session-End Sound (akustisch hochwertiger, weniger scharf).
- `/today` reduziert weitere redundante Datenwege durch Week-Events im bestehenden Next-Tasks-Bundle.
- WeekOverview bleibt funktional für Week-Navigation ohne Regression.

## Nachtrag: Theme Readability Pass (alle Themes)

Zusätzlich umgesetzt für bessere Lesbarkeit in Gold/Platinum/Sapphire/Copper/Amethyst und Core-Themes:

- Dateien:
  - `app/globals.css`
  - `app/(dashboard)/today/page.tsx`
  - `components/features/dashboard/CommandBar.tsx`

- Änderungen:
  - Dashboard-Surfaces (`.card-surface`, `.dashboard-premium-card`, `.dashboard-premium-card-soft`) weniger "schwarz", stärkeres Theme-Tinting, klarere Border-Kontraste.
  - Morning-Briefing typografisch verdichtet und lesbarer gemacht (größere Grundschrift, stärkere Badge-Kontraste, bessere sekundäre Texte).
  - CommandBar Micro-Typografie kontrastreicher (`meta`/`labels`/muted chips).

Verifikation (erneut):

- `npm run type-check` ✅
- `npm run lint` ✅
- `npm run build` ✅

## Nachtrag 2: Gold/Platinum Feintuning

Gezielt für Premium-Themes umgesetzt, damit der Gold-Look stärker zur Geltung kommt und Platinum nicht zu dunkel wirkt:

- Datei: `app/globals.css`
- Änderungen:
  - `gold`: `text-secondary`/`text-tertiary` angehoben für bessere Lesbarkeit.
  - `platinum`: `text-secondary`/`text-tertiary` angehoben.
  - Theme-spezifische Glass-Overrides für:
    - `.card-surface`
    - `.card-surface-hover`
    - `.dashboard-premium-card-soft`
    - `.dashboard-premium-card`
  - Ziel: weniger Black-Crush, mehr Premium-Tint, klarere Kontraste auf Widgets und Briefing-Karten.
