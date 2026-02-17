# Phase 6 — Terminal Champion (LoL Desktop Pet)

> **Vision:** Lucian lebt als Pixel Art Sprite im Terminal. Er läuft durch den ganzen Screen,
> reagiert auf App-Events, hat echte Abilities die mit dem Terminal interagieren —
> und fühlt sich an wie ein lebendiger Begleiter.

> **Strategie:** Lucian first — alles bauen, testen, perfektionieren.
> Aphelios kommt als Phase 6.1 (nur neues Sprite Sheet, Code bleibt identisch).

---

## Phase 6.0 — Lucian

### Übersicht

| Feature | Priorität | Status |
|---------|-----------|--------|
| C1 — Sprite System + Animation Engine | P0 | ✅ done (lucian sprite-sheet engine + frame-aware face offsets) |
| C2 — Champion Overlay + Movement (Rechtsklick) | P0 | ✅ done |
| C3 — Passive Modus (Idle + Random Walk) | P0 | ✅ done |
| C4 — Aktiv Modus (Click to Select) | P1 | ✅ done |
| C5 — Attack Range Indicator (X) | P1 | ✅ done |
| C6 — Abilities Q / W / E / R | P1 | ✅ done |
| C7 — App-Event Reaktionen | P2 | ✅ done |
| C8 — Terminal-Interaktion (Abilities → Tasks) | P2 | ✅ done |
| C9 — Champion Stats + Level System | P2 | ✅ done |
| C10 — Settings Integration (Toggle, Größe) | P2 | ✅ done |
| C11 — Sounds (8-bit SFX: Abilities, Events, PENTAKILL) | P2 | ✅ done |

---

## Implementierungsstand (Feb 2026)

- Champion runtime live in `components/providers/ChampionProvider.tsx`
- Event bus live in `lib/champion/championEvents.ts`
- Champion config/sprite swap via `lib/champion/config.ts`
- Lucian sprite live in `public/sprites/lucian-sprites.svg` (face details direkt im Sheet)
- Dashboard integration live in `app/(dashboard)/layout.tsx`
- Settings controls live in `app/(dashboard)/settings/page.tsx`
- Interactive targets tagged:
  - Tasks: `components/features/dashboard/FocusTasks.tsx`
  - Goals: `components/features/goals/GoalCard.tsx`
  - Courses: `components/features/university/CourseCard.tsx`
  - Applications: `components/features/career/ApplicationCard.tsx`
- App-event dispatch integriert in:
  - Goals create (`app/(dashboard)/goals/page.tsx`)
  - Task/exercise completion (`components/features/dashboard/FocusTasks.tsx`, `components/features/university/CourseCard.tsx`)
  - Application create (`components/features/career/CareerBoard.tsx`)
  - Focus start/end (`components/providers/FocusTimerProvider.tsx`)
- Combat/feel updates:
  - Lightslinger-Doppelschuss nach Q/W/E/R
  - W als Bolt + Mark (kein Shield-Bubble-Mode)
  - R mit längerer Bullet-Salve
  - PENTAKILL-Streak reset bei Trigger und bei `STREAK_BROKEN`
  - Passive Random Walk: 15-30s

---

## Phase 6.1 — Aphelios (nach Lucian ✅)

> Startet erst wenn Phase 6.0 vollständig funktioniert und sich gut anfühlt.
> Der gesamte Code bleibt unverändert — nur Sprites + Farben sind neu.

| Feature | Priorität | Status |
|---------|-----------|--------|
| A1 — Aphelios Sprite Sheet erstellen (Piskel) | P0 | 🔲 todo |
| A2 — Aphelios in Settings wählbar | P0 | 🔲 todo |
| A3 — Ability-Farben anpassen (Lila/Türkis statt Blau/Weiß) | P1 | 🔲 todo |
| A4 — Ability-Namen anpassen (Phase Bullet, Moonfall, etc.) | P1 | 🔲 todo |

### Aphelios Ability-Mapping (gleiche Keys, andere Namen + Farben)

