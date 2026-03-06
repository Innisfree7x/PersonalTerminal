# INNIS — Next Level Vision

Status: Aktives Referenzdokument (Richtungskompass, kein Execution-Commitment)
Zuletzt aktualisiert: 2026-03-06
Purpose: Langfristige Produktrichtung von "vibe project" → High-End Software

> **Für Codex-Agents:** Dieses Dokument ist der strategische Nordstern.
> Bevor du ein Feature planst, prüfe: "Bringt das uns näher an dieses Bild?"
> Implementierungsstand → siehe Abschnitt "Priorisierung" am Ende.

---

## Die Kernfrage

Was trennt ein gutes Indie-Projekt von High-End Software wie Linear, Raycast, Arc?

**Nicht mehr Features. Nicht besseres Design allein.**

Es ist **Kohärenz + Meinung + Geschwindigkeit + Identität.**

High-End Software hat ein klares Weltbild. Du weißt sofort wofür sie steht.

---

## Die Positionierung (ein Satz)

> **"INNIS zeigt dir Kollisionen in deinem Karriereplan bevor sie passieren."**

Nicht "productivity dashboard". Nicht "all-in-one student tool".
Das ist ein Satz den jeder Student mit drei parallelen Zielen sofort versteht —
und den kein anderes Tool besetzt hat.

---

## Produkt — Next Level Ideas

### 1. Command-First Everything

Die Command Palette ist heute ein nettes Feature.
Bei High-End Software ist sie das Betriebssystem.

Alles was irgendwo per Click gemacht werden kann, muss per Command funktionieren:

```
> add gmat milestone march 2027 521h
> show my risk status
> start 50min focus on thesis
> whats my trajectory this week
> commit simulation
```

Kein AI-Wrapper — deterministischer Parser der echte Aktionen ausführt.
`lib/command/parser.ts` ist der Kern. Es geht darum alles daran anzuschließen.

**Warum es zählt:** Power User erkennen sofort: das ist ein Werkzeug das ernst nimmt wie sie arbeiten.

---

### 2. Sub-50ms auf alles

High-End Software fühlt sich nicht schnell an weil der Server schnell ist —
sondern weil die UI nie wartet.

- Optimistic Updates auf jeden Write
- Kein einziger Spinner auf einer normalen Interaktion
- Task done → sofort gestrichen, nicht nach API-Response
- Plan generiert → Timeline animiert sofort, Server-Confirmation kommt nach

Das ist technisch nicht schwer. Es ist Disziplin bei jedem Feature.

---

### 3. Crisis Mode

**Das fehlt überall und wäre uniquely INNIS.**

Wenn ein Goal auf "at risk" kippt — verändert sich die App. Nicht nur ein roter Badge:

- UI vereinfacht sich automatisch
- Trajectory rückt nach oben in Today
- Today zeigt nur noch was für Recovery relevant ist
- Rote Akzente statt Amber
- Lucian wechselt in Support-Modus mit konkreten Recovery-Vorschlägen
- Alle sekundären Widgets treten zurück

Die App hat eine Meinung: *wenn es ernst wird, räumt sie für dich auf.*

---

### 4. Momentum Score

Statt nur "on track / tight / at risk" — **eine einzige Zahl, 0–100**,
die sich wöchentlich verändert. Wie ein Kredit-Score für deinen Karriere-Plan.

Berechnung deterministisch aus Trajectory-Daten:
- Anteil Goals on track
- Wochenkapazität tatsächlich vs. geplant
- Buffer-Verbrauch über Zeit
- Trend (steigend / fallend)

**Warum es zählt:** Menschen verfolgen Zahlen. Sie optimieren sie.
Das schafft intrinsische Retention ohne Push-Notifications.

Anzeige: oben in Today, prominent. Wöchentlicher Delta sichtbar.

---

### 5. Trajectory als Home

Today ist aktuell der Startpunkt. Aber Trajectory ist das differenzierende Feature.

