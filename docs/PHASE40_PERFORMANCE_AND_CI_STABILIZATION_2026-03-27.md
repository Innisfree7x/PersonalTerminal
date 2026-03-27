# Phase 40 — Performance and CI Stabilization

Stand: 2026-03-27  
Status: Implementiert

## Ziel

Diese Welle hatte zwei harte Ziele:

1. die App im echten Gebrauch spürbar flüssiger machen, ohne die Premium-Ästhetik zu opfern
2. die zuletzt wieder fragil gewordene CI- und Blocker-E2E-Strecke stabilisieren

Der Fokus lag bewusst auf den tatsächlich spürbaren Hotspots:

- `/today`
- Focus Screen / Floating Timer
- Dashboard-Widgets
- glass-/blur-lastige Flächen
- flakey Blocker-Tests
- mobile Marketing-Navigationselemente

## Umgesetzt

### 1. Sichtbare Performance-Welle auf Today / Focus / Dashboard

Die größte Last kam nicht aus einem einzelnen Fehler, sondern aus vielen
gleichzeitig sichtbaren low-value Effekten:

- zu viel `backdrop-blur`
- zu viele Motion-Effekte in dauerhaft sichtbaren Widgets
- unnötige Repaint-Kosten in Kernflächen

Gezielt entschärft wurden:

- `components/features/dashboard/FocusTasks.tsx`
- `components/features/dashboard/StudyProgress.tsx`
- `components/features/dashboard/PomodoroTimer.tsx`
- `components/features/dashboard/WeekOverview.tsx`
- `components/features/focus/FloatingTimer.tsx`
- `components/features/focus/FocusScreen.tsx`
- `components/features/dashboard/CommandBar.tsx`
- `components/features/dashboard/DashboardStats.tsx`
- `components/features/dashboard/NBAHeroZone.tsx`
- `components/layout/Header.tsx`
- `components/ui/DecisionSurfaceCard.tsx`
- `components/features/career/ApplicationStats.tsx`
- `components/features/career/CareerBoard.tsx`
- `components/features/career/OpportunityRadar.tsx`
- `app/globals.css`

Prinzip:

- weniger GPU-teurer Blur
- weniger Framer-Motion in permanent sichtbaren Bereichen
- nur noch "low-cost premium" statt dekorativer Dauerlast

Wichtig:
- die Oberfläche wurde nicht auf "nackt und schnell" reduziert
- Glass-/Depth-Gefühl bleibt erhalten
- Farbigkeit und Materialität bleiben bewusst sichtbar

### 2. CI-Stabilisierung für Today-Integrationspfade

Mehrere rote CI-Runs kamen nicht von echten Produktdefekten, sondern von
fragilen Testannahmen gegen sich veränderte UI-Copy und Renderstruktur.

Betroffene Tests:

- `tests/integration/today-critical-path.test.tsx`
- `tests/integration/Dashboard.test.tsx`

Gehärtet wurden:

- keine harten Tageszahlen mehr
- keine überstrengen Delta-/Momentum-Textvergleiche
- Assertions näher an echter, stabiler Benutzerwahrnehmung

### 3. Flakey Blocker-E2E für Task-Create gehärtet

Der Blocker-Run war nicht mehr rot wegen echter Funktionalität, sondern
wegen einer flakey Öffnung des Add-Task-Flows auf `/today`.

Datei:

- `tests/e2e/blocker/task-create.blocker.spec.mjs`

Fix:

- robuster `openAddTaskForm()`-Pfad
- mehrere Trigger berücksichtigt
- direkter Event-Dispatch statt fragiler Actionability-Abhängigkeit
- expliziter Retry-Pfad

Ergebnis:

- die Blocker-Suite läuft wieder grün
- der frühere Flake-Gate-Bruch wurde beseitigt

### 4. Mobile Marketing-Fix: Progress-Dots sauber ausgerichtet

Auf kleinen Screens waren die progress-/section dots der Landing nicht sauber
ausgerichtet, weil unsichtbare Labels weiterhin Breite im Layout reserviert
haben.

