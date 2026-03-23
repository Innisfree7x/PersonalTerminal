# PHASE39_MARKETING_ART_DIRECTION_2026-03-23

Stand: 2026-03-23  
Status: Umgesetzt

## Ziel

Die aktive Marketing-Landing sollte weniger wie ein sauberes SaaS-Grid und mehr wie eine premium inszenierte Produktbühne wirken.  
Wichtig war dabei:

- nur den **aktiven** Landing-Pfad zu bearbeiten
- die Story klarer auf Outcome statt Feature-Liste zu drehen
- stärkere Hero-Hierarchie, mehr Proof und mehr visuelle Spannung aufzubauen

## Wichtige Feststellung vor Start

`components/features/marketing/ProductMockup.tsx` ist nicht Teil der aktiven Landing.  
Die produktive Marketing-Route `/` rendert `components/features/marketing/CinematicLanding.tsx` über `app/(marketing)/page.tsx`.

Konsequenz:

- kein weiterer Aufwand auf tote Marketing-Komponenten
- `CinematicLanding.tsx` ist die Source of Truth für die öffentliche Landing

## Umgesetzte Änderungen

### 1. Hero neu inszeniert

Die Hero-Bühne wurde auf eine asymmetrische, stärkere Komposition umgebaut:

- linke Seite: Kicker, dominante Outcome-Headline, präzisere Subline
- darunter: Primär-CTA + Login-CTA
- darunter: drei harte Proof-Karten
- rechte Seite: Terminal-Frame mit Produkt-Composite
- zusätzliche Floating-Signale:
  - Morning Brief
  - Career Signal

Ziel:

- weniger gleichgewichtete Information
- klarerer erster Blick
- Landing wirkt teurer und fokussierter

### 2. Proof-Layer je Produktsektion

Die drei Kernsektionen in `CinematicLanding` bekamen eigene Proof-Karten:

- Trajectory
- Today
- Career

Damit ist jede Bühne nicht nur visuell, sondern auch argumentativ stärker:

- klarere Nutzensignale
- schnelleres Verständnis
- weniger reine Fließtext-Erklärung

### 3. CTA-Sektion gehärtet

Die finale CTA bekam ebenfalls eine kompakte Proof-Leiste, damit der Abschluss der Seite nicht nur auf Tonfall, sondern auch auf verdichtetem Produktbeweis basiert.

## Technische Dateien

- `components/features/marketing/CinematicLanding.tsx`

## Verifikation

- `npm run lint` ✅
- `npm run build` ✅
- `npm run type-check` ✅

Hinweis:

- Der bekannte `.next/types`-Zwang bleibt repo-weit bestehen. Deshalb wurde `type-check` seriell nach einem erfolgreichen `build` verifiziert.

## Ergebnis

Die Landing ist jetzt:

- fokussierter
- weniger symmetrisch und brav
- proof-lastiger
- näher an einer premium Art Direction als an einer neutralen SaaS-Seite

## Nicht gemacht

- keine Änderungen an toten Marketing-Komponenten
- kein zusätzlicher Scroll-Gimmick
- kein Umbau der Routing-Struktur
- kein blindes Nachbauen von Dribbble-Layouts ohne Produktbezug

## Nächste sinnvolle Marketing-Welle

1. Social-Proof-/Stat-Bar noch stärker als Instrument-Panel inszenieren
2. Product-Composite im Hero weiter zu einem ikonischen Hero-Objekt verdichten
3. ProductShowcase rhythmisch straffer machen, damit die Seite weniger lang und segmentiert wirkt
