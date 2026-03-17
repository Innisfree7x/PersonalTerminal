# Lucian Sprite V2 Upgrade

Stand: 2026-03-17
Status: Implementiert

## Ziel

Lucian Companion Sprite von generischem Pixel-Character zu erkennbarem Chibi-Lucian (League of Legends) upgraden. Cuter, mehr Charakter, mehr Detail durch größere Frames.

## Implementierter Stand

- `public/sprites/lucian-sprites-v2.svg` ist live und wird produktiv verwendet.
- `LucianSpriteAnimator.tsx` nutzt V2-Sheet mit `64x64` Frame-Logik.
- `LucianBubble.tsx` rendert den Sprite in `72px` innerhalb eines `96px` Panels.
- `lib/champion/config.ts` zeigt Lucian ebenfalls auf das V2-Sheet.
- Settings-Label ist auf `Lucian (Chibi Sprite V2)` aktualisiert.
- Unit-Test deckt Sheet-Pfad, Default-Size und Config-Wire-up ab.

Offene Folgearbeiten gehoeren nicht mehr zu diesem Upgrade:
- spaetere Attack-/Dance-/Hurt-Rows fuer Minigame/Spell-Systeme

## Aktueller Stand (V1)

```
Datei:       public/sprites/lucian-sprites.svg (384×480px)
Frame-Größe: 48×48px
Grid:        8 Spalten × 10 Reihen
Bubble-Size: 52px (im LucianBubble)
Panel-Breite: 72px
```

**Probleme:**
- Zu generisch, kein Wiedererkennungswert
- Keine Waffen, kein Mantel, keine Lucian-Features
- 48×48 zu klein für Details
- Animationen zu simpel (kein Cape, keine Partikel)

## Zieldesign (V2)

