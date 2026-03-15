# Phase 30 — Career Intelligence Platform (2026-03-14)

Status: Execution in Progress (Wave 1 live + Hardening shipped)  
Scope: CV-Intelligence + Live Opportunity Matching (DACH) als neues Core-Feature.

## Update 2026-03-15 (umgesetzt)

- Opportunity Radar läuft jetzt `live-first`:
  - Wenn `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` gesetzt sind, werden primär Live-Jobs genutzt.
  - Statische Seed-Daten sind nur noch Fallback fuer lokale Demo (`CAREER_ENABLE_STATIC_SEEDS=true`) oder wenn kein Live-Key vorhanden ist.
- Ranking ist `target-firm aware`:
  - Kuratiertes DACH-Set (Big4/IB/Boutiques/Tier2) gibt qualitaetsgewichtete Boosts.
  - Track-Alignment (z. B. TS vs. M&A) wird in den Boost eingerechnet.
- Adzuna-Fetch wurde gehaertet:
  - Fokus auf Internship/Werkstudent-Pattern.
  - Noise-Role-Filter aktiv.
  - Frischefilter fuer Postings (aktuell 45 Tage).

## Update 2026-03-15 (Hardening + Reliability umgesetzt)

- API Rate-Limits aktiv:
  - `POST /api/cv/upload` -> 8/min
  - `POST /api/cv/extract` -> 15/min
  - `POST /api/cv/analyze` -> 10/min
  - `GET /api/career/opportunities` -> 30/min
  - `POST /api/career/opportunities/gap-task` -> 12/min
- Rate-Limit-Header werden in allen oben genannten Endpunkten gesetzt (`X-RateLimit-Remaining`, bei Block `Retry-After`).
- CV Upload nutzt serverseitig `createAdminClient()` mit user-scoped Storage-Pfad (`{user_id}/cv/...`) und bleibt auth-gebunden.
- LLM Budget-Guard ist aktiv:
  - Daily Snapshot aus `llm_usage_logs`
  - Per-request cap (`CAREER_LLM_MAX_PER_REQUEST`, default 5)
  - Daily cap (`CAREER_LLM_DAILY_LIMIT`, default 50)
  - Usage Logging pro Request (`recordCareerLlmUsage`)
- Gap -> Action Bridge live:
  - Neuer Endpoint `POST /api/career/opportunities/gap-task`
  - Dedupe auf Today-Task Titel + Datum
  - CTA in Opportunity Radar erzeugt direkt Today-Task aus identifiziertem Gap.
- Verifikation:
  - `npm run type-check` ✅
  - `npm run lint` ✅
  - `npm run build` ✅
  - Relevante Unit-Tests für CV/Career/Gap-Flow ✅

## Finalisierte Produktentscheidungen (Lock)

- `Pricing-Window`: 14 Tage Observability-Phase, danach Gate-Entscheidung.
- `LLM-Erklärungen`: in Welle 1 verpflichtend, aber strikt begrenzt/cached.
- `ICP-Scope`: V1 bleibt strikt Internship/Werkstudent (DACH).

## Zielbild

INNIS soll nicht nur Bewerbungen tracken, sondern aktiv entscheiden helfen:

1. CV einlesen und strukturiert bewerten (Fit pro Ziel-Track).
2. Aktuelle Stellen laden (DACH, Praktikum/Werkstudent zuerst).
3. Pro Stelle transparenten Fit-Score + Gründe + Gaps liefern.
4. Gewinner direkt in Pipeline und in Trajectory-Plan überführen.

Kurz: Von "Tool zum Organisieren" zu "Decision Engine für Karriere-Schritte".

## Produkt-Prinzipien

- Deterministisch zuerst, AI als Verstärker:
  - Basisscore ist immer regelbasiert, reproduzierbar, testbar.
  - LLM liefert Erklärung/Reranking, nicht Blackbox-Entscheidung allein.
- DACH-first:
  - Erst DE/AT/CH, nur Internship/Werkstudent/Entry-Level.
