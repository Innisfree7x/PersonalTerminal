# Phase 36 — Quality Hardening

Stand: 2026-03-21  
Status: Implementiert

## Ziel

Die Codebase braucht nicht nur viele Tests, sondern eine harte, reproduzierbare
Qualitätsbaseline. Diese Welle zieht `type-check`, `lint`, Unit-Tests,
Coverage-Gate und Production-Build wieder auf einen konsistenten Mindeststandard.

## Umgesetzt

### 1. Green Baseline wiederhergestellt
- Hook-Dependency in `app/(dashboard)/trajectory/page.tsx` korrigiert
- `useSoundToast` in `lib/hooks/useSoundToast.ts` auf stabiles `useMemo`
  umgestellt, damit Effekt-Dependencies sauber und reproduzierbar bleiben
- Shared UI-Primitives (`components/ui/Button.tsx`, `components/ui/Card.tsx`)
  auf `HTMLMotionProps` gehärtet statt impliziter/unscharfer DOM-Props
- Recharts-Tooltip in `components/features/analytics/WeekdayChart.tsx`
  typisiert
- Wire-Typen in
  `app/(dashboard)/goals/page.tsx`
  und
  `app/(dashboard)/university/page.tsx`
  gegen `exactOptionalPropertyTypes` gehärtet
- Lucian-Yesterday-Memory gefixt:
  `components/providers/LucianBubbleProvider.tsx` lädt Vortags-Tasks jetzt
  wirklich über den gestrigen API-Snapshot statt fälschlich den heutigen
  Task-Feed zu filtern
- Datums-Helfer in `lib/lucian/memory.ts` gehärtet, damit lokale
  Tagesgrenzen reproduzierbar und typsicher berechnet werden
- Reverb-Send in `lib/sound/reverb.ts` isoliert:
  parallele Sounds teilen weiter denselben Convolver, aber nicht mehr
  denselben mutierbaren Wet/Dry-Mix

### 2. Coverage Governance eingeführt
- `package.json`
  - `test:coverage` läuft jetzt deterministisch als `vitest run --coverage`
    statt interaktivem Watch-Modus
- `vitest.config.ts`
  - Coverage-Provider: `v8`
  - Reporter: `text`, `json-summary`
  - Mindestschwellen:
    - Statements `25`
    - Lines `25`
    - Functions `45`
    - Branches `60`

### 3. CI härter gemacht
- `.github/workflows/ci.yml`
  - neuer Schritt `Coverage gate`
  - Reihenfolge jetzt:
    - `type-check`
    - `lint`
    - `test:unit`
    - `test:coverage`
    - `test:evals`
    - `build`

## Verifikation

Lokal grün:

- `npm run type-check`
- `npm run lint`
- `npm run test:unit`
- `npm run test:coverage`
- `npm run build`

### Coverage Baseline

All files:

- Statements: `26.72%`
- Branches: `61.70%`
- Functions: `47.88%`
- Lines: `26.72%`

Die Coverage ist noch nicht hoch, aber jetzt erstmals verbindlich
durchgesetzt und nicht mehr nur informativ.

## Wichtige Findings

### Positiv
- Die kritischen Domain-Kerne sind deutlich besser abgesichert als der Rest:
  - `lib/trajectory/*`
  - `lib/career/*`
  - `lib/strategy/*`
  - zentrale API-Routen
- `334` Unit-Tests + Coverage-Gate laufen jetzt in einer verbindlichen
  Qualitätskette statt nur als lose Sammlung
- Neue gezielte Härtungstests decken jetzt zusätzlich ab:
  - `tests/unit/lucian-memory.test.ts`
  - `tests/unit/reverb.test.ts`

### Weiter offen
- Viele Pages/Server-Komponenten haben weiterhin nahezu keine direkte Coverage
- Credential-gated E2E-Flows bleiben sinnvoll, aber im Alltag fragiler als
  reine Unit/Integration-Gates
- Einige Bibliotheks-/UX-Hooks sind noch nicht direkt getestet, z. B.:
  - `lib/hooks/useSoundToast.ts`
  - `lib/sound/reverb.ts`
  - Teile aus `lib/monitoring/*`

## Nächste sinnvolle Qualitätsschritte

1. Coverage-Schwellen schrittweise erhöhen, nicht sprunghaft
2. Pro Midnight-Welle gezielt 1-2 ungetestete Kernbereiche nachziehen
3. Für neue Features gilt:
   - keine Merge-Freigabe ohne grüne Coverage-Gate-Ausführung
   - keine stillen `any`-Einführungen an Domain-Grenzen
4. E2E nur dort ausbauen, wo Unit/Integration die Risiken nicht realistisch
   abdecken können

## Merge-/Release-Entscheidung

GO

Begründung:
- Green Baseline wiederhergestellt
- CI härter als vorher
- kein offener P0/P1-Blocker innerhalb dieses Scopes