| Key | Lucian (6.0) | Aphelios (6.1) | Farbe |
|-----|--------------|----------------|-------|
| Q | Piercing Light | Phase Bullet | Silber/Weiß |
| W | Ardent Blaze | Severum Shield | Rosa/Rot |
| E | Relentless Pursuit | Gravitum Dash | Lila |
| R | The Culling | Moonfall | Türkis |

---

## Champion Auswahl

Beide Champions wählbar in Settings. Jeder hat eigene Sprites + Ability-Farben.

| | Lucian | Aphelios |
|-|--------|----------|
| **Waffe** | Dual Pistols | Moonlight Weapons (5 Waffen) |
| **Pixel Art Schwierigkeit** | Einfach — klares Silhouette | Mittel — komplexer Look |
| **Ability-Thema** | Licht / Energie | Mond / Dunkelheit |
| **Q-Farbe** | Hellblau / Weiß | Silber / Lila |
| **R-Farbe** | Goldgelb (The Culling) | Türkis (Moonfall) |
| **Empfehlung** | Erkennbarer, ikonischer | Cooler, einzigartiger |

---

## C1 — Sprite System

### Sprite Sheet Struktur

Jeder Champion hat ein einzelnes PNG Sprite Sheet.
Empfohlene Frame-Größe: **48 × 48 px** pro Frame.

```
lucian-sprites.png (oder aphelios-sprites.png)
┌──────────────────────────────────────────────────┐
│ ROW 0: IDLE        [F1][F2][F3][F4]              │ ← 4 frames, 200ms/frame
│ ROW 1: WALK        [F1][F2][F3][F4][F5][F6]      │ ← 6 frames, 100ms/frame
│ ROW 2: CAST Q      [F1][F2][F3][F4]              │ ← 4 frames, 80ms/frame
│ ROW 3: CAST W      [F1][F2][F3]                  │ ← 3 frames, 100ms/frame
│ ROW 4: CAST E      [F1][F2][F3][F4]              │ ← 4 frames, 80ms/frame (Dash)
│ ROW 5: CAST R      [F1][F2][F3][F4][F5][F6][F7][F8] │ ← 8 frames, 80ms/frame
│ ROW 6: VICTORY     [F1][F2][F3][F4][F5][F6]      │ ← 6 frames, 150ms/frame
│ ROW 7: PANIC       [F1][F2][F3][F4]              │ ← 4 frames, 150ms/frame
│ ROW 8: MEDITATE    [F1][F2][F3][F4]              │ ← 4 frames, 200ms/frame (Focus Mode)
│ ROW 9: RECALL      [F1][F2][F3][F4][F5][F6]      │ ← 6 frames, 150ms/frame
└──────────────────────────────────────────────────┘
```

**Walk Links** = Walk Rechts gespiegelt via CSS `transform: scaleX(-1)` — kein extra Row nötig.

### Wo die Sprites herkommen

**Status (Feb 2026):** Kein fertiges animiertes Sprite Sheet für Lucian oder Aphelios
auf itch.io, Spriters Resource oder DeviantArt verfügbar. Muss selbst erstellt werden.

**Option A (Empfohlen):** Midjourney als Referenz + **Piskel** nachpixeln:
- Midjourney Prompt: `"Lucian League of Legends pixel art 32x32 idle sprite, dark armor, dual pistols, RPG style, transparent background"`
- Als visuelle Vorlage, dann Frame für Frame in Piskel (piskelapp.com) nachzeichnen
- Lucian: ~2-3h für alle Rows
- Aphelios: ~3-4h für alle Rows

**Option B:** Generic "Gunner Champion" selbst designen:
- Eigener Pixel-Art-Charakter inspiriert von Lucian/Aphelios
- Kein Copyright-Risiko, mehr kreative Freiheit
- Gleiche Sprite-Sheet-Struktur, identische Implementation

---

## C2 — Champion Overlay + Movement

### Overlay Architektur

