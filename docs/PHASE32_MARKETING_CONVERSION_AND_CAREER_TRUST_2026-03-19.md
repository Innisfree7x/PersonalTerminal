# Phase 32 - Marketing Conversion + Career Trust (2026-03-19)

Status: Delivered
Owner: Core

## Ziel

Die erste Landing-Experience soll INNIS in unter 10 Sekunden verstaendlich machen, waehrend der Career-Radar nicht mehr wie ein dekoratives Matching-Widget wirkt, sondern wie eine nachvollziehbare Entscheidungsflaeche.

Kernfragen dieser Welle:
- Versteht ein neuer Nutzer sofort den Outcome von INNIS?
- Zeigt das Hero-Mockup das heutige Produkt statt einer alten Today-only-Version?
- Fuehlt sich der Career-Fit wie eine begruendete Markt-Einschaetzung an statt wie eine willkuerliche Zahl?

## Geliefert

### 1) Hero auf Outcome statt Produktbegriff umgestellt

Datei:
- `components/features/marketing/HeroSection.tsx`

Aenderungen:
- Headline und Subline auf den eigentlichen Outcome gedreht:
  - Thesis, GMAT und Praktikum gemeinsam planen
  - sofort sehen, ob der Plan realistisch ist
- Drei Proof-Tiles direkt im Hero ergaenzen den CTA:
  - `Trajectory`
  - `Risk`
  - `Career`
- Sekundaerer CTA fuehrt jetzt direkt in den interaktiven Beweis-Block statt nur auf Login.
- Interactive-Proof-Sektion bekam eine klare Anker-ID (`hero-proof`) und schaerfere Copy.

Wirkung:
- Weniger generisches "persoenliches Terminal"
- Mehr konkrete Value Proposition im ersten Viewport

### 2) Product Mockup auf den echten Produktkern aktualisiert

Datei:
- `components/features/marketing/ProductMockup.tsx`

Aenderungen:
- Altes Today-only-Mockup ersetzt durch ein kompaktes Current-State-Mockup mit:
  - Trajectory Engine
  - Morning Briefing / Momentum
  - Today Execution
  - Career Intelligence
  - Command Rail
- Das Mockup zeigt jetzt dieselbe Systemlogik, die das Produkt tatsaechlich verkoerpert.

Wirkung:
- Hero verkauft nicht mehr das alte Produktbild
- Die Landing ist naeher am echten USP: Trajectory-first Execution System

### 3) Social Proof von abstrakten Zahlen auf Produktbeweise gedreht

Datei:
- `components/features/marketing/SocialProof.tsx`

Aenderungen:
- Alte abstrakte Stat-/Testimonial-Anmutung ersetzt durch klarere Produktkennzahlen:
  - weniger Deadline-Risiko
  - mehr Fokuszeit pro Woche
  - hoehere Konsistenz der Wochenplanung
  - ein gemeinsames System fuer Plan, Day und Karriere
- Darunter drei Proof-Panels statt pseudo-sozialer Beweise:
  - Trajectory macht Deadlines operativ
  - Today ist kein zweites Todo-Board
  - Career ist Match + Gap + naechster Schritt

Wirkung:
- Weniger nach Marketing-Deko
- Mehr nach glaubwuerdigem Produktbeweis

### 4) Career Radar Explainability Layer eingefuehrt

Dateien:
- `lib/career/opportunityReadout.ts`
- `components/features/career/OpportunityRadar.tsx`
- `tests/unit/opportunity-readout.test.ts`

Aenderungen:
- Neue Readout-Logik fuer jede Opportunity:
  - komprimierter Display-Index statt uebertriebener 99/100-Optik
  - Confidence-Layer mit eindeutiger Einordnung
  - Signal-Flaechen fuer Track-Fit, Markt-Signal und Gap-Druck
  - begruendete Summary: warum dieser Fit plausibel ist
- Karten-Texte umgestellt:
  - `Warum das passt`
  - `Was noch fehlt`
  - `Naechster sinnvoller Move`
- Externe Job-URL als `Stelle oeffnen` sichtbar gemacht.

Wirkung:
- Fit-Score fuehlt sich weniger gamifiziert an
- Empfehlung wird als begruendete Markt-Passung lesbar
- Radar wird naeher an ein Entscheidungswerkzeug als an ein Match-Spielzeug

## Betroffene Dateien

- `components/features/marketing/HeroSection.tsx`
- `components/features/marketing/ProductMockup.tsx`
- `components/features/marketing/SocialProof.tsx`
- `components/features/career/OpportunityRadar.tsx`
- `lib/career/opportunityReadout.ts`
- `tests/unit/opportunity-readout.test.ts`

## Verifikation

Gruen ausgefuehrt:
- `npm run test -- --run tests/unit/opportunity-readout.test.ts tests/unit/career-opportunity-radar.test.ts tests/unit/career-radar-insights.test.ts tests/unit/api/career-opportunities.test.ts`
- `npm run type-check`
- `npm run lint`
- `npm run build`

## Bekannte Restpunkte

1. `components/features/marketing/ProductShowcase.tsx` erklaert das System sauber, kann spaeter aber noch strenger auf Outcome/Proof umgestellt werden.
2. Landing-Visuals basieren weiterhin auf kuratierten Produkt-Snapshots, nicht auf live gerenderten echten Datenzustanden.
3. Career-Radar nutzt Explainability bereits gut, aber die staerkste naechste Welle ist `Gap -> Trajectory/Today` noch direkter zu schliessen.

## Empfehlung fuer die naechste Welle

1. Landing weiter proof-first verdichten:
   - ProductShowcase haerter auf Beweis statt Architektur ziehen
2. Career Intelligence weiter schaerfen:
   - Gap-Bridge noch direkter
   - company/job detail layer
3. Daily Core danach zusammenziehen:
   - Morning Briefing + Momentum noch kompakter als eine einzige Operations-Leiste

