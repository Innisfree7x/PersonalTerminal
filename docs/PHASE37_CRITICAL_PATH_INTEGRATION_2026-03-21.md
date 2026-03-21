# Phase 37 — Critical Path Integration and Coverage Lift

Stand: 2026-03-21  
Status: Implementiert

## Ziel

Phase 36 hat die harte Qualitätsbaseline wiederhergestellt. Diese Welle
zieht jetzt die wichtigsten Produktpfade zusätzlich über Integrationstests
hoch und hebt die Coverage so weit an, dass das neue CI-Gate nicht nur formal,
sondern auch praktisch belastbar ist.

## Umgesetzt

### 1. Drei Critical Paths als Integrationstests abgesichert

- `tests/integration/today-critical-path.test.tsx`
  - verifiziert Morning-Briefing, Momentum-Widget und Weekly-Check-in auf
    `/today`
- `tests/integration/career-radar-bridge.test.tsx`
  - verifiziert die Brücke Radar -> Pipeline-Prefill im Career-Flow
- `tests/integration/trajectory-prefill.test.tsx`
  - verifiziert URL-Prefill im Trajectory-Flow inklusive korrekter
    Sichtbarkeit der Wochenwerte

### 2. Niedrig hängende ungetestete Kernbausteine direkt gehärtet

Neue gezielte Unit-Tests:

- `tests/unit/useSoundToast.test.tsx`
- `tests/unit/toggle-switch.test.tsx`
- `tests/unit/analytics-client.test.ts`
- `tests/unit/sidebar-provider.test.tsx`
- `tests/unit/command-palette-provider.test.tsx`
- `tests/unit/query-provider.test.tsx`
- `tests/unit/brand-logo.test.tsx`

Diese Tests heben keine reine "Test-Masse", sondern schließen bewusst
produktive, bislang ungesicherte Funktionen:

- Sound-Feedback
- Theme-/Toggle-Interaktion
- Analytics-Client-Ingress
- Sidebar-/Command-Provider-Zustand
- QueryClient-Konfiguration
- Brand-UI-Grundkomponenten

### 3. Echter UX-Fix im Trajectory-Prefill

- `app/(dashboard)/trajectory/page.tsx`
  - beim Öffnen eines URL-prefilled Trajectory-Entwurfs wird die Planning Unit
    jetzt explizit auf `weeks` gesetzt, damit `effortHours` und
    `bufferWeeks` direkt sichtbar zur URL-Payload passen

Ohne diesen Fix war der Prefill logisch vorhanden, aber in bestimmten
UI-Zuständen nicht klar erkennbar.

### 4. Test-Harness erweitert

- `tests/utils/test-utils.tsx`
  - `motion.section` in den Framer-Motion-Mock aufgenommen

Das macht die neue Integrationsabdeckung stabil, ohne das Produktverhalten
zu verbiegen.

## Verifikation

Lokal grün:

- `npm run test -- --run tests/integration/today-critical-path.test.tsx tests/integration/career-radar-bridge.test.tsx tests/integration/trajectory-prefill.test.tsx`
- `npm run test -- --run tests/unit/useSoundToast.test.tsx tests/unit/toggle-switch.test.tsx tests/unit/analytics-client.test.ts tests/unit/sidebar-provider.test.tsx tests/unit/command-palette-provider.test.tsx tests/unit/query-provider.test.tsx tests/unit/brand-logo.test.tsx`
- `npm run test:coverage`
- `npm run type-check`
- `npm run lint`
- `npm run build`

### Coverage Baseline nach Phase 37

All files:

- Statements: `30.88%`
- Branches: `64.22%`
- Functions: `45.36%`
- Lines: `30.88%`

Wichtig:
- Das Ziel dieser Welle war nicht "hohe Gesamt-Coverage", sondern
  "kritische Pfade + Function-Gate belastbar grün".
- Die `functions`-Schwelle wird jetzt real erfüllt statt knapp verfehlt.

## Wichtige Findings

### Positiv
- Die Codebase hat jetzt nicht nur Unit-Masse, sondern erste echte
  produktorientierte Integrationstests entlang der wichtigsten Flows:
  - `Today`
  - `Career`
  - `Trajectory`
- Mehrere bislang ungetestete Infrastruktur-/Provider-Bausteine sind jetzt
  direkt abgesichert.
- Das Coverage-Gate in CI ist praktisch stabilisiert, nicht nur konfiguriert.

### Weiter offen
- Große Page-Dateien bleiben erwartbar untergetestet; dort sollte selektiv
  weiter an Domain-Logik statt an kompletter Renderabdeckung gearbeitet werden
- Die größten Coverage-Lücken liegen weiterhin in:
  - `lib/dashboard/queries.ts`
  - `lib/monitoring/*`
  - `lib/supabase/*`
- E2E bleibt für echte Multi-Account-/Auth-Flows nötig, aber sollte weiter
  nur dort genutzt werden, wo Integrationstests Risiken nicht realistisch
  abdecken

## Nächste sinnvolle Qualitätsschritte

1. `lib/dashboard/queries.ts` gezielt mit Use-Case-Tests absichern
2. `lib/monitoring/*` weiter härten, damit Ops-/Error-Pfade nicht nur
   dokumentiert, sondern regressionssicher sind
3. `lib/supabase/*` an den Repository-Grenzen testen statt nur über API-Routen
4. Coverage-Schwellen künftig nur schrittweise anheben, wenn konkrete
   Hotspots nachgezogen wurden

## Merge-/Release-Entscheidung

GO

Begründung:
- Coverage-Gate real erfüllt
- Critical Paths für `Today`, `Career`, `Trajectory` neu abgesichert
- kein offener P0/P1-Blocker in diesem Scope