```
Root Layout
└── ChampionProvider (Context: position, mode, animation, level, stats)
    └── ChampionOverlay (fixed, full screen, z-index: 9998)
        ├── ChampionSprite (pointer-events: auto — clickable)
        ├── SelectionCircle (unter dem Champ, sichtbar im Aktiv-Modus)
        ├── RangeIndicator (X-Key, semi-transparent Kreis)
        ├── AbilityEffects (Q/W/E/R Visual Effects Canvas)
        └── LevelBadge (kleine Zahl über dem Champ)
```

Der Overlay selbst hat `pointer-events: none` — nur der Champ selbst ist klickbar. Kein App-Content wird blockiert.

### Movement System

```typescript
interface ChampionState {
  position: { x: number; y: number }        // aktuelle Position (px)
  targetPosition: { x: number; y: number }  // Zielposition
  direction: 'left' | 'right'               // für Sprite-Flip
  animation: ChampionAnimation              // aktuelle Animation Row
  mode: 'passive' | 'active'               // Passiv vs. Aktiv
  isMoving: boolean
  champion: 'lucian' | 'aphelios'
  renderScale: 4                            // ×4 = 192×192px (fest)
  level: number
  xp: number
}

// localStorage: nur bei Movement-End (lagfrei)
// Key: 'champion-position' → { x: number, y: number }
// Beim Start: gespeicherte Position laden, Fallback: { x: 100, y: windowHeight - 200 }
```

**Bewegung — Rechtsklick (LoL Standard):**
- **Rechtsklick** irgendwo auf Screen → Champion läuft dahin (wie in LoL)
- `contextmenu` Event → `preventDefault()` im Aktiv-Modus → kein Browser-Kontextmenü
- Im Passiv-Modus (nicht selected): Rechtsklick funktioniert normal
- Champion läuft über **den ganzen Screen** — kein Bereich ist gesperrt
- `requestAnimationFrame` bewegt Champion smooth zur Zielposition
- Geschwindigkeit: 200px/s (wie LoL Move Speed)
- Bei Ankommen: Walk → Idle Animation
- Move-Command Cursor erscheint kurz am Zielort (grüner Pfeil, wie in LoL)

**Framer Motion für smooth Interpolation:**
```typescript
<motion.div
  animate={{ x: position.x, y: position.y }}
  transition={{ type: 'linear', duration: distanceToTarget / 200 }}
>
  <ChampionSprite />
</motion.div>
```

**Richtungs-Flip:**
```typescript
// Champion schaut in Bewegungsrichtung
const facingLeft = targetPosition.x < position.x
<div style={{ transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)' }}>
```

---

## C2.5 — Hotkey Isolation (Phase 4 vs Phase 6)

> **KRITISCH:** Phase 4 (App Hotkeys) und Phase 6 (Champion Abilities) benutzen dieselben
> Keys (Q/W/E/R). Diese MÜSSEN sauber getrennt sein — niemals gleichzeitig aktiv.

### Die zwei Modi

```
APP MODE (Standard)                    CHAMPION MODE (nach Klick auf Lucian)
─────────────────────────────────────  ─────────────────────────────────────
Phase 4 Hotkeys AKTIV:                 Phase 4 Hotkeys KOMPLETT DEAKTIVIERT:
  1-7  → Seitenwechsel                   1-7  → nichts
  B    → /today                          B    → nichts
  Q    → Neues Item                      Q    → Piercing Light (Ability)
  W    → Progress/Status                 W    → Ardent Blaze (Ability)
  E    → Editieren                       E    → Dash (Ability)
  R    → Page Ultimate                   R    → The Culling (Ability)
  J/K  → Listen-Navigation               J/K  → nichts
  Tab  → Scoreboard                      Tab  → nichts
  G+   → Ping System                     X    → Range Indicator
  P    → Command Bar                     Rechtsklick → Move Command
                                         ESC  → zurück zu APP MODE
Champion läuft passiv rum               Champion ist selected + steuerbar
```

### Mode-Switch Regeln

```
APP MODE → CHAMPION MODE:   Linksklick auf Lucian
CHAMPION MODE → APP MODE:   ESC  ← einziger Exit (bewusste Entscheidung)
Beide Modi deaktiviert:     wenn Input / Textarea / Modal fokussiert ist
```

