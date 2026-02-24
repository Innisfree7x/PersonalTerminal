> **Status: Archived (Historical).**
> This document is kept for historical traceability and is **not** the active execution source anymore.
> Use docs/PHASE12_MASTERPLAN.md and docs/CONTEXT_CANON.md as canonical context.

# Phase 10.1 — Metrics Spec (Claude Track)

Deliverables: Funnel-Definition, KPI-Queries, Consent-Copy.
Stand: 2026-02-19

---

## 1. Funnel-Definition

### Was zählt für die Go/No-Go Scorecards?

#### Onboarding Completion Rate (Ziel: ≥ 60 %)

**Definition:**
> Anteil der Nutzer, bei denen das Event `onboarding_completed` innerhalb von 24 Stunden nach `signup_completed` fired.

**Begründung:**
- `onboarding_started` ist unzuverlässig als Basis (wird auch bei Page-Reload erneut getriggert).
- `signup_completed` = zuverlässiger Einstiegspunkt, weil er pro Konto exakt einmal feuert.
- 24-Stunden-Fenster: Nutzer, die den Browser schließen und am nächsten Tag weitermachen, zählen noch als Completed — alles darüber hinaus gilt als Abgebrochen.

**Formel (Vercel Analytics):**
```
Completion Rate = unique_users(onboarding_completed) / unique_users(signup_completed) × 100
```
Gemessen pro Kalendermonat oder Kohorte (Signup-Woche).

---

#### First-Value Rate (Ziel: ≥ 50 %)

**Definition:**
> Anteil der Nutzer, bei denen `first_task_created` **oder** `first_course_created` fired.

**Was zählt:**
| Event | Bedeutung | Zählt als First-Value? |
|-------|-----------|----------------------|
| `first_task_created` | Erste Aufgabe in Onboarding Schritt 4 erstellt | ✅ ja |
| `first_course_created` | Mindestens 1 Kurs in Onboarding Schritt 3 erstellt | ✅ ja |
| `demo_seed_started` | Demo-Daten geladen (kein echter Nutzer-Input) | ❌ nein |
| `onboarding_completed` ohne task/course | Wizard durchgeklickt, nichts erstellt | ❌ nein |

**Warum Demo-Seed nicht zählt:**
Demo-Seeding ist ein Engagement-Tool, nicht echter First-Value. Der Nutzer hat nichts geplant. Separate Metrik `demo_seed_rate` sinnvoll, aber nicht für die Go/No-Go-Schwelle.

**Formel:**
```
First-Value Rate = unique_users(first_task_created OR first_course_created) / unique_users(signup_completed) × 100
```

**Payload-Felder für Segmentierung:**
- `onboarding_completed.task_created: boolean` → Task-only Anteil
- `onboarding_completed.courses_count: number` → Course-only Anteil
- Beide zusammen messbar über `first_task_created` + `first_course_created` parallel

---

#### Day-2-Return Rate (Beobachtungsmetrik, kein Go/No-Go-Blocker)

**Definition:**
> Anteil der Nutzer mit `signup_completed`, bei denen innerhalb von 48 Stunden ein `day2_return` fired.

**Implementierungsdetail:**
- `day2_return` fired in `app/auth/login/page.tsx` wenn `innis_last_seen_at` ≥ 24h zurückliegt.
- Messung: nicht exakt auf Tag 2 beschränkt — jede Rückkehr nach ≥24h nach dem ersten Login gilt.

**Warum nicht im Go/No-Go:**
Kein Target definiert, zu früh für statistische Aussagen bei kleinen Kohorten. Wird erst nach 2 Wochen Live-Betrieb aussagekräftig.

---

## 2. KPI-Queries + Dashboard-Spec

### 2a. Primärer Provider: Vercel Analytics

Events landen in Vercel Analytics via `track()` aus `lib/analytics/marketing.ts`.
Custom Event-Namen sind direkt im Dashboard unter "Custom Events" auswertbar.

