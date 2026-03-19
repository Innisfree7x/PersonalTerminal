# Phase 34 — Career Dossier

## Ziel
- Opportunity Radar nicht nur als Trefferliste, sondern als echte Decision Surface nutzbar machen.
- Eine ausgewählte Rolle bekommt ein kompaktes Dossier mit:
  - Einordnung
  - Hauptgründen
  - Hauptlücken
  - nächstem Move
  - operativen CTAs

## Umgesetzt
- `OpportunityRadar` besitzt jetzt einen ausgewählten Lead-Zustand.
- Oberhalb der Ergebnisliste rendert ein `Career Dossier`:
  - relative Markt-Passung
  - Confidence / Reach-Band
  - Track-Fit
  - Markt-Signal
  - Gap-Druck
  - Quellen
  - Decision-Summary
  - Top Gründe / Hauptlücken
  - Next Move
- Direkte Aktionen aus dem Dossier:
  - Stelle öffnen
  - Als Prep-Block planen
  - Gap als Task
  - In Pipeline übernehmen
- Ergebnis-Karten darunter wurden absichtlich kompakter gemacht:
  - Scan-Fläche für den Markt
  - Dossier-Fläche für die Entscheidung

## Neue Logik
- `lib/career/opportunityDossier.ts`
  - zentrale Aufbereitung des Dossier-Readouts
  - wiederverwendbare Metriken und Chips

## Tests
- `tests/unit/opportunity-dossier.test.ts`
  - Dossier-Readout korrekt
  - Target-Firm / CV-Mismatch Verhalten
- `tests/unit/OpportunityRadar.test.tsx`
  - Standardauswahl des ersten Leads
  - Umschalten auf ein anderes Dossier

## Produktentscheidung
- Detailtiefe wurde bewusst aus den Grid-Karten in das Dossier gezogen.
- Dadurch ist die Scan-Ebene schneller und die Entscheidungs-Ebene klarer.

## Follow-up
- Nächster sinnvoller Schritt: `Company Dossier`
  - Firmenkontext
  - Bewerberdichte
  - Track-spezifische Erwartung
  - CV-Gap-Brücke noch konkreter