### Implementation — Globaler Hotkey Handler

```typescript
// hooks/useGlobalHotkeys.ts
// EINZIGE Stelle wo Hotkeys registriert werden — für beide Phasen

const handleKeyDown = (e: KeyboardEvent) => {
  // 1. Immer zuerst: kein Hotkey wenn Input fokussiert
  if (isInputFocused()) return

  // 2. Champion Mode hat volle Priorität — Phase 4 wird nicht erreicht
  if (isChampionMode) {
    handleChampionHotkey(e)  // Q/W/E/R → Abilities, X → Range, ESC → deselect
    e.preventDefault()
    return                   // ← STOP. Phase 4 keys werden nicht ausgeführt.
  }

  // 3. App Mode: Phase 4 Hotkeys normal
  handleAppHotkey(e)         // 1-7, QWER, B, Tab, G+, P, J/K, etc.
}

document.addEventListener('keydown', handleKeyDown)
```

### Visuelles Feedback — Immer klar welcher Modus aktiv ist

```
APP MODE:      Normale UI — kein extra Indikator (ist der default)

CHAMPION MODE: ┌─────────────────────────────────────────┐
               │  ⚔  CHAMPION MODE  —  ESC zum Beenden  │  ← Banner oben Mitte
               └─────────────────────────────────────────┘
               + Blauer Selection Circle unter Lucian pulsiert
               + Ability HUD erscheint (Q/W/E/R Icons unten)
               + Subtiler blauer Screen-Rand Glow
```

### Konflikte — vollständige Tabelle

| Key | APP MODE (Phase 4) | CHAMPION MODE (Phase 6) | Konflikt? |
|-----|--------------------|------------------------|-----------|
| Q | Neues Item erstellen | Piercing Light | ✅ gelöst durch Mode |
| W | Progress/Status | Ardent Blaze | ✅ gelöst durch Mode |
| E | Item editieren | Dash | ✅ gelöst durch Mode |
| R | Page Ultimate | The Culling | ✅ gelöst durch Mode |
| X | — | Range Indicator | ✅ kein Konflikt |
| ESC | Modal schließen | Champion deselect | ⚠️ ESC prüft zuerst ob Modal offen |
| 1-7 | Seitenwechsel | deaktiviert | ✅ gelöst durch Mode |
| Rechtsklick | Browser-Kontextmenü | Move Command | ✅ `preventDefault()` nur im Champion Mode |
| J/K | Listen-Navigation | deaktiviert | ✅ gelöst durch Mode |
| Tab | Scoreboard | deaktiviert | ✅ gelöst durch Mode |

### ESC Edge Case

ESC wird an zwei Stellen gebraucht:
```typescript
// Priorität: Modal > Champion Mode > nichts
const handleEsc = () => {
  if (isModalOpen)      { closeModal(); return }       // 1. Modal schließen
  if (isChampionMode)   { exitChampionMode(); return } // 2. Champion deselect
  // sonst: nichts
}
```

---

## C3 — Passiv Modus

Standard-Verhalten ohne User-Interaktion:

**Idle Behavior:**
- Champion steht idle (Row 0 Animation läuft in Loop)
- Alle 15-30 Sekunden: zufällige Position auf dem Screen wählen → hinlaufen → wieder idle
- Bewegungsbereich: ganzer Screen, aber bevorzugt untere 30% (weniger aufdringlich)

**Passive Reaktionen auf App-Events** (automatisch, kein User-Input nötig):

| App-Event | Champion-Reaktion | Animation |
|-----------|-------------------|-----------|
| Task erledigt | kurze Victory-Pose | ROW 6 (1x) |
| 5 Tasks heute | **PENTAKILL** Effekt | ROW 6 (3x) + Partikel |
| Neues Goal erstellt | kurzes Nicken | ROW 0 spezial Frame |
| Deadline < 24h | Panic-Animation, läuft schneller | ROW 7 |
| Focus Session gestartet | Setzt sich hin, meditiert | ROW 8 Loop |
| Focus Session beendet | Aufstehen, strecken | ROW 8 → ROW 0 |
| Level Up | Recall-Animation + Glow | ROW 9 |
| Streak gebrochen | kurze "Dead"-Pose | ROW 9 variant |
| Seite gewechselt | Kurzes Teleport-Blinken | CSS flash effect |