**Setup-Voraussetzungen:**
- `@vercel/analytics` korrekt eingebunden (im `layout.tsx` als `<Analytics />` Component)
- Alle Events haben konsistente Namen (kein `_` vs `-` Mismatch)
- Payload-Properties erscheinen als Filter-Dimensionen im Dashboard

**Vercel Analytics Dashboard — empfohlene Views:**

| View | Konfiguration |
|------|--------------|
| Signup Funnel | Events: `signup_started` → `signup_completed` → `onboarding_completed` |
| Onboarding Dropoff | Event: `onboarding_step_completed`, gruppiert nach `step` (0–4) |
| First-Value Split | Events: `first_task_created` vs `first_course_created` (unique users) |
| Day2 Return | Event: `day2_return` / `signup_completed` (unique users, 30-Tage-Zeitraum) |
| Demo Usage | Event: `demo_seed_started` vs `demo_seed_removed` |
| Landing-to-Signup | Events: `landing_cta_clicked` → `signup_started` |

---

### 2b. KPI-Queries (Pseudo-SQL für künftige DB-Integration)

Wenn `/api/analytics/event` persistiert wird (z.B. via Supabase `analytics_events` Tabelle):

**Schema-Annahme:**
```sql
CREATE TABLE analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}',
  user_id     uuid REFERENCES auth.users(id),  -- nullable für anonyme Events
  session_id  text,
  created_at  timestamptz DEFAULT now()
);
```

---

**Query 1: Onboarding Completion Rate (Kohorte = Signup-Woche)**
```sql
WITH cohort AS (
  SELECT
    user_id,
    date_trunc('week', created_at) AS signup_week,
    created_at AS signed_up_at
  FROM analytics_events
  WHERE name = 'signup_completed'
    AND user_id IS NOT NULL
),
completed AS (
  SELECT DISTINCT e.user_id
  FROM analytics_events e
  JOIN cohort c ON c.user_id = e.user_id
  WHERE e.name = 'onboarding_completed'
    AND e.created_at BETWEEN c.signed_up_at AND c.signed_up_at + INTERVAL '24 hours'
)
SELECT
  c.signup_week,
  COUNT(DISTINCT c.user_id)         AS signups,
  COUNT(DISTINCT comp.user_id)      AS completed,
  ROUND(
    COUNT(DISTINCT comp.user_id)::numeric / NULLIF(COUNT(DISTINCT c.user_id), 0) * 100, 1
  )                                 AS completion_rate_pct
FROM cohort c
LEFT JOIN completed comp ON comp.user_id = c.user_id
GROUP BY c.signup_week
ORDER BY c.signup_week DESC;
```

---

**Query 2: Onboarding Dropoff per Step**
```sql
WITH base AS (
  SELECT
    (payload->>'step')::int AS step,
    COUNT(DISTINCT user_id) AS users_reached
  FROM analytics_events
  WHERE name = 'onboarding_step_completed'
    AND created_at >= now() - INTERVAL '30 days'
  GROUP BY step
),
total AS (
  SELECT COUNT(DISTINCT user_id) AS started
  FROM analytics_events
  WHERE name = 'onboarding_started'
    AND created_at >= now() - INTERVAL '30 days'
)
SELECT
  b.step,
  b.users_reached,
  t.started                                              AS users_started,
  ROUND(b.users_reached::numeric / NULLIF(t.started, 0) * 100, 1) AS reached_pct,
  LAG(b.users_reached) OVER (ORDER BY b.step)           AS prev_step_users,
  ROUND(
    (LAG(b.users_reached) OVER (ORDER BY b.step) - b.users_reached)::numeric
    / NULLIF(LAG(b.users_reached) OVER (ORDER BY b.step), 0) * 100, 1
  )                                                      AS dropoff_pct
FROM base b, total t
ORDER BY b.step;
```

Erwartetes Ergebnis pro Step:
- Step 1 (Welcome → Loslegen): Dropoff i.d.R. < 10 %
- Step 2 (Profile): Dropoff 5–15 %
- Step 3 (Courses): **kritisch** — hier höchster Abbruch erwartet (Formular-Aufwand)
- Step 4 (Task): Dropoff < Step 3 (einfacheres Formular)
- Step 5 (Complete → Dashboard): < 5 %