**Vision:** Der erste Screen nach Login ist eine 10-Sekunden Zusammenfassung:
> *"Dein nächster kritischer Moment ist in 14 Tagen. GMAT-Prep sollte heute starten."*

Dann Today darunter — nicht umgekehrt.

Trajectory wird zum Herzschlag der App. Alles andere ist taktische Ausführung davon.

---

### 6. Adaptive Estimation

Wenn ein User konsistent weniger Stunden schafft als geplant —
lernt INNIS das und passt Schätzungen automatisch an.

Kein ML nötig. Einfache Regel:
```
tatsächliche_stunden = sum(focus_sessions) pro Woche
if tatsächliche < geplante für 3 Wochen in Folge:
  Warnung + Angebot: "Baseline anpassen?"
```

Die App wird ehrlicher als der User zu sich selbst.

---

### 7. Predictive Conflict Detection

Bevor ein User einen neuen Milestone hinzufügt:
> *"Wenn du dieses Praktikum-Fenster einplanst AND die Thesis-Deadline März 2027 ist,
> schrumpft dein GMAT-Buffer auf 1 Woche. Willst du sehen was sich ändert?"*

Nicht blockieren — warnen und simulieren. Der User entscheidet.
Das ist deterministisch aus bestehenden Daten berechenbar.

---

## Design — Next Level Ideas

### 1. Sound Design als Produktidentität

Nicht Notification-Sounds. **Produkt-Sounds.**

| Moment | Sound |
|--------|-------|
| Task completed | kurzes satisfying Click |
| Milestone "on track" nach Plan | ruhiger Akkord |
| "at risk" Status | subtiles tiefes Tone-Shift (kein Alarm) |
| Focus session end | ein Atemzug |
| Momentum Score steigt | aufsteigender kurzer Ton |
| Crisis Mode aktiviert | tiefes, ruhiges Signal |

Lucian hat schon Sounds. Das auf die ganze App ausweiten.
Sound ist das unbesetzteste Differenzierungsmerkmal in Productivity Tools.

---

### 2. Einheitliche Motion Language

Aktuell hat jede Animation eigene Logik. High-End: ein Motion-System mit 4 Kurven:

| Kurve | Verwendung |
|-------|-----------|
| `easeOut` sanft | Eintritt (immer von unten) |
| `easeIn` sanft | Exit (immer nach oben) |
| `spring` mit Bounce | Erfolg, Completion |
| `shake` kurz | Warnung, Error |

Drei Zeilen pro Komponente — aber konsequent überall.

---

### 3. Typography als Datensignal

Variable Fonts die auf Daten reagieren:
- Momentum Score hoch → Headline minimal breiter, selbstsicherer
- Deadline < 14 Tage → Font dichter, fokussierter
- Crisis Mode → schwereres Gewicht

Subtil genug dass man es fühlt ohne es zu benennen.
Das ist das Detail das Journalisten in Product Reviews erwähnen.

---

### 4. Leere Zustände als Onboarding

Jeder leere State ist eine Einladung, kein Vakuum.

```
Statt: "Keine Milestones vorhanden"
Besser: "Dein erster Milestone setzt alles in Gang.
         Was ist dein nächstes großes Ziel? →"
```

Jedes leere Widget zeigt konkret was es produziert wenn es Daten hat.

---

## Marketing — Next Level Ideas

### 1. Kein Signup für den Aha-Moment

Der Trajectory-Simulator funktioniert ohne Login direkt im Hero.

User gibt ein: Ziel + Deadline + Slider h/Woche.
Sofort: on track / tight / at risk mit konkretem Datum.

Das konvertiert. Weil User schon investiert sind bevor sie sich anmelden.
**Implementierung: clientseitiges JS, kein API-Call nötig.**

---

### 2. Founder Story

> *"Ich habe das für mich gebaut weil ich Bachelor, GMAT und Praktikum
> gleichzeitig gemanagt habe und den Überblick verloren habe."*

Das ist keine Marketing-Copy. Das ist die Geschichte die Menschen weitererzählen.
High-End Indie Software hat immer eine Person dahinter die man kennt.

---