---

## C4 — Aktiv Modus (Click to Select)

```
Klick auf Champion
  → SelectionCircle erscheint (blauer Ring unter Champ, pulsierend)
  → App-Hotkeys (1-7, QWER etc.) DEAKTIVIERT
  → Champion-Controls AKTIV
  → Kleines HUD erscheint (Ability Icons Q/W/E/R mit Cooldown)

ESC  ← einziger Exit
  → Deselect
  → App-Hotkeys wieder aktiv
```

**Aktiv-Modus Controls:**
```
Rechtsklick       →  Move Command (grüner Cursor kurz sichtbar)
X + Linksklick    →  Attack-Move Style Move Command
Q                 →  Ability 1
W                 →  Ability 2
E                 →  Dash (direkt zur Mausposition)
R                 →  Ultimate
X (halten)        →  Range Indicator
ESC               →  Deselect → App Modus
```

**Ability HUD (unten, nur im Aktiv-Modus sichtbar):**
```
┌──────────────────────────────────────────┐
│  [Q] Piercing Light  [W] Ardent Blaze    │
│  [E] Dash            [R] The Culling     │
│  Cooldowns als Overlay auf Icons         │
└──────────────────────────────────────────┘
```

---

## C5 — Attack Range Indicator (X)

```
X halten →  Semi-transparenter Kreis um den Champion
            Radius: 300px (konfigurierbar)
            Farbe: Champion-spezifisch (Lucian: blau-weiß, Aphelios: lila-türkis)

            Alle interaktiven App-Elemente IN diesem Radius:
            → bekommen ein subtiles Glow-Highlight
            → Tasks, Goals, Kurs-Cards, Bewerbungskarten

X loslassen →  Kreis faded out (0.2s)
               Highlights verschwinden
```

**Visuell:**
```
         ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
                    [Task: Analysis]✨
         │        [Goal: Fitness]✨        │
                      🧍 LUCIAN
         │         [Task: Portfolio]✨     │

         └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Implementation:**
- Alle `[data-interactive]` Elemente auf der aktuellen Seite sammeln
- `getBoundingClientRect()` für jedes Element
- Distanz zum Champion berechnen
- `< range` → `data-in-range="true"` setzen → CSS Glow via Attribut-Selektor

---

## C6 — Abilities

### Q — Piercing Light (Lucian) / Phase Bullet (Aphelios)

**Effekt:** Heller Strahl schießt vom Champion in Richtung Mauszeiger über den Screen.

```
Ablauf:
1. Q drücken → Cast-Animation (ROW 2)
2. Strahl-Projectile fliegt von Champ-Position zur Mausrichtung (400ms, 1000px/s)
3. Jedes `[data-interactive]` Element das der Strahl kreuzt:
   → Task: wird für 3 Sek. als "targeted" highlighted (goldener Border)
   → Notification: "Lucian hat deinen Task ins Visier genommen!" (optional lustig)