---

**Query 3: First-Value Rate (Task vs. Course)**
```sql
WITH base AS (
  SELECT COUNT(DISTINCT user_id) AS total_signups
  FROM analytics_events
  WHERE name = 'signup_completed'
    AND created_at >= now() - INTERVAL '30 days'
),
task_creators AS (
  SELECT COUNT(DISTINCT user_id) AS users
  FROM analytics_events
  WHERE name = 'first_task_created'
    AND created_at >= now() - INTERVAL '30 days'
),
course_creators AS (
  SELECT COUNT(DISTINCT user_id) AS users
  FROM analytics_events
  WHERE name = 'first_course_created'
    AND created_at >= now() - INTERVAL '30 days'
),
any_value AS (
  SELECT COUNT(DISTINCT user_id) AS users
  FROM analytics_events
  WHERE name IN ('first_task_created', 'first_course_created')
    AND created_at >= now() - INTERVAL '30 days'
)
SELECT
  b.total_signups,
  t.users  AS task_creators,
  c.users  AS course_creators,
  a.users  AS any_first_value,
  ROUND(a.users::numeric / NULLIF(b.total_signups, 0) * 100, 1) AS first_value_rate_pct
FROM base b, task_creators t, course_creators c, any_value a;
```

---

**Query 4: Day-2-Return Rate (30-Tage-Fenster)**
```sql
WITH signups AS (
  SELECT COUNT(DISTINCT user_id) AS total
  FROM analytics_events
  WHERE name = 'signup_completed'
    AND created_at >= now() - INTERVAL '30 days'
),
returners AS (
  SELECT COUNT(DISTINCT user_id) AS total
  FROM analytics_events
  WHERE name = 'day2_return'
    AND created_at >= now() - INTERVAL '30 days'
)
SELECT
  s.total  AS signups_last_30d,
  r.total  AS day2_returners,
  ROUND(r.total::numeric / NULLIF(s.total, 0) * 100, 1) AS day2_return_rate_pct
FROM signups s, returners r;
```

---

### 2c. Wöchentliches Review-Template

Jeden Montag folgende Zahlen aus Vercel Analytics ziehen:

```
Woche KW__:
──────────────────────────────────────────
Signups (signup_completed):          ___
Onboarding Completion:               ___  (___ %)   [Ziel: ≥ 60 %]
First-Value (task + course):         ___  (___ %)   [Ziel: ≥ 50 %]
  davon Task only:                   ___
  davon Course only:                 ___
  davon beides:                      ___
Day-2-Return:                        ___  (___ %)
Demo-Seed-Rate:                      ___  (___ %)
Demo-Removal-Rate:                   ___  (___ %)
Landing CTA → Signup Conversion:     ___  (___ %)
──────────────────────────────────────────
Go/No-Go Status:  ⬜ Onboarding  ⬜ First-Value
```

---

## 3. Copy/UX für Consent/Tracking-Hinweise

### 3a. Problem-Diagnose

Die aktuelle `privacy/page.tsx` enthält folgenden Satz:
> "Es werden keine Verhaltensdaten an Dritte weitergegeben."

Das ist seit der Integration von Vercel Analytics **nicht mehr korrekt.**
Vercel Analytics ist ein Drittanbieter und empfängt Session-Daten (Page Views, Custom Events mit User-Agent, IP-Region).

Vercel Analytics ist DSGVO-konform (keine Cookies, IP-Anonymisierung, keine Cross-Site-Tracking) — aber der Satz muss trotzdem korrigiert werden.

---

### 3b. Privacy-Page Update

**Ersetze Abschnitt 2 in `app/(marketing)/privacy/page.tsx`:**

Aktuell:
```
INNIS erhebt ausschließlich Daten, die du aktiv eingibst: Aufgaben, Kurse, Ziele,
Bewerbungen und Profileinformationen. Es werden keine Verhaltensdaten an Dritte
weitergegeben.
```

