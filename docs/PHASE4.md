# Phase 4 — Power-User Experience (LoL-Style Hotkeys)

> **Vision:** Prism fühlt sich wie ein echtes Terminal an. Die Maus wird optional.
> Jede Aktion in < 3 Keystrokes. Muscle Memory. Kein Modifier-Chaos.

---

## Übersicht

| Feature | Priorität | Status |
|---------|-----------|--------|
| A1 — Page Navigation (1-7, B) | P0 | 🟡 in progress |
| A2 — Listen-Navigation (J/K) | P0 | 🟡 in progress |
| A3 — Abilities (Q W E R) | P1 | 🔲 todo |
| A4 — Summoner Spells (D/F) | P1 | 🔲 todo |
| A5 — Tab Scoreboard | P1 | 🔲 todo |
| A6 — Space (dringendstes Item) | P2 | 🔲 todo |
| A7 — Ping-System (G+) | P2 | 🔲 todo |
| A8 — Shop / Command Bar (P) | P2 | 🟡 in progress |
| A9 — Shortcut Overlay (?) | P2 | 🟡 in progress |

---

## A1 — Page Navigation

**Prinzip:** Item-Slots aus LoL. Finger lernen Positionen automatisch.

```
1  →  /today        (Hauptlane — Daily Dashboard)
2  →  /goals
3  →  /career
4  →  /university
5  →  /analytics
6  →  /calendar
7  →  /settings
B  →  /today        (Recall — von überall zurück zur Base)
```

**Implementation:**
- Global `keydown` listener im Root Layout
- Nur aktiv wenn kein Input/Textarea fokussiert ist
- `router.push()` via `useRouter` aus next/navigation
- `B` = identisch zu `1` aber mit optionaler kurzer Transition-Animation ("Recall-Kanal")

---

## A2 — Listen-Navigation (J / K)

**Prinzip:** Vim-style Last-Hit-Feeling. Smooth, kein Lag, kein Hover.

```
J  →  nächstes Item fokussieren
K  →  vorheriges Item fokussieren
Enter  →  fokussiertes Item öffnen / bearbeiten
E      →  fokussiertes Item inline editieren
D      →  fokussiertes Item löschen (mit kurzer Bestätigung)
Space  →  Checkbox togglen (bei Tasks)
Escape →  Fokus aufheben / Modal schließen
```

**Visueller Stil:**
- Fokussiertes Item bekommt `▶` Cursor links (Terminal-Style)
- Kein Hover-Effekt — nur Keyboard-Fokus zählt
- Subtile `border-l-2 border-accent` Linie am fokussierten Item

**Implementation:**
- Custom Hook `useListNavigation(items, onSelect)` — wiederverwendbar auf allen Seiten
- `data-focused` Attribut auf dem fokussierten Element
- Scroll-into-view automatisch bei J/K

---

## A3 — Abilities (Q W E R)

**Prinzip:** Dieselben 4 Keys, kontextsensitive Aktionen je nach aktiver Seite.
R ist immer die mächtigste Aktion ("Ultimate").

| Key | /today | /goals | /career | /university | /analytics | /calendar |
|-----|--------|--------|---------|-------------|------------|-----------|
| **Q** | Neuer Task | Neues Goal | Neue Bewerbung | Neue Übung eintragen | Zeitraum wechseln | Neues Event |
| **W** | Task als erledigt | Goal Progress +1 | Bewerbungsstatus wechseln | Blatt abhaken | Chart-Typ wechseln | Event-Details |
| **E** | Fokussiertes Item editieren | Fokussiertes Item editieren | Fokussiertes Item editieren | Fokussiertes Item editieren | Filter togglen | Event editieren |
| **R** | ⚡ Focus Session starten | ⚡ Alle Goals heute anzeigen | ⚡ Pipeline-Gesamtübersicht | ⚡ Prüfungs-Countdown Overlay | ⚡ Weekly Summary | ⚡ Heute-Ansicht |

**Implementation:**
- Context-Provider `usePageContext()` gibt aktuelle Seite zurück
- Abilities-Map: `Record<Page, Record<'q'|'w'|'e'|'r', () => void>>`
- Abilities werden als Prop an Page-Komponenten übergeben oder via Context konsumiert
- Visual Feedback: kurze Key-Animation (wie LoL Ability-Flash) unten rechts