4. Cooldown: 8 Sekunden
```

**Visual:** CSS-animierter `div` mit `background: linear-gradient(...)`, rotiert in Mausrichtung, `scaleX` Animation von 0 → 1.

---

### W — Ardent Blaze (Lucian) / Severum (Aphelios)

**Effekt:** Lucian feuert einen Ardent-Blaze-Schuss mit Zielmarkierung.

```
Ablauf:
1. W drücken → Cast-Animation (ROW 3)
2. Bolt fliegt in Mausrichtung
3. Stern/Mark-Effekt am Trefferpunkt (kurzer Fade-Out)
4. Kein globales UI-Dimming (nicht Lucian-getreu, bewusst entfernt)
5. Cooldown: 15 Sekunden
```

---

### E — Relentless Pursuit (Lucian) / Gravitum (Aphelios)

**Effekt:** Champion dasht sofort zur Mausposition.

```
Ablauf:
1. E drücken → kurze Dash-Animation (ROW 4, sehr schnell 80ms/frame)
2. Champion teleportiert mit Framer Motion (duration: 0.15s, easeOut)
3. Trail-Effekt: 3-4 Ghost-Kopien des Champions fade aus entlang des Dash-Pfads
4. Cooldown: 5 Sekunden (kürzester Cooldown — wie in LoL)
```

---

### R — The Culling (Lucian) / Moonfall (Aphelios)

**Effekt:** Das Ultimate. Abhängig von heutiger Performance.

**Standard R:**
```
1. R drücken → R-Animation (ROW 5, längste Animation)
2. Lucian: Feuert Salve von Projektilen in alle Richtungen
   Aphelios: Moonlight-Kreise expandieren vom Champion
3. Alle sichtbaren Tasks auf der Seite kurz blinken / highlighten
4. Cooldown: 60 Sekunden
5. Aktuell: längere Salve (~30 Projektile über ~2.8s)
```

**PENTAKILL R (wenn 5+ Tasks heute erledigt):**
```
1. R drücken → PENTAKILL check ✅
2. Dramatische Camera-Shake Animation (CSS transform)
3. "P E N T A K I L L" Text erscheint groß in der Mitte (goldfarben, fade out)
4. Konfetti-Regen (canvas-confetti)
5. Alle Tasks heute: kurze Victory-Glow Animation
6. Champion macht extended Victory-Pose (ROW 6, 3x)
```

---

## C7 — App-Event System

### Event Bus

```typescript
// lib/champion/championEvents.ts
type ChampionEvent =
  | { type: 'TASK_COMPLETED'; taskTitle: string }
  | { type: 'PENTAKILL'; count: number }
  | { type: 'GOAL_CREATED' }
  | { type: 'DEADLINE_WARNING'; hoursLeft: number }
  | { type: 'FOCUS_START' }
  | { type: 'FOCUS_END' }
  | { type: 'LEVEL_UP'; newLevel: number }
  | { type: 'STREAK_BROKEN' }
  | { type: 'PAGE_CHANGE'; page: string }

// Anywhere in the app:
dispatchChampionEvent({ type: 'TASK_COMPLETED', taskTitle: 'Analysis Blatt 7' })
```

### Integration in bestehende Mutations

```typescript
// In jeder Mutation onSuccess:
onSuccess: () => {
  queryClient.invalidateQueries(...)
  toast.success('Task erledigt!')
  dispatchChampionEvent({ type: 'TASK_COMPLETED', taskTitle: task.title }) // ← neu
}
```

---

## C8 — Terminal Interaktion

### data-interactive Attribut System

Alle interaktiven Elemente im App kriegen ein Attribut:

```typescript
// Task-Item:
<div data-interactive="task" data-item-id={task.id} data-item-title={task.title}>

// Goal-Card:
<div data-interactive="goal" data-item-id={goal.id}>

// Course-Card:
<div data-interactive="course" data-item-id={course.id}>

// Application-Card:
<div data-interactive="application" data-item-id={app.id}>
```

### Ability-Interaktion mit Elementen

```typescript
// Range Indicator: Elemente in Reichweite finden
const getElementsInRange = (championPos: Position, range: number) => {
  const elements = document.querySelectorAll('[data-interactive]')
  return Array.from(elements).filter(el => {
    const rect = el.getBoundingClientRect()
    const elCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    const distance = Math.hypot(elCenter.x - championPos.x, elCenter.y - championPos.y)
    return distance <= range
  })
}

