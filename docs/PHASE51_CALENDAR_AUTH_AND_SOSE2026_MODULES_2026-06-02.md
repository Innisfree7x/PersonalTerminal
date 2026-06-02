# Phase 51 — Calendar Auth + SoSe 2026 Modules (2026-06-02)

Status: Implemented locally

## Ziel

Diese Welle behebt den Review-Stand vom 2026-06-02:

- Calendar-Range-Queries sollen echte Zeitüberlappung laden.
- Google-Ganztagstermine sollen korrekt als `allDay` abgebildet werden.
- Google-Calendar-Tokens sollen nicht länger als die INNIS-Session unkontrolliert weiterleben.
- `calendar_entries` soll im Supabase-Type-Contract sichtbar sein.
- Die SoSe-2026-Module des Users sollen reproduzierbar seedbar sein.

## Umgesetzt

### Calendar-Korrektheit

- `lib/supabase/calendarEntries.ts`
  - Range-Queries von Startdatum-Filter auf Overlap-Filter umgestellt:
    - `starts_at < to`
    - `ends_at > from`
  - KIT-Events mit nullable `ends_at` weiterhin tolerant behandelt.
  - Supabase-Client auf `Database` typisiert.

- `lib/calendar/calendarQueryCache.ts`
  - Cache-Reconciliation nutzt ebenfalls Overlap-Logik.

- `lib/calendar/calendarEntryRange.ts`
  - Neuer gemeinsamer Helper für lokale Tagesbereiche, Display-Day-Spans und Tagesüberlappung.

- Calendar-UI
  - `MonthlyGrid`
  - `WeeklyTemplateGrid`
  - `DayTimeline`
  - Mehrtägige und ganztägige Events werden nicht mehr nur am Starttag gebucketet.
  - Events, die exakt um 00:00 enden, laufen nicht fälschlich in den nächsten Tag hinein.

### Google Calendar

- `lib/google/calendar.ts`
  - Google-All-Day-Events behalten ihr exklusives Enddatum.
  - `allDay` wird im `CalendarEvent` gesetzt.

- `app/api/calendar/entries/route.ts`
  - Google-Entries übernehmen `allDay`.
  - Google-Typen werden in `CalendarEntryKind` gemappt.

- `app/actions/calendar.ts`
  - Server-Action-DTO transportiert `allDay`.
  - Calendar-Server-Actions prüfen die INNIS-Session.

### Auth-Hygiene

- `lib/auth/AuthProvider.tsx`
  - Normaler Logout ruft vor Supabase-Signout `/api/auth/google/disconnect` auf.
  - Google-OAuth-Cookies werden dadurch beim Logout defensiv gelöscht.

### Supabase-Typen

- `lib/supabase/types.ts`
  - `calendar_entries` als typisierte Tabelle ergänzt.

### SoSe 2026 Module

- `scripts/seedSoSe2026Courses.ts`
  - Idempotenter Upsert für die 47,5-ECTS-SoSe-2026-Module.
  - Aktualisiert bestehende Kurse nach `name + semester`.
  - Erstellt fehlende `exercise_progress`-Rows und trimmt überzählige.

- `package.json`
  - Neuer Script-Einstieg: `npm run seed:suse2026`.

## SoSe-2026-Modulplan

| Modul | ECTS | Prüfung / Format |
| --- | ---: | --- |
| Einführung in das OR | 9 | 2026-08-11 |
| Taktisches und operatives SCM | 4.5 | 2026-08-12 |
| Investments | 4.5 | 2026-08-13 |
| VWL 2 / Makroökonomie | 5 | 2026-08-20 |
| Python Algos Fahrzeugtechnik | 4 | 2026-08-26 |
| Elektrotechnik 1 | 3 | 2026-09-15 |
| Grundsätze Nutzfahrzeugentwicklung | 4 | 2026-09-18 |
| Öffentliche Einnahmen | 4.5 | 2026-09-25 |
| Financial Data Science | 9 | keine Klausur, Abgaben |

Summe: 47,5 ECTS.

## Seed-Hinweis

Der Seed läuft über RLS mit einem normalen User-Login. Benötigt:

- `INNIS_COURSE_SEED_EMAIL`
- `INNIS_COURSE_SEED_PASSWORD`

Lokaler Stand am 2026-06-02:

- Supabase URL und Anon Key sind lokal vorhanden.
- Seed-Credentials sind lokal nicht gesetzt.
- `npm run seed:suse2026` stoppt deshalb vor dem Supabase-Write mit dem erwarteten Credential-Hinweis.
- Die Module sind vorbereitet, aber noch nicht gegen Supabase ausgeführt.

## Tests

Neue/erweiterte Coverage:

- `tests/unit/calendar-entry-range.test.ts`
- `tests/unit/calendar-query-cache.test.ts`
- `tests/unit/WeeklyTemplateGrid.test.tsx`
- `tests/unit/google-calendar.test.ts`
- `tests/unit/api/calendar-entries-route.test.ts`

## Verifikation

Ausgeführt:

- `npm run type-check` — grün
- `npm run lint` — grün
- `npx vitest run tests/unit/calendar-entry-range.test.ts tests/unit/calendar-query-cache.test.ts tests/unit/WeeklyTemplateGrid.test.tsx tests/unit/google-calendar.test.ts tests/unit/api/calendar-entries-route.test.ts tests/unit/api/calendar.test.ts` — grün, 26 Tests
- `npm run test:unit` — grün, 118 Files / 495 Tests
- `npm run build` — grün
- `npm run seed:suse2026` — blockiert erwartungsgemäß ohne `INNIS_COURSE_SEED_EMAIL` und `INNIS_COURSE_SEED_PASSWORD`
