# Today-Redesign v2 — Spec

**Datum:** 2026-04-22
**Branch:** `feature/today-redesign-v2`
**Status:** in Arbeit (Midnight-Session, autonom)

## Problem

Aktueller `/today`-Screen zeigt Dekoration statt Entscheidungen:

- **LucianRoom dominiert** den Viewport (36–48vh) mit wenig Informationsgehalt. Ein 16-bit-Sprite vor Neon-Wand-Ambiente nimmt den prime-spot, bevor überhaupt eine produktive Zeile zu sehen ist.
- **Morning-Briefing als Textwurm:** Trajectory-Status, Momentum, Fokus-Load, Tasks-Zähler und KIT-Event stehen als Kette winziger Chips in einer Zeile unter dem Raum. Das ist der informativste Teil der Seite — und visuell nachrangig.
- **Keine Hierarchie:** Die Antwort auf „Was muss ich jetzt tun?" ist unklar. Kollision, Deadline, Prüfung, offene Tasks — alles gleich laut (oder gleich leise).
- **Trajectory, laut Vision der Hero der App,** erscheint als einzige Zeile Text mit Link-Button. Soll das Kernwert-Versprechen sein, ist aber visuell marginal.
- **Lucian-Bubble spricht in die Mitte des Raums**, was den Raum blockiert und nicht zur Aktion führt.

## Ziel

Above-the-fold muss auf einen Blick beantworten:

1. **Was kracht?** (Kollision, Deadline, Prüfung in N Tagen)
2. **Wie steht mein Momentum?** (emotional lesbar, nicht nur Zahl)
3. **Was mache ich als Nächstes?** (konkrete Action, nicht Dashboard)

Alles andere — Raum, Lucian, Achievements, Study Progress — ist sekundär und darf nicht die Hauptfläche beanspruchen.

## Design-Prinzipien

- **Command Center statt Game Screen.** Information Density > Deko.
- **Reduziert + warm.** Bestehendes `card-surface` / `card-warm`-System, 4-Color-Gradient-Strip als Identität, keine zusätzliche Neon-Opulenz.
- **Emotional Hook ohne Kitsch.** Momentum als Pulsschlag (animiert), Trajectory-Kollision mit atmender Dringlichkeit, aber keine Jump-Scares.
- **Sub-50ms Reaktionen.** Hover/Click → unmittelbare visuelle Rückmeldung. Keine späten API-Calls für Layout.
- **Raum bleibt, schrumpft.** LucianRoom als Ambient-Sidebar (rechts, ~22–28%) oder als kollabierbare Zeile. Identität geht nicht verloren, Platz schon.

## Neue Struktur

```
┌──────────────────────────────────────────────────────────────┐
│ TrajectoryCollisionHero   (dominant, ~220px)                 │
│   ▪ "In 12 Tagen: Makroökonomie-Klausur"                     │
│   ▪ Kollisions-Timeline mit Prep-Blocks + heutigem Slot      │
│   ▪ Risk-Pill (on_track / tight / at_risk / critical)        │
│   ▪ CTA: "Öffne Trajectory" oder "Prep-Block setzen"         │
├──────────────────────────────────────────────────────────────┤
│ MomentumPulse   │  NextMovesStack (3 Karten nebeneinander)   │
│  (Ring,         │   ▪ Next KIT-Event (Zeit + Ort + Kurs)     │
│   animiert,     │   ▪ Next Task (Titel + Deadline)           │
│   Score + Trend)│   ▪ Next Deadline (Kurs + Tage)            │
│                 │  Jede Karte hat 1-Klick-Action             │
├──────────────────────────────────────────────────────────────┤
│ Secondary-Grid: StudyProgress │ FocusTasks (kürzer, kompakt) │
├──────────────────────────────────────────────────────────────┤
│ AmbientRoom (kollabiert, klickbar „Raum öffnen")             │
│   — Lucian-Bubble als Floating-Companion, nicht Center       │
└──────────────────────────────────────────────────────────────┘
```

Mobile: Hero volle Breite, MomentumPulse + NextMoves stacken vertikal, Ambient-Room ganz unten.