Neu (Codex implementiert, Copy von hier übernehmen):
```
INNIS erhebt Daten, die du aktiv eingibst: Aufgaben, Kurse, Ziele, Bewerbungen
und Profileinformationen. Zur Verbesserung der App erfassen wir anonymisierte
Nutzungsevents (z.B. Onboarding abgeschlossen, erste Aufgabe erstellt) über
Vercel Analytics. Vercel Analytics verwendet keine Cookies, speichert keine
IP-Adressen und ermöglicht kein Cross-Site-Tracking. Es werden keine
personenbezogenen Inhalte deiner Aufgaben oder Kurse an Dritte weitergegeben.
```

---

### 3c. In-App Tracking-Hinweis (keine Cookie-Banner)

**Position:** Settings-Seite → neuer Abschnitt "Datenschutz & Analytics"

**Wann anzeigen:** Immer sichtbar (kein Toggle-Gate), unter dem Lucian-Abschnitt.

**Copy:**

```
Datenschutz & Analytics
───────────────────────
INNIS nutzt Vercel Analytics, um anonymisierte Nutzungsdaten zu erfassen
(z.B. ob das Onboarding abgeschlossen wurde). Es werden keine Inhalte
deiner Aufgaben, Kurse oder Ziele übermittelt. Vercel Analytics arbeitet
ohne Cookies und ohne IP-Speicherung.

→ Datenschutzerklärung  (Link auf /privacy)
```

**Design-Hinweis für Codex:**
- Kein Toggle — Analytics ist für den Betrieb des Produkts notwendig (kein "nice to have")
- Gleiche visuelle Sprache wie die bestehende Lucian-Sektion: `text-text-tertiary`, kein roter Akzent
- `ExternalLink`-Icon bei /privacy-Link

---

### 3d. Signup-Footer Update

Der aktuelle Signup-Footer verlinkt bereits auf `/privacy`. Kein weiterer Hinweis nötig.
Login-Footer ebenfalls bereits korrigiert (Phase 10 Fix).

---

### 3e. Onboarding: kein zusätzlicher Tracking-Hinweis nötig

**Begründung:**
- Nutzer hat bei Signup den Datenschutz-Link gesehen und akzeptiert.
- Ein erneuter Hinweis in Step 1 würde den Wizard-Flow stören ohne Mehrwert.
- Ausnahme: Wenn du in Zukunft tieferes Behavioral Tracking einführst (Heatmaps, Session Recordings), dann Consent-Gate vor dem Onboarding — derzeit nicht der Fall.

---

## Codex-Handoff

| Task | Priorität | Datei |
|------|-----------|-------|
| Privacy-Page Abschnitt 2 ersetzen | hoch (Compliance) | `app/(marketing)/privacy/page.tsx` |
| Settings „Datenschutz & Analytics" Sektion | mittel | `app/(dashboard)/settings/page.tsx` |
| Vercel Analytics `<Analytics />` in layout.tsx prüfen | hoch (ohne das landen keine Events) | `app/layout.tsx` |
| `/api/analytics/event` persistieren (Supabase) | niedrig (Vercel Analytics reicht für jetzt) | `app/api/analytics/event/route.ts` |

---

## Offene Fragen (für Owner-Entscheidung)

1. **Analytics Opt-Out:** Willst du einen Opt-Out-Toggle in Settings anbieten?
   - Pro: Stärker DSGVO-aligned, vertrauensbildend
   - Contra: Vercel Analytics ist bereits opt-out-by-default für EU (GDPR mode)
   - Empfehlung: Vorerst kein Toggle, aber klare Privacy-Copy reicht

2. **Persistenz in Supabase:** Wann macht das Sinn?
   - Erst wenn Vercel Analytics-Daten nicht mehr ausreichen (z.B. du willst User-level Cohort-Queries)
   - Empfehlung: Erst nach Go-Live und wenn Vercel-Limits erreicht werden

3. **Demo-Seed in Funnel:** Demo-Seeder haben andere Aktivierungsmuster.
   - Empfehlung: Demo-Seeder (erkennbar an `demo_seed_started` vor `onboarding_completed`) separat auswerten — nicht aus First-Value-Rate herausrechnen, sondern als eigene Kohorte verfolgen.