// Q Skillshot: Elemente die der Strahl kreuzt
const getElementsOnPath = (start: Position, direction: Angle, length: number) => {
  // Linien-Intersektions-Check mit jedem [data-interactive] Bounding Box
}
```

---

## C9 — Champion Stats + Level System

Verknüpft mit Phase 5 Gamification (falls implementiert), sonst standalone.

### XP Quellen

| Aktion | XP |
|--------|----|
| Task erledigt | +10 XP |
| Goal Progress +1 | +25 XP |
| Focus Session (25 Min.) | +50 XP |
| Übungs-Blatt abgehakt | +15 XP |
| Bewerbung gesendet | +30 XP |
| Streak-Tag | +20 XP |

### Level Kurve

```
Level  1: 0 XP        "Summoner's Rift Rookie"
Level  5: 500 XP      "Bronze Carry"
Level 10: 1500 XP     "Silver Mechanics"
Level 20: 5000 XP     "Gold Efficiency"
Level 30: 15000 XP    "Diamond Grind"
Level 50: 50000 XP    "Challenger Mindset"
```

### Level-Effekte auf Champion

| Level | Unlock |
|-------|--------|
| 1-9 | Basic Sprite, normale Abilities |
| 10 | Ability-Effekte größer / intensiver |
| 20 | Champion bekommt Glow-Aura (permanenter CSS filter) |
| 30 | PENTAKILL Effekt hat extra Partikel |
| 50 | Champion-Skin (alternatives Sprite, z.B. "High Noon Lucian") |

### Level Badge

Kleines Badge über dem Champ-Kopf:
```
  [30]
   🧍
```
Farbe entspricht Rang (Bronze/Silber/Gold/Platin/Diamant/Challenger).

---

## C10 — Settings Integration

Neuer Bereich in `/settings`:

```
TERMINAL CHAMPION
─────────────────────────────────────────
Champion aktiviert         [Toggle ON/OFF]
Champion auswählen         [Lucian ▾] [Aphelios]
Render-Größe               ×4 = 192px (fest)
Passives Verhalten         [Aktiv ●] [Idle only]
App-Event Reaktionen       [Alle ●] [Keine]
Range Indicator Radius     [────●────────] 300px
Cooldowns anzeigen         [Toggle ON/OFF]
Lautstärke SFX             [────●────────] 20%
Mute                       [Toggle ON/OFF]
─────────────────────────────────────────
Champion-Stats
  Level: 12  |  XP: 1840 / 2000
  ████████████████░░░░  92%