**Ability HUD (optional — Phase 4.5):**
```
┌─────────────────────────────────────────┐
│  [Q] Neuer Task  [W] Erledigt  [E] Edit  [R]⚡ Focus │
└─────────────────────────────────────────┘
```
Kleine Leiste unten rechts, zeigt aktuelle Abilities. Nur sichtbar wenn Keyboard-Modus aktiv.

---

## A4 — Summoner Spells (D / F)

**Prinzip:** 2 frei belegbare Shortcuts für Lieblingsaktionen — definiert in Settings.

```
D  →  User-defined (Default: Quick-Capture öffnen)
F  →  User-defined (Default: Focus Timer toggle)
```

**Verfügbare Aktionen zum Belegen:**
- Quick-Capture öffnen
- Focus Timer start/stop
- Command Bar öffnen
- /today navigieren
- Neue Task erstellen
- Streak-Übersicht
- Mood tracken

**Implementation:**
- Settings-Page: Dropdown für D und F
- Gespeichert in `localStorage` (kein DB-Call nötig)
- `useSummonerSpells()` Hook liest Settings und registriert Listener

---

## A5 — Tab Scoreboard (Weekly Stats Overlay)

**Prinzip:** Tab halten → Overlay erscheint. Tab loslassen → verschwindet. Genau wie LoL Scoreboard.

```
Tab (halten)  →  Weekly Scoreboard einblenden
Tab loslassen →  verschwindet
```

**Overlay Design:**
```
┌──────────────────────────────────────────────────┐
│           WEEKLY SCOREBOARD — KW 8               │
├──────────────────────────────────────────────────┤
│  Tasks      12 / 15   ████████░░   80%   +3 🔺   │
│  Goals       3 / 5    ██████░░░░   60%   = 🟡    │
│  Focus      8.5h      █████████░   90%   +2h 🔺  │
│  Streak     🔥 7 days                             │
│  Übungen    14 / 20   ███████░░░   70%            │
│  Bewerbung   2 diese Woche                        │
├──────────────────────────────────────────────────┤
│  KDA        12 / 2 / 8    Grade: A-               │
└──────────────────────────────────────────────────┘
```

- KDA = Tasks erledigt / verpasste Deadlines / Goals geholfen
- "Grade" berechnet sich aus Kombination aller Metriken
- Animiert rein (Framer Motion, von oben)
- Daten kommen aus bestehenden APIs (`/api/user/streak`, `/api/dashboard/today`, etc.)

**Implementation:**
- `keydown` → Tab → State `isScoreboardOpen = true`
- `keyup` → Tab → State `false`
- `preventDefault()` um Tab-Navigation zu unterdrücken wenn Overlay offen
- Komponente `<ScoreboardOverlay />` in Root Layout

---

## A6 — Space (Zum dringendsten Item springen)

```
Space  →  Springt zur Seite + Item mit höchster Priorität / nächster Deadline
```

**Prioritäts-Logik:**
1. Prüfung in < 7 Tagen → /university
2. Interview heute/morgen → /career
3. Überfälliger Task → /today
4. Goal mit Deadline heute → /goals
5. Fallback: /today, erstes Item

**Implementation:**
- `/api/dashboard/today` erweitern um "most urgent item"
- Space-Handler navigiert + setzt initiales J/K-Focus auf das Item

---

## A7 — Ping-System (G + Richtung)

**Prinzip:** G halten → Ping-Menü erscheint auf fokussiertem Item. Key loslassen → Ping ausführen.

```
G (halten) →  Ping-Ring erscheint
  + G      →  🔴 "Critical!" — Als dringend markieren
  + V      →  🟡 "In Progress" — Status zu in_progress
  + E      →  🔵 "Snoozed" — Zurückstellen auf morgen
  + F      →  🟢 "Done" — Schnell als erledigt markieren
```

**Visuelles Feedback:**
- Ping-Icon erscheint kurz animiert auf dem Item (wie LoL Map-Ping)
- Farbe entspricht dem Ping-Typ
- Verschwindet nach 1.5s

