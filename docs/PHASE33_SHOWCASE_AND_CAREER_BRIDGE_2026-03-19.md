# Phase 33 - Showcase Proof + Career Bridge (2026-03-19)

Status: Delivered
Owner: Core

## Ziel

Die vorherige Conversion-Welle hat Hero, Mockup und Radar-Trust bereits deutlich geschaerft. Diese Folge-Welle zieht zwei Luecken zu:

1. Marketing soll im Showcase weniger Architektur erklaeren und staerker konkrete sichtbare Outputs zeigen.
2. Career-Radar soll nicht bei `Gap als Task` stehen bleiben, sondern auch einen sauberen Weg in die strategische Planung geben.

## Geliefert

### 1) Career-Radar bekommt `Gap -> Trajectory` Bridge

Dateien:
- `lib/career/opportunityActions.ts`
- `components/features/career/OpportunityRadar.tsx`
- `tests/unit/opportunity-actions.test.ts`

Aenderungen:
- Neue Helper-Logik baut einen sicheren Deep-Link nach `/trajectory` mit vorbefuelltem Formular.
- Pro Opportunity steht jetzt neben `Gap als Task` und `In Pipeline uebernehmen` auch:
  - `Als Prep-Block planen`
- Der Deep-Link nutzt bestehende Trajectory-Prefill-Parameter:
  - `prefillTitle`
  - `prefillCategory=internship`
  - `prefillDueDate`
  - `prefillEffortHours`
  - `prefillBufferWeeks`
- Aufwand und Frist werden heuristisch nach Reach-Band gesetzt:
  - `realistic` -> leichter, kuerzer
  - `target` -> mittlerer Prep-Block
  - `stretch` -> laengerer Prep-Block mit mehr Buffer

Wirkung:
- Career wird nicht nur operativ (`Task`) oder archivisch (`Pipeline`), sondern auch strategisch (`Trajectory`) anschlussfaehig.
- Die Bruecke ist bewusst nicht destruktiv: User landet nur im vorbefuellten Formular und bestaetigt selbst.

### 2) ProductShowcase von Architektur auf sichtbaren Produkt-Output umgestellt

Datei:
- `components/features/marketing/ProductShowcase.tsx`

Aenderungen:
- Showcase spricht nicht mehr primaer ueber System-Bloecke und Highlights, sondern ueber den sichtbaren Vorteil je Surface.
- Neue Struktur pro Karte:
  - Claim
  - Shift (was sich gegenueber altem Chaos veraendert)
  - sichtbarer Output
  - drei klare Signals
- Vier Surface-Karten bleiben erhalten, aber mit staerkerem Outcome-Fokus:
  - `Trajectory`
  - `Today`
  - `Career Intelligence`
  - `Command Rail`

Wirkung:
- Die Landing faellt weniger in Tool-/Feature-Sprache zurueck.
- Nutzer sehen klarer, was sich in ihrer realen Arbeitsweise veraendert.

## Betroffene Dateien

- `components/features/career/OpportunityRadar.tsx`
- `components/features/marketing/ProductShowcase.tsx`
- `lib/career/opportunityActions.ts`
- `tests/unit/opportunity-actions.test.ts`

## Verifikation

Gruen ausgefuehrt:
- `npm run test -- --run tests/unit/opportunity-actions.test.ts tests/unit/opportunity-readout.test.ts tests/unit/career-opportunity-radar.test.ts tests/unit/career-radar-insights.test.ts tests/unit/api/career-opportunities.test.ts`
- `npm run lint`
- `npm run build`
- `npm run type-check` (seriell nach Build, um `.next/types` konsistent zu halten)

## Audit

### Positiv
- Kein neuer Mutationspfad noetig fuer die Trajectory-Bruecke.
- Kein Datenmodell erweitert.
- Showcase-Redesign bleibt inhaltlich nah am Produkt und fuehrt nicht zu generischen Marketing-Phrasen zurueck.

### Beobachtung
- Ein paralleler Lauf von `tsc --noEmit` und `next build` kann lokale `.next/types` inkonsistent machen. In dieser Welle war das kein Codefehler, sondern nur ein lokaler Reihenfolge-Effekt. Fuer saubere Verifikation daher: `build -> type-check` oder Type-Check auf stabilem `.next` laufen lassen.

## Naechste sinnvolle Welle

1. `Career Dossier`
   - pro Opportunity eine echte Detailflaeche mit Firma, Rolle, Fit, Gaps, naechstem Move
2. `Landing Before/After Proof`
   - noch haerterer Vorher/Nachher-Block fuer Conversion
3. `Daily Core`
   - Morning Briefing + Momentum als noch dichtere Operations-Leiste

