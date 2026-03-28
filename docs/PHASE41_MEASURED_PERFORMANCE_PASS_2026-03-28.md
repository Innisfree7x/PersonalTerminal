# Phase 41 — Measured Performance Pass

Stand: 2026-03-28  
Status: Implementiert

## Ziel

Nach der breiten Performance-Welle aus Phase 40 lag der größte Restnutzen
nicht mehr in pauschalem Blur-/Motion-Abbau, sondern in zwei gezielten
Hotspots:

1. `analytics` war mit zu viel initialem Client-JS und zu vielen sofort
   geladenen Chart-Flächen unnötig schwer
2. `settings` lud zu viele große Preference-Sektionen gleichzeitig, obwohl
   diese nicht für den First Paint nötig sind

Das Ziel dieser Welle war deshalb:

- spürbar weniger Initial-Last auf `/analytics`
- kleinerer First Paint auf `/settings`
- die Optik weiterhin premium halten, statt die UI flach zu optimieren

## Umgesetzt

### 1. Analytics gezielt entlastet

Datei:

- `app/(dashboard)/analytics/page.tsx`

Änderungen:

- schwere Chart-/List-Komponenten auf `next/dynamic` umgestellt:
  - `DailyFocusChart`
  - `HourlyDistributionChart`
  - `CategoryBreakdown`
  - `WeekdayChart`
  - `RecentSessionsList`
  - `WeeklyReview`
- leichte `AnalyticsSurfaceSkeleton`-Fallbacks ergänzt
- unnötige Header-Motion entfernt

Prinzip:

- First Load nur für die Shell und Kernstatistiken
- schwere Visualisierung erst bei Bedarf nachladen
- keine dekorative Motion auf einer ohnehin datenlastigen Seite

### 2. Settings in schwere Sektionen aufgeteilt

Dateien:

- `app/(dashboard)/settings/page.tsx`
- `components/features/settings/AppearanceSettingsSection.tsx`
- `components/features/settings/SoundSettingsSection.tsx`
- `components/features/settings/ChampionSettingsSection.tsx`
- `components/features/settings/SettingsSectionSkeleton.tsx`

Änderungen:

- Appearance, Sound und Champion aus der großen monolithischen Page
  herausgelöst
- diese Sektionen werden jetzt dynamisch nachgeladen
- leichte Skeleton-Fallbacks für Wahrnehmung und Layout-Stabilität ergänzt

Prinzip:

- Settings-First-Paint soll nicht alle selten genutzten Preference-Blöcke
  gleichzeitig bezahlen
- Struktur verbessern, ohne UX oder Funktionsumfang zu verlieren

### 3. Interaktions-Hotspots leichter gemacht

Dateien:

- `components/shared/CommandPalette.tsx`
- `components/layout/Sidebar.tsx`
- `app/(dashboard)/layout.tsx`
- `app/globals.css`

Änderungen:

- `CommandPalette` von `framer-motion`-Mount/Exit auf leichte CSS-Intro-
  Animation umgestellt
- Backdrop-Blur der Palette von `2xl` auf `lg` reduziert, ohne die Bühne
  flach zu machen
- Intent-Preview in der Palette ohne zusätzliche `AnimatePresence`-Kosten
  gerendert
- `Sidebar`-Mobile-Overlay von Motion/Blur auf leichtere statische Overlay-
  Variante umgestellt
- aktiver Sidebar-Stripe nicht mehr als unendlich laufende Motion-Animation,
  sondern als statischer Premium-Glow
- globale Dashboard-Page-Transitions von spring-basiertem
  `AnimatePresence` auf leichte CSS-Intro-Animation reduziert

Prinzip:

- teure Daueranimationen und Overlay-Kosten entfernen
- Materialität, Farbigkeit und Premium-Eindruck behalten
- keine aggressive optische Abrüstung, sondern „low-cost premium“

## Gemessener Effekt

### Build-Footprint vorher

- `/analytics`: `347 kB` First Load JS
- `/settings`: `258 kB` First Load JS

### Build-Footprint nachher

- `/analytics`: `223 kB` First Load JS
- `/settings`: `243 kB` First Load JS

### Einordnung

- `analytics` wurde massiv leichter, ohne Features zu streichen
- `settings` wurde moderat leichter, vor allem aber strukturell sauberer und
  besser auf zukünftige weitere Sektionen vorbereitet

## Verifikation

Lokal grün:

- `npm run lint`
- `npm run build`
- `npm run type-check`
- `npm run test:unit`

## Ergebnis

Die App ist nach dieser Welle:

- auf `analytics` deutlich näher an einem professionellen Daten-Screen statt
  einem sofort schwer ladenden Chart-Dashboard
- auf `settings` strukturell besser für weitere Growth-/Preference-Features
  vorbereitet
- in `CommandPalette`, `Sidebar` und bei Dashboard-Seitenwechseln merklich
  direkter, weil dauerhaft laufende Motion-Kosten entfernt wurden
- weiterhin visuell hochwertig, weil die Optimierung über Split/Lazy-Load
  und leichtere Interaktionsmuster statt über brutales visuelles Downgrade
  gelaufen ist

## Nicht gemacht

- keine aggressive Reduktion von visueller Materialität
- keine globale Deaktivierung von Animationen
- keine Virtualisierung-/Chart-Refactors über den Scope hinaus
- keine Änderungen an Produktlogik oder Copy

## Nächste sinnvolle Performance-Welle

1. `Career` Renderpfade tiefer auf Derived-State und Dossier-Re-Renders prüfen
2. `Strategy`/`Trajectory` große Visualisierungen in kleinere memoized
   Subtrees schneiden
3. nur noch gemessene Rest-Hotspots anfassen, keine pauschale
   Design-Entkernung mehr