**Implementation:**
- `keydown G` → setzt `isPinging = true`
- Zweiter `keydown` innerhalb 1s → führt Aktion aus
- API-Call zur entsprechenden Mutation
- Ping-Animation via Framer Motion

---

## A8 — Shop / Command Bar (P)

```
P  →  Command Bar öffnen (universelle Fuzzy-Suche)
⌘K →  identisch (bestehender Shortcut bleibt)
```

Command Bar V3 — Suche über alle Entitäten gleichzeitig:
```
[ Prism > _                                    ]

  Goals      "Machine Learning abschließen"     g:
  Kurs       "Analysis II — Blatt 7"            u:
  Bewerbung  "Google — Interview 20.02."        c:
  Task       "Portfolio aktualisieren"          t:
```

**Prefixes:**
- `g:` → nur Goals
- `c:` → nur Career
- `u:` → nur University
- `t:` → nur Tasks
- `>` → nur Aktionen (wie bisher)

---

## A9 — Shortcut Overlay (?)

```
?  →  Cheatsheet aller aktiven Shortcuts
```

**Design:**
```
┌─────────────────────────────────────────────────────┐
│                   PRISM HOTKEYS                      │
├────────────────────┬────────────────────────────────┤
│  NAVIGATION        │  CURRENT PAGE (/goals)          │
│  1-7  Seiten       │  Q   Neues Goal                 │
│  B    → /today     │  W   Progress +1                │
│  J/K  Liste        │  E   Editieren                  │
│  Enter Öffnen      │  R ⚡ Alle Goals heute           │
│                    │                                 │
│  GLOBAL            │  PINGS (G+)                     │
│  P    Command Bar  │  G   🔴 Critical                │
│  Tab  Scoreboard   │  V   🟡 In Progress             │
│  Space Urgent Item │  E   🔵 Snooze                  │
│  D/F  Custom       │  F   🟢 Done                    │
└────────────────────┴────────────────────────────────┘
```

Rechte Spalte zeigt immer die aktuellen Page-Abilities.

---

## Implementierungs-Reihenfolge

### Sprint 1 — Core Navigation (sofort spürbar)
1. `1-7` + `B` Page Navigation
2. `J/K` Listen-Navigation + `▶` Cursor
3. `Enter` / `E` / `Escape` auf fokussierten Items

### Sprint 2 — Abilities + Scoreboard
4. `Q W E R` Context-Abilities (alle 6 Seiten)
5. `Tab` Scoreboard Overlay
6. `?` Shortcut Cheatsheet

### Sprint 3 — Advanced
7. `D/F` Summoner Spells (Settings-Integration)
8. `Space` Dringendstes Item
9. `G+` Ping-System
10. `P` Command Bar V3 mit Fuzzy-Suche

---

## Technische Grundlagen

### Global Key Listener (Root Layout)
```typescript
// hooks/useGlobalHotkeys.ts
// Registriert alle globalen Shortcuts
// Prüft ob Input fokussiert → deaktiviert wenn ja
// Delegiert an: usePageNavigation, useAbilities, useScoreboard, usePings
```

### Keyboard Context
```typescript
// Aktiver Zustand:
{
  activePage: 'goals' | 'today' | ...,
  focusedItemIndex: number,
  isPinging: boolean,
  isScoreboardOpen: boolean,
  keyboardModeActive: boolean, // true nach erstem Keypress
}
```

### Input Detection
```typescript
// Shortcuts NICHT auslösen wenn:
const isInputFocused = () => {
  const tag = document.activeElement?.tagName
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag ?? '')
    || document.activeElement?.getAttribute('contenteditable') === 'true'
}
```

---

## Design-Prinzipien

1. **Kein Modifier** — Single keys wo möglich. Kein `Ctrl+Shift+X`.
2. **Kontextsensitiv** — Gleiche Keys, andere Aktionen. Wie LoL Abilities.
3. **Sofortiges Feedback** — Jede Aktion hat visuelles Feedback (< 100ms).
4. **Graceful Fallback** — Maus funktioniert weiterhin 100%.
5. **Muscle Memory First** — Positions sind konsistent, nie überraschend.
6. **Terminal-Ästhetik** — `▶` Cursor, monospace Elemente, Grid-Layouts.

---

*Phase 4 — Started: Februar 2026*