### 3. Building in Public

Wöchentliche Posts: was gebaut wurde, was gelernt wurde, eine Metrik.

Nicht: *"wir haben Feature X gebaut"*

Sondern: *"80% unserer User setzen GMAT als ersten Milestone.
Das hat unser Onboarding verändert — hier wie."*

Das baut Vertrauen und zieht die Zielgruppe organisch an.

---

### 4. Use-Case Pages mit echten Timelines

```
/for-gmat         → GMAT Study Plan 6 Monate Beispiel-Timeline
/for-thesis       → Bachelorarbeit Backplanning von Abgabe rückwärts
/for-internship   → Praktikumsfenster + Bewerbungsplan
```

Jede Seite: echte Beispiel-Timeline, konkrete Zahlen, spezifischer CTA.
SEO-Play der genau die Leute trifft die nach "GMAT study plan 6 months" suchen.

---

### 5. Before/After Sektion

```
Ohne INNIS:     5 Tools + Notion + Excel + Calendar + Angst
Mit INNIS:      1 Timeline + Daily Flow + Risk sichtbar
```

Einfach. Funktioniert nachweislich in jeder Landing Page Kategorie.

---

### 6. Proof Bar mit echten Zahlen

```
[X aktive Studenten] · [Y geplante Milestones] · [Z Fokusstunden]
```

Anfangs geschätzt/seeded. Später real aus Analytics.
Soziale Beweis-Signale die keine Testimonials brauchen.

---

## Implementierungsstand (Stand: 2026-03-06)

### ✅ Abgeschlossen (Phase 17–18)

| # | Feature | Wo implementiert |
|---|---------|-----------------|
| 1 | Onboarding V2 → Aha-Moment in < 3 Min | `app/onboarding/page.tsx`, `StepTrajectoryGoal.tsx`, `StepTrajectoryPlan.tsx` |
| 2 | Interactive Hero Simulator (kein Signup nötig) | `components/features/marketing/HeroSection.tsx` + `lib/trajectory/risk-model.ts` |
| 3 | Risk-to-Action Bridge ("In Today übernehmen") | `app/(dashboard)/trajectory/page.tsx` (idempotent task package creation) |
| 4 | Waitlist Segmentierung (Thesis/GMAT/Praktikum/Master) | `app/auth/signup/page.tsx`, `lib/auth/client.ts`, Analytics-Event `waitlist_segment_selected` |
| 5 | Today Command Center (Top 3 kritische Tasks) | `app/(dashboard)/today/page.tsx` — "Heute kritisch: Top 3 Moves" Block |
| 6 | Before/After Marketing | `components/features/marketing/ProblemStrip.tsx` |
| 7 | Trajectory Morning Briefing mit Deep-Link | `lib/dashboard/trajectoryBriefing.ts`, `/today` → `/trajectory?goalId=...` |
| 8 | Trajectory auf Features-Page | `app/(marketing)/features/page.tsx` — erstes Feature-Item |

---

### 🔜 Nächste Prioritäten (Phase 2 — aktiv)

Execution contract: `docs/PHASE19_MOMENTUM_SOUND_EXECUTION_CONTRACT.md`

Locked scope for this wave:
- Momentum Score in `/today`
- Sound Phase 1 (default-off + explicit opt-in + product cues)

#### 1. Momentum Score (0–100, wöchentlich)
**Warum:** Menschen verfolgen und optimieren Zahlen. Schafft intrinsische Retention ohne Push-Notifications.

Berechnung deterministisch:
- Anteil Goals on track
- Wochenkapazität tatsächlich vs. geplant
- Buffer-Verbrauch über Zeit
- Trend (steigend / fallend)

Anzeige: Prominent in `/today`, wöchentlicher Delta sichtbar.

Implementierung:
- `lib/trajectory/momentum.ts` — Berechnungslogik (kein ML, deterministisch)
- `app/api/trajectory/momentum/route.ts` — GET endpoint, gecacht (staleTime: 1h)
- Widget in `app/(dashboard)/today/page.tsx`

---

