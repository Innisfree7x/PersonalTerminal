# Phase 31 — Marketing Premium Refresh (2026-03-15)

Status: Implemented  
Scope: Marketing-Relaunch fuer `/`, `/features`, `/pricing`, `/about` inkl. Designphilosophie-Shift und SEO-Erweiterung fuer `/for-students`.

Follow-up:
- Der nachgelagerte Conversion-/Proof-Sprint ist in `docs/PHASE32_MARKETING_CONVERSION_AND_CAREER_TRUST_2026-03-19.md` dokumentiert.

## Ziel

Die Marketing-Site soll sich weniger wie "polished student SaaS" und mehr wie ein praezises High-End-Instrument anfuehlen.

Nicht mehr:
- generische SaaS-Atmosphaere
- zu viele gleich laute Karten
- Premium ueber Glow, Blur und Deko
- austauschbare Feature-Kommunikation

Sondern:
- klare Hierarchie
- starke Positionierung
- kontrollierte Markenfuehrung
- glaubwuerdige Product Story
- Premium ueber Praezision statt Lautstaerke

## Verbindliche Designphilosophie

1. Premium ist strategische Klarheit, nicht Oberflaechenreichtum.
2. Rot und Gold sind Signal- und Wertfarben, nicht flaechige Standarddeko.
3. Motion darf Narrative verstaerken, aber nicht Aufmerksamkeit erbetteln.
4. Product Proof ist wertvoller als pseudo-soziale Beweise.
5. INNIS verkauft kein "all-in-one Tool", sondern ein Trajectory-first Execution System fuer Studenten mit parallelen High-Stakes-Zielen.

## Umgesetzte Aenderungen

### 1) Marketing Surface beruhigt

- `app/globals.css`
  - Marketing-Hintergruende und Premium-Tokens reduziert und kontrollierter ausgerichtet.
  - Karte, Typografie und CTA-Stile auf ruhigere, dichtere Premium-Wirkung umgestellt.
- `app/(marketing)/layout.tsx`
  - Atmosphaere bleibt vorhanden, aber die Seite wirkt weniger ueberladen.

### 2) Landing neu auf Positionierung statt Feature-Lautstaerke gebaut

- `components/features/marketing/HeroSection.tsx`
  - Hero neu ausgerichtet auf die Kernbotschaft:
    - "Erkenne Kollisionen in deinem Karriereplan, bevor sie passieren."
  - Fake-artige Stat-Claims entfernt.
  - Product-Principles und glaubwuerdigerer Interactive-Proof-Block integriert.
  - Rechte Product-Flaeche erklaert die Reihenfolge `Trajectory -> Today -> Career`.

- `components/features/marketing/ProblemStrip.tsx`
  - Von dekorativem Pain-Strip zu einer klaren Diagnose:
    - Planung
    - Daily
    - Signal
  - Before/After nicht mehr generisch, sondern konfliktorientiert.

### 3) Feature-Narrativ auf Systemlogik umgebaut

- `components/features/marketing/FeatureSection.tsx`
  - Bunte Feature-Kachel-Matrix ersetzt durch vier geordnete Systembloecke:
    - Trajectory
    - Today
    - Execution
    - Reliability

- `components/features/marketing/HowItWorksSection.tsx`
  - Mechanik auf drei ernste Schritte verdichtet:
    - echte Deadline setzen
    - Buffer ehrlich sehen
    - Plan in den Tag tragen

- `app/(marketing)/features/page.tsx`
  - Features-Page auf die vier Ebenen des Systems umgebaut.

### 4) Pricing und About geschaerft

- `components/features/marketing/PricingSection.tsx`
  - Free/Pro deutlicher als Haltungsfrage formuliert:
    - Free muss bereits nuetzlich sein
    - Pro vertieft Strategie

- `app/(marketing)/pricing/page.tsx`
  - Hero-Tonalitaet weg von Startup-Sprech hin zu ruhiger Souveraenitaet.

- `app/(marketing)/about/page.tsx`
  - Founder-/Origin-Richtung deutlich persoenlicher und meinungsstaerker.
  - Explizit gemacht, wofuer INNIS steht und wofuer nicht.

### 5) SEO/Informationsarchitektur erweitert

- `app/robots.ts`
  - `/for-students` als oeffentliche Marketing-Route explizit freigegeben.
- `app/sitemap.ts`
  - `/for-students` in die Sitemap aufgenommen.
- `app/(marketing)/page.tsx`
  - Landing-Metadata auf die neue Positionierung geschaerft.

## Betroffene Dateien

- `app/globals.css`
- `app/(marketing)/layout.tsx`
- `app/(marketing)/page.tsx`
- `app/(marketing)/features/page.tsx`
- `app/(marketing)/pricing/page.tsx`
- `app/(marketing)/about/page.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `components/features/marketing/HeroSection.tsx`
- `components/features/marketing/ProblemStrip.tsx`
- `components/features/marketing/FeatureSection.tsx`
- `components/features/marketing/HowItWorksSection.tsx`
- `components/features/marketing/PricingSection.tsx`
- `components/features/marketing/CTASection.tsx`

## Verifikation

Ausgefuehrt:

- `npm run lint` ✅
- `npm run type-check` ✅

Build:

- `npm run build`
  - Compile-Schritt erfolgreich bis Page-Data/Write-Phase
  - danach Abbruch durch Umgebungslimit `ENOSPC` (`no space left on device`)
  - kein nachgewiesener Compile- oder Type-Fehler im Marketing-Refresh selbst

## Bekannte Restpunkte

1. `/for-students` ist jetzt SEO-seitig eingebunden, aber visuell noch nicht im selben Umfang ueberarbeitet wie Landing/About/Features/Pricing.
2. Ein spaeterer Follow-up kann gezielte Scroll-Narrative auf 1-2 Stellen erweitern, aber nur wenn Performance und Klarheit erhalten bleiben.
3. Fuer visuelle Regression waeren Screenshot-Baselines fuer `/`, `/features`, `/pricing`, `/about` sinnvoll.

## Zusammenfassung

Die neue Marketing-Richtung fuer INNIS ist jetzt:

- weniger dekorativer SaaS-Polish
- mehr editoriale Hierarchie
- mehr Trajectory-first Positionierung
- mehr Glaubwuerdigkeit
- mehr Premium ueber Kontrolle statt Effekte