- Legale Datenquellen:
  - Keine verbotenen Scraper-Flows gegen LinkedIn/Stepstone.
  - Erst öffentliche/partnerfähige APIs und ATS-Feeds.
- Actionability:
  - Ergebnis muss immer in konkrete nächste Aktion münden:
    - `In Pipeline übernehmen`
    - `Gap in Trajectory aufnehmen`
    - `Weekly Focus Block erzeugen`

## North-Star (Phase 30)

`% neuer User, die innerhalb von 10 Minuten nach CV-Upload mindestens 1 "realistic" Opportunity sehen`

Unterstützende Metriken:
- Time-to-first-match (P50/P95)
- Match-to-pipeline conversion rate
- % Matches mit vollständiger Begründung + Gap-Hinweisen

## Pricing-Hypothese (vor Build festgelegt)

Damit die 14-Tage-Phase auswertbar ist, gilt ab jetzt als Testhypothese:

- `Free`:
  - begrenzte Matches/Tag
  - deterministischer Fit-Score
  - Pipeline-Übernahme

- `Pro`:
  - unbegrenzte Matches
  - LLM-Erklärungen (Top-Reasons/Gaps/Rationale)
  - Gap -> Trajectory Bridge

Validierungsmetriken für die 14-Tage-Entscheidung:
- wiederholte Radar-Nutzung (7d)
- Nutzung von LLM-Erklärungen
- Nutzung der Gap->Trajectory-Bridge
- Funnel-Stabilität: `CV -> realistic -> adopt`

## Quellenstrategie (realistisch umsetzbar)

### V1 (direkt)
- Adzuna API (DACH): Primärquelle für aktuelle Jobs.
- Bestehende Opportunity-Radar API bleibt Entry Point (`/api/career/opportunities`).

### V1.1 (kurz danach)
- Greenhouse Public Jobs API pro Company.
- Lever Public Jobs API pro Company.

### V2 (optional)
- Weitere Quellen nur über legale, stabile Schnittstellen.
- Kein inoffizielles LinkedIn-Scraping im Core-Plan.

## Feature-Scope

## 1) CV Intelligence

- CV Upload ist bereits da, wird erweitert um persistente Strukturdaten:
  - Skills
  - Erfahrungslevel
  - Ziel-Track Fit (M&A/TS/CorpFin/Audit)
  - identifizierte Gaps

Ziel-Ausgabe:
- `cv_rank` (0-100)
- `rank_tier` (`top`, `strong`, `developing`, `early`)
- `top_strengths[]`
- `top_gaps[]`

## 2) Opportunity Radar (Live)

- `/api/career/opportunities` nutzt echte Quellen statt statischer Seeds.
- Dedupe über `(company_normalized, title_normalized, city, posted_at_window)`.
- Reach-Bands final:
  - `realistic >= 72`
  - `target 58..71`
  - `stretch < 58`

## 3) Match Intelligence

Pro Opportunity:
- `fit_score` (deterministisch)
- `top_reasons` (3)
- `top_gaps` (2-3)
- `source_labels` (wo gefunden)
- `confidence_score` (Datenqualität)

Welle-1 Pflicht:
- LLM-Kurzbegründung (Haiku), streng schema-validiert.
- Guardrails:
  - nur für Top-5 Matches pro Query
  - harte Cache-Nutzung (kein Recompute ohne Bedarf)
  - deterministischer Fallback bei LLM-Fehler/Timeout
  - keine freie Ausgabe ohne JSON-Schema-Validierung

## 4) Pipeline + Trajectory Bridge

- CTA `In Pipeline übernehmen` bleibt Standard.
- Zusätzliche CTA `Gap in Trajectory übernehmen`:
  - generiert gezieltes Milestone/Prep-Block-Template.

## Architektur

## API Surface (neu/erweitert)

- `POST /api/cv/analyze`
  - Input: `cv_text`, optional `target_tracks[]`
  - Output: strukturierte CV-Analyse + Rank