### Charakter-Features
- **Stil:** Chibi (3-Kopf-Proportionen, großer Kopf, kleiner Körper)
- **Referenz:** League of Legends Lucian, TFT Chibi-Stil
- **Dual Pistols:** sichtbar in idle/victory/panic, holstered bei walk
- **Weißer Mantel/Cape:** flattert bei walk, ruht bei idle
- **Glowing Eyes:** Cyan (default), Amber (celebrate), Red (warning)
- **Haarschnitt:** kurz, markant, erkennbar
- **Palette:** Dark Fantasy, passt zu INNIS Dark Theme (#0d1119 Background)

### Technische Specs

```
Datei:       public/sprites/lucian-sprites-v2.svg (oder .png)
Frame-Größe: 64×64px
Grid:        8 Spalten × 10 Reihen
Gesamtgröße: 512×640px
Format:      SVG bevorzugt (scharf bei jeder Größe), PNG akzeptabel
Stil:        Pixelated, kein Anti-Aliasing, keine Subpixel
```

### Animation Rows

| Row | Animation | Frames | Dauer/Frame | Beschreibung |
|-----|-----------|--------|-------------|--------------|
| 0 | idle | 4 | 200ms | Entspannt, wippt Pistole in einer Hand |
| 1 | walk | 6 | 100ms | Cape flattert, Pistolen holstered, Entry-Animation |
| 2 | — | — | — | Reserviert |
| 3 | — | — | — | Reserviert |
| 4 | — | — | — | Reserviert |
| 5 | — | — | — | Reserviert |
| 6 | victory | 6 | 150ms | Schießt in die Luft, kleine Partikel/Muzzle Flash |
| 7 | panic | 4 | 150ms | Hektisch, Pistolen gezückt, Blick hin und her |
| 8 | meditate | 4 | 200ms | Pistolen abgelegt, Arme verschränkt, ruhig |
| 9 | — | — | — | Reserviert |

**Reservierte Rows** (für spätere Erweiterungen):
- Row 2: attack (Schuss-Animation für Drill-Game)
- Row 3: dance (Easter Egg nach Pentakill)
- Row 4: hurt (bei Streak-Broken)
- Row 5: special (saisonale Variante)

## Umsetzung

### Phase 1: Konzept (Verantwortlich: User)

AI-generierte Konzepte erstellen mit Midjourney, DALL-E, oder Stable Diffusion.

**Empfohlener Prompt:**
```
chibi pixel art spritesheet, 64x64 grid, League of Legends Lucian character,
dual pistols, white coat cape, glowing cyan eyes, cute 3-head-proportion chibi,
transparent background, 8-bit retro pixel style, dark fantasy color palette,
5 animation rows: idle stance with gun, walk cycle with flowing cape,
victory shooting guns in air with muzzle flash, panic stressed looking around,
meditation arms crossed guns on ground,
clean grid layout, no anti-aliasing, sharp pixels, game asset style
```

**Varianten generieren:**
- 3-4 Konzepte, verschiedene Proportionen
- Favorit auswählen basierend auf: Erkennbarkeit, Cuteness, Lesbarkeit bei 64-72px

### Phase 2: Spritesheet (Verantwortlich: User)

**Tools:**
- [Aseprite](https://www.aseprite.org/) (empfohlen, 20€) — professioneller Pixel-Art Editor
- [Piskel](https://www.piskelapp.com/) (kostenlos, browserbasiert) — für schnelle Iterationen
- [Lospec](https://lospec.com/palette-list) — Paletten-Referenz

**Workflow:**
1. Konzept als Referenzbild laden
2. 64×64 Canvas, 8×10 Grid erstellen
3. Idle-Animation zuerst (Basis-Pose)
4. Basis-Pose für alle Animationen kopieren und variieren
5. Jede Animation Frame-für-Frame durchspielen (Onion Skinning nutzen)
6. Export als PNG mit Transparenz, dann optional SVG-Konvertierung

**Palette-Empfehlung (max 16 Farben):**
```
Haut:    #D4A574, #B8865E (hell/schatten)
Mantel:  #E8E8E8, #C0C0C0, #888888 (weiß/grau Stufen)
Haare:   #2A2A2A, #1A1A1A (dunkel)
Pistolen: #4A4A4A, #333333 (metallic)
Eyes:    #22D3EE (cyan glow), #F59E0B (amber), #EF4444 (red)
Outline: #111111
Muzzle:  #FFD700, #FF8C00 (flash)
```

**Alternative: Fiverr Commission**
- Suche: "chibi pixel art spritesheet"
- Budget: 30-60€
- Briefing: dieses Dokument + LoL Lucian Referenzbilder mitschicken
- Lieferzeit: 3-7 Tage

### Phase 3: Code Integration (Verantwortlich: Codex)

**Dateien die geändert werden:**

#### 1. `components/features/lucian/LucianSpriteAnimator.tsx`
```diff
- const FRAME_SIZE = 48;
+ const FRAME_SIZE = 64;

- const DEFAULT_SIZE = 64;
+ const DEFAULT_SIZE = 72;

- backgroundImage: url('/sprites/lucian-sprites.svg')
+ backgroundImage: url('/sprites/lucian-sprites-v2.svg')
```

#### 2. `components/features/lucian/LucianBubble.tsx`
```diff
Sprite Panel:
- w-[72px] (Panel-Breite)
+ w-[96px]

LucianSpriteAnimator size prop:
- size={52}
+ size={72}

Bubble max-width (optional, testen):
- min(380px, calc(100vw - 40px))
+ min(420px, calc(100vw - 40px))
```

#### 3. Keine Änderungen an:
- `LucianBubbleProvider.tsx` (Logik bleibt gleich)
- `lib/lucian/copy.ts` (Messages bleiben gleich)
- `lib/lucian/hints.ts` (Kontext-Logik bleibt gleich)
- `lib/lucian/game/targetDrill.ts` (Drill-Logik bleibt gleich)
- Animation names, frame counts, durations — alles bleibt identisch

### Constraints für Code-Änderung
- Kein Layout-Breaking auf Mobile (<768px)
- `imageRendering: 'pixelated'` muss bleiben (kein Smoothing)
- `prefers-reduced-motion` muss weiterhin funktionieren
- Bubble darf nicht über Viewport-Rand ragen (Anchor-Logik prüfen)
- Alle existierenden Tests müssen grün bleiben (`npm run test:unit`)

## Akzeptanzkriterien

- [x] Neues Spritesheet unter `public/sprites/lucian-sprites-v2.svg`
- [x] Lucian erkennbar als Chibi-Lucian (Pistolen, Mantel, Haare)
- [x] Alle 5 Animationen laufen sauber (idle, walk, victory, panic, meditate)
- [x] Bubble-Layout passt mit größerem Sprite (kein Overflow, kein Clipping)
- [x] Mobile (<768px): Bubble bleibt nutzbar
- [x] 315 Unit Tests grün
- [x] TypeScript check clean
- [x] Visuell reviewed im Browser (alle Moods durchklicken)

## Browser-Review

- Reproduzierbare Preview-Route: `/showcase/lucian`
- Mood-Wechsel ueber Query-Param: `/showcase/lucian?mood=celebrate&action=1`
- Review-Screenshots lokal erzeugt unter `.tmp/lucian-review/`
- Fix aus Review: `LucianBubble` unterstuetzt jetzt optionalen `anchorSelector`, damit Showcase- und produktive Bubble deterministisch an den richtigen Anchor binden

## Timeline

| Phase | Aufwand | Abhängigkeit |
|-------|---------|--------------|
| Konzept | 30 min | — |
| Spritesheet | 2-3h (selbst) oder 3-7 Tage (Fiverr) | Konzept fertig |
| Code Integration | 15-30 min | Spritesheet fertig |
| Visual Review | 15 min | Code fertig |