#### 2. Sound Design Phase 1
**Warum:** Das unbesetzteste Differenzierungsmerkmal in Productivity Tools. Lucian hat bereits Sounds — das auf die gesamte App ausweiten.

| Moment | Sound |
|--------|-------|
| Task completed | Kurzes satisfying Click |
| Milestone "on track" nach Plan | Ruhiger Akkord |
| "at risk" Status | Subtiles tiefes Tone-Shift (kein Alarm) |
| Focus session end | Ein ruhiger Ton |
| Momentum Score steigt | Aufsteigender kurzer Ton |

Implementierung:
- `components/providers/SoundProvider.tsx` — Sound-Registry + Playback-Guards
- Integration in Task-completion-Flow (`daily_tasks` toggle)
- Integration in Trajectory risk status change
- Settings-Toggle: App-Sounds an/aus (separat von Focus-Sounds)

Guardrails:
- Sound default off (opt-in only)
- One-time opt-in prompt after first completed focus session
- Cooldown-protected playback to avoid notification spam

---

### 🔮 Phase 3 (nach Retention-Daten)

#### 9. Crisis Mode
Wenn ein Goal auf "at risk" kippt — verändert sich die App:
- UI vereinfacht sich automatisch
- Trajectory rückt nach oben in Today
- Today zeigt nur noch was für Recovery relevant ist
- Rote Akzente statt Amber
- Lucian wechselt in Support-Modus mit konkreten Recovery-Vorschlägen

#### 10. Weekly Drift Report (In-App + Mail)
Wöchentliche Zusammenfassung: Kapazitätsdrift, Buffer-Verbrauch, Trend.
Deterministisch, kein LLM nötig — analog zu `WeeklyReview` in `/analytics`.

#### 11. Use-Case Pages (/for-gmat etc.)
```
/for-gmat         → GMAT Study Plan 6 Monate Beispiel-Timeline
/for-thesis       → Bachelorarbeit Backplanning von Abgabe rückwärts
/for-internship   → Praktikumsfenster + Bewerbungsplan
```
SEO-Play der genau die Leute trifft die nach "GMAT study plan 6 months" suchen.

#### 12. Adaptive Estimation
Wenn ein User konsistent weniger Stunden schafft als geplant:
```
if tatsächliche < geplante für 3 Wochen in Folge:
  Warnung + Angebot: "Baseline anpassen?"
```

#### 13. Proof Bar mit echten Zahlen
```
[X aktive Studenten] · [Y geplante Milestones] · [Z Fokusstunden]
```

---

### 🌅 Langfristig

| # | Feature | Beschreibung |
|---|---------|-------------|
| 14 | Predictive Conflict Detection | Warnung vor Milestone-Kollisionen beim Hinzufügen neuer Goals |
| 15 | Command-First Full Coverage | Alle App-Aktionen per `lib/command/parser.ts` ausführbar |
| 16 | Typography als Datensignal | Variable Fonts die auf Momentum Score + Deadlines reagieren |
| 17 | Motion Language System | 4 kanonische Easing-Kurven konsistent durch die gesamte App |

---

## Architektur-Regeln für neue Features (für Codex)

1. **Risk-Logik:** Immer aus `lib/trajectory/risk-model.ts` — nie in UI duplizieren.
2. **Neue Analytics-Events:** Immer in `lib/analytics/events.ts` whitelist + Schema + Contract-Test.
3. **Berechnungen → `lib/`:** Keine Business-Logik in Page-Komponenten oder API-Routen.
4. **Feature Isolation:** Jedes Widget hat eigenes `useQuery` — niemals await-chained am Page-Level.
5. **TypeScript strict:** `exactOptionalPropertyTypes: true` — kein explizites `undefined` übergeben.

---

## Was das nicht ist

- Kein Roadmap-Commitment
- Keine Versprechen an User
- Kein Grund jetzt Feature-Creep zu starten

Das ist die Richtung. Jede Entscheidung im Alltag kann dagegen gemessen werden:
*"Bringt das uns näher an dieses Bild?"*