```

---

## Implementierungs-Reihenfolge

### Sprint 1 — Foundation (Champ erscheint + bewegt sich)
1. **C1** Sprite System bauen (CSS background-position Animation) — Generic Gunner Fallback
2. **C2** ChampionOverlay + Passive Bewegung (Rechtsklick + Idle Loop)
3. **C2.5** Globaler Hotkey Handler — Phase 4 / Phase 6 Isolation
4. **C10** Settings: Toggle + Champion-Auswahl

### Sprint 2 — Interaktivität
4. **C4** Aktiv-Modus (Click to Select, Selection Circle, HUD)
5. **C5** Range Indicator (X-Key)
6. **C3** Passive App-Event Reaktionen (Task erledigt → Victory)

### Sprint 3 — Abilities + Terminal-Interaktion
7. **C6** Q / E Abilities (Skillshot + Dash)
8. **C8** data-interactive System + Range Detection
9. **C6** W / R Abilities (Shield + Ultimate + PENTAKILL)

### Sprint 4 — Polish
10. **C7** vollständiger Event Bus in alle Mutations
11. **C9** Level System + XP
12. Sounds — authentische 8-bit SFX für alle Abilities

---

## Technischer Stack

| Komponente | Technologie |
|------------|-------------|
| Sprite Animation | CSS `background-position` Steps |
| Champion Movement | Framer Motion `animate` |
| Ability Effects | CSS Animations + Canvas (R Ultimate) |
| Konfetti (PENTAKILL) | `canvas-confetti` npm package |
| Event Bus | Custom EventEmitter / Zustand store |
| Range Detection | `getBoundingClientRect()` + Distanzberechnung |
| State | `ChampionProvider` (React Context) |
| Persistence | `localStorage` (Position, Level, XP) |

---

## Asset Checkliste

### Lucian Sprite Sheet (lucian-sprites.png)
- [x] Idle (4 frames)
- [x] Walk (6 frames)
- [x] Cast Q — Piercing Light (4 frames)
- [x] Cast W — Ardent Blaze (3 frames)
- [x] Cast E — Dash (4 frames)
- [x] Cast R — The Culling (8 frames)
- [x] Victory Pose (6 frames)
- [x] Panic (4 frames)
- [x] Meditate/Focus (4 frames)
- [x] Recall (6 frames)
- [x] Face details direkt im Sprite (frame-aware offsets)

### Aphelios Sprite Sheet (aphelios-sprites.png)
- [ ] Identische Rows wie Lucian
- [ ] Anderes Farbschema (Lila/Türkis statt Blau/Weiß)

### Ability Effects (CSS/Canvas)
- [x] Q Strahl (gradient div)
- [x] W Bolt + Mark (Ardent Blaze Look, kein Bubble-Shield)
- [x] E Trail (ghost copies)
- [x] R Projectile Salve (multiple dots)
- [x] PENTAKILL Text (bold, gold)
- [x] Move Command Cursor (grüner Pfeil)
- [x] Selection Circle (blauer Ring)

---

## C11 — Sounds (8-bit SFX)

Authentische, LoL-getreue 8-bit Versionen der originalen Sounds.

| Event | Sound | Beschreibung |
|-------|-------|--------------|
| Move Command | *pew* click | Kurzes Click-Sound beim Rechtsklick |
| Q — Piercing Light | *whoosh + zap* | Laser-Strahl Abfeuer-Sound |
| W — Ardent Blaze | *shimmer* | Bolt/Mark Trigger-Sound |
| E — Dash | *swoosh* | Schneller Dash-Whoosh |
| R — The Culling | *rapid fire* | Schnelle Schuss-Salve |
| PENTAKILL | *fanfare* | 8-bit Triumph-Fanfare |
| Victory Pose | *ta-da* | Kurze Sieger-Melodie |
| Panic | *uh oh* | Alarmierender Ton |
| Level Up | *chime* | Aufstieg-Jingle |
| Focus Start (W) | *zen tone* | Tiefer, ruhiger Ton |

**Implementation:**
- Web Audio API oder simple `<audio>` Tags
- Sounds als `.mp3` / `.ogg` in `public/sounds/champion/`
- Lautstärke: niedrig (20% default), einstellbar in Settings
- Mute-Toggle in Settings vorhanden

**Wo die Sounds herkommen:**
- 8-bit SFX Generator: **sfxr.me** (kostenlos, im Browser, perfekt für Retro-Sounds)
- Oder: **freesound.org** nach "8bit laser", "8bit whoosh", "8bit fanfare" suchen
- Jeder Sound < 0.5 Sekunden — kurz und crisp

---

## Finale Entscheidungen (alle offen Fragen geklärt)

| Entscheidung | Gewählt |
|--------------|---------|
| Champion-Auswahl | Lucian first (Phase 6.0) → Aphelios (Phase 6.1) |
| Bewegungszone | Ganzer Screen — kein Bereich gesperrt |
| Bewegungs-Steuerung | **Rechtsklick** (LoL Standard) |
| App-Event Reaktionen | Alle Events — Victory, Panic, PENTAKILL, Focus |
| Ability-Interaktion | Ja — Tasks/Goals werden highlighted |
| Sounds | Ja — authentische 8-bit SFX via sfxr.me |
| Sprites | Lucian sheet live (`public/sprites/lucian-sprites.svg`), Aphelios folgt in 6.1 |
| Render-Größe | **×4** → 192×192px (präsent aber nicht overwhelming) |
| Quick-Hide Key | Nicht geplant (nur Settings-Toggle) |
| Position nach Refresh | localStorage — nur bei Movement-End speichern (lagfrei) |

---

*Phase 6.0 — Lucian first. Alles bauen, perfektionieren.*
*Phase 6.1 — Aphelios: nur neue Sprites, Code identisch.*
*Kein Productivity Tool auf der Welt hat das.*

*Geplant: Februar 2026*