## Komponenten

### `TrajectoryCollisionHero`
- **Input:** `trajectoryMorning` aus `/api/dashboard/next-tasks?include=trajectory_morning`
- **Visual:** Zwei Zeilen. Zeile 1: Status-Pill + „In Xd: {Ziel}". Zeile 2: horizontale Mini-Timeline (heute → Deadline), mit Prep-Blocks als Balken, heutigem Tag als Marker.
- **Fallback:** Wenn kein aktives Trajectory-Ziel → CTA „Ziel einrichten" mit Link nach `/onboarding` oder `/trajectory`.
- **Datei:** `components/features/today/TrajectoryCollisionHero.tsx`

### `MomentumPulse`
- **Input:** `momentum: { score: number, trend: 'up' | 'flat' | 'down' }`
- **Visual:** Kreisring mit Score-Zahl innen, Trend-Indikator, leichter Pulse-Animation (framer-motion, 3s-Cycle, 2% Scale). Farbe nach Score-Bucket (rot < 40, amber 40–70, sky > 70).
- **Datei:** `components/features/today/MomentumPulse.tsx`

### `NextMovesStack`
- **Input:** `stats.nextExam`, `kitSignals.nextCampusEvent`, `studyProgress`, `nextTasks` (first item)
- **Visual:** 3 Karten mit je: Icon-Chip, 1-Zeilen-Titel, Subtitel (Zeit/Ort/Tage), Action-Button. Hover = leichter Lift + accent-ring.
- **Datei:** `components/features/today/NextMovesStack.tsx`

### `AmbientRoomPanel`
- **Visual:** Kleiner Horizontal-Streifen (~80–120px Höhe, volle Breite) oder Floating-Widget. Enthält LucianRoom (miniaturisiert) + Room-Style-Pill + Ambience-Indicator. Klickbar → Modal mit Vollbild-Raum.
- **Datei:** `components/features/today/AmbientRoomPanel.tsx`
- **Wiederverwendung:** LucianRoom-Komponente selbst wird nicht umgebaut, nur der Container-Wrapper.

## Nicht-Ziele (ausdrücklich NICHT in dieser Session)

- **Morning-Ritual nicht umbauen.** Wenn's noch im Code ist, unter Ambient-Room verstecken oder ausblenden bis gecheckt.
- **Achievements nicht umbauen.** Overlay bleibt wie es ist.
- **Keine API-Änderungen.** Wir nutzen die bestehenden Felder aus `/api/dashboard/next-tasks`.
- **Keine DB-Änderungen.** Alles Frontend.
- **Kein Merge auf main.** Session endet auf `feature/today-redesign-v2` mit Push.

## Akzeptanzkriterien (beim Aufwachen prüfen)

- [ ] `/today` lädt ohne Fehler
- [ ] Above-the-fold beantwortet „Was kracht, was mache ich?"
- [ ] LucianRoom nimmt maximal ~25% der Viewport-Höhe ein
- [ ] Momentum ist emotional lesbar (Farbe + Animation), nicht nur Zahl
- [ ] Kein regressives Verhalten bei Loading/Error-States
- [ ] `npm run type-check` grün
- [ ] `npm run test:unit` 100% (oder Today-Tests entsprechend angepasst)
- [ ] Pushed auf `feature/today-redesign-v2`, KEIN Merge

## Offene Entscheidungen (User darf übersteuern)

- **Raum-Position:** Unterhalb (Horizontalstreifen) oder rechts (Sidebar)?
  → **Entscheidung Claude:** Unterhalb als Horizontalstreifen — simpler, mobile-friendlier, behält Breite für Hero.
- **MomentumPulse-Größe:** 160px oder 200px Durchmesser?
  → **Entscheidung Claude:** 180px, weil es neben NextMovesStack sitzt und nicht dominieren darf.
- **Kollisions-Timeline:** Statisch oder animiert einlaufend?
  → **Entscheidung Claude:** Beim Initial-Mount einmal animiert (300ms), danach statisch. Kein Loop.

Alle Entscheidungen sind rollback-freundlich, da reversibel.