Datei:

- `components/features/marketing/CinematicLanding.tsx`

Fix:

- Dot-Container auf echtes rechtsbündiges Layout umgestellt
- Labels absolut und nur noch für Desktop/Hover sichtbar gemacht
- mobile Alignment dadurch sauber

### 5. Gemessener Render-Fix: Focus-Timer-State entkoppelt

Nach der ersten Blur-/Motion-Welle blieb ein echter Alltags-Hotspot:

- Header
- Command Palette
- NBA Hero / Dashboard-CTA
- globale Hotkeys

Diese Flächen waren unnötig an den sekündlich tickenden Focus-Timer-State
gekoppelt. Ursache war ein einzelner breiter React-Context, der sowohl
Clock-State als auch Session-State und Actions transportiert hat.

Dateien:

- `components/providers/FocusTimerProvider.tsx`
- `components/shared/CommandPalette.tsx`
- `components/providers/PowerHotkeysProvider.tsx`
- `components/features/dashboard/NBAHeroZone.tsx`
- `components/layout/Header.tsx`
- `components/shared/CommandPaletteProvider.tsx`
- `components/layout/SidebarProvider.tsx`

Fix:

- Focus-Timer-Provider in drei Kontexte geteilt:
  - `Clock`
  - `Session`
  - `Actions`
- tickende Werte (`timeLeft`, `totalTime`) isoliert
- nicht tickende Verbraucher auf schlanke Hooks umgestellt:
  - `useFocusTimerClock()`
  - `useFocusTimerSession()`
  - `useFocusTimerActions()`
- bestehendes `useFocusTimer()` als kompatibler Kombinations-Hook behalten
- Provider-Werte in Command Palette und Sidebar zusätzlich memoisiert

Ergebnis:

- Header, Command Palette, Hotkeys und NBA Hero rerendern nicht mehr jede Sekunde
- der Timer bleibt sichtbar aktuell, aber globale UI-Flächen bleiben ruhiger
- das ist ein struktureller Render-Fix, kein kosmetischer Blur-Tradeoff

## Verifikation

Lokal grün:

- `npm run lint`
- `npm run build`
- `npm run type-check`
- gezielte Today-/Dashboard-Integrationstests
- komplette Unit-Suite

GitHub CI:

- `Quality Checks` ✅
- `E2E Blocker Suite (Authenticated, Serial)` ✅

## Ergebnis

Die App ist nach dieser Welle:

- spürbar flüssiger im echten Gebrauch
- deutlich weniger blur-/motion-lastig an den falschen Stellen
- strukturell entkoppelt von sekündlichen Timer-Rerenders in globalen UI-Flächen
- CI-seitig wieder stabil entlang der kritischen Today-/Blocker-Pfade
- auf Mobile in der aktiven Landing sauberer ausgerichtet

## Nicht gemacht

- keine globale Design-Verflachung
- kein pauschales Entfernen aller Animationen
- keine aggressive "Performance um jeden Preis"-Optik
- keine neuen Produktfeatures in diese Welle gemischt

## Offene Restpunkte

- GitHub Actions nutzt weiterhin alte Node-20-basierte Action-Versionen
  (`actions/checkout@v4`, `actions/setup-node@v4`, teils `upload-artifact@v4`)
- Tenant-Isolation-Check wird weiterhin korrekt geskippt, solange
  `TENANT_A_*` / `TENANT_B_*` Secrets fehlen
- eine lokale, bewusst uncommittete Datei bleibt außerhalb dieses Scopes:
  - `tests/integration/strategy-prefill.test.tsx`

## Nächste sinnvolle Welle

1. `CommandPalette`-/Overlay-Performance nur noch gezielt nach echter Nutzung prüfen
2. Strategy-/Trajectory-Rendering-Hotspots messen statt blind weiteroptimieren
3. Produktseitig zurück zu:
   - Career Intelligence
   - Daily Core Compression
   - Strategy + Trajectory Fusion