- `GET /api/career/opportunities`
  - erweitert um `live=true`, `sources[]`, `track`, `locations[]`
  - Output: dedupte Liste + Match-Infos

- `POST /api/career/opportunities/refresh`
  - manuell aus UI triggerbar (rate-limited)

- `POST /api/career/opportunities/:id/adopt`
  - Pipeline + optional Trajectory-Bridge in einem Call

## Datenmodell (neu)

- `career_cv_profiles`
  - `user_id`
  - `cv_text`
  - `cv_rank`
  - `rank_tier`
  - `skills jsonb`
  - `gaps jsonb`
  - `updated_at`

- `career_opportunity_cache`
  - `external_id`
  - `source`
  - `company`
  - `title`
  - `city`
  - `country`
  - `description`
  - `posted_at`
  - `expires_at`

- `career_opportunity_matches`
  - `user_id`
  - `opportunity_id`
  - `fit_score`
  - `band`
  - `reasons jsonb`
  - `gaps jsonb`
  - `confidence_score`
  - `computed_at`

RLS:
- strikt pro `user_id` auf Profil- und Match-Ebene.
- Cache-Tabelle ohne PII, nur service-role schreibt.

## Laufzeit/Infra

- Vercel Hobby berücksichtigt: Cron nur täglich.
- Daher:
  - täglicher Refresh-Job (nachts)
  - zusätzlich manuelles Refresh mit Throttle.

## Qualitäts-Gates

## Gate A — Korrektheit
- Unit-Tests für:
  - Score-Funktion
  - Band-Thresholds
  - Dedupe
- API Contract Tests:
  - invalid query
  - source timeout fallback
  - empty source response

## Gate B — Isolation/Sicherheit
- Zwei echte User:
  - User A sieht nie User B CV/Matches.
- PII-Minimierung:
  - keine CV-Rohdaten in Logs.
- Upload-Limits + MIME-Checks + Size-Guards bleiben aktiv.

## Gate C — UX/Performance
- Opportunity-Radar P95 < 1.2s aus Cache.
- Live-Refresh P95 < 4.0s.
- Kein UI-Dead-End:
  - Jede Match-Karte hat direkte nächste Aktion.

## Rollout-Wellen

### Welle 1 (MVP)
- CV Ranking persistent
- Live Opportunities (Adzuna)
- deterministische Scores + Bänder
- LLM-Erklärungen (Top-5, cached, schema-strict)
- Pipeline-Übernahme stabil

### Welle 2
- Greenhouse/Lever Quellen
- Confidence-Score + Source-Badge
- Trajectory Gap-Bridge

### Welle 3
- Markttrends (7d/30d)
- Weekly Career Brief

## Risiken + Gegenmaßnahmen

- Risiko: Datenqualität externer APIs schwankt.
  - Mitigation: Confidence-Score + harte Fallbacks.
- Risiko: Quellenlimit/Rate-Limits.
  - Mitigation: Cache + tägliche Aggregation + Backoff.
- Risiko: Blackbox-Wirkung durch AI.
  - Mitigation: deterministischer Basisscore bleibt primär.

## Definition of Done (Phase 30)

- User lädt CV hoch und sieht persistentes Ranking.
- User sieht echte aktuelle DACH-Opportunities.
- Mindestens 1 Quelle live integriert, dedupe aktiv.
- Fit-Bands korrekt nach finalen Schwellen.
- LLM-Erklärung pro Top-Match vorhanden oder deterministischer Fallback aktiv.
- CTA in Pipeline funktioniert ohne Datenverlust.
- Alle Gates grün (`type-check`, `lint`, `build`, relevante unit/integration tests).

## Entscheidungen bestätigt (kein Blocker offen)

1. Pricing-Entscheidung nach 14 Tagen, aber mit vordefinierter Free/Pro-Hypothese.
2. LLM-Erklärungen in Welle 1, kostenkontrolliert und mit hartem Fallback.
3. V1-Scope bleibt strikt Internship/Werkstudent im DACH-Fokus.
