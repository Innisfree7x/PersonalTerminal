# Lucian Companion Redesign Plan

Stand: 2026-02-23  
Status: Draft v1 (umsetzungsbereit)  
Owner: Product + Engineering

---

## 1) Zielbild

Lucian soll sich wie ein eigener Character im Produkt anfühlen:
- **Look:** Mix aus premium clean + dark anime (cool, hochwertig, nicht kitschig)
- **Rolle:** Motivator + spielbarer Companion für kurze Pausen
- **UX:** Sprechblase direkt über Lucian statt separater Floating-Card
- **Effekte:** sichtbar hochwertiger als heute, aber kontrolliert (mittel-intensiv)
- **Audio:** dezent, optional, nie nervig

---

## 2) Experience Pillars

1. **Presence**
- Lucian ist als Character klar lesbar, auch ohne Text.
- Visuelle Qualität kommt über Licht, Rhythmus, Motion und klare Silhouette.

2. **Motivation**
- Kontext-Hints bleiben datengetrieben (Tasks, Exams, Focus, Applications).
- Sprache bleibt direkt, nicht generisch.

3. **Playability**
- Bei Inaktivität kann man in einen kurzen Micro-Loop wechseln (60-90 Sekunden).
- Minigame ist optional, schnell, keine harte Lernkurve.

4. **Non-intrusive**
- Keine aggressive Unterbrechung.
- Cooldowns, Session-Limits und einfache Dismiss-Regeln bleiben.

---

## 3) V1 Scope (konkret)

### V1.1 Visual Redesign (Companion + Bubble)
- Bubble wird als **Sprechblase über dem Character** gerendert (mit Tail).
- Character-Frame bekommt klaren „hero“ Look:
  - Soft aura, mood-tinted rim light, subtle breathing motion.
  - Header + text in clean typography, weniger „boxy card“-Gefühl.
- Mood-System bleibt funktional gleich, wird visuell stärker codiert:
  - motivate = cyan/blue
  - celebrate = gold
  - warning = crimson
  - recovery = violet
  - idle = neutral silver

### V1.2 Spell/VFX Upgrade (medium)
- Q/W/E/R-Effekte bleiben mechanisch gleich, aber mit konsistenterem Art-Style.
- Verbesserungen:
  - sauberere Layer-Hierarchie (foreground/background flashes)
  - einheitliche Glow-Intensität und Fade-Curves
  - ult-cinematic bleibt kurz und kontrolliert (kein Fullscreen-Spam)

### V1.3 Playable Pause Mode (neu)
- Neuer „Break Activity“-Entrypoint bei Pause/Inaktivität:
  - Trigger nach definierter Idle-Zeit (siehe offene Fragen unten).
  - CTA in Sprechblase: „2-min Challenge starten“.
- **Minigame V1: Lucian Target Drill**
  - 60-90 Sekunden Session.
  - Kleine Targets/orbs erscheinen im Viewport.
  - Click/Tap trifft, Combo + Score steigen.
  - Miss reduziert Combo.
  - Abschluss mit kurzer Lucian-Reaktion (celebrate/recovery) + Score Summary.
- Wichtig: rein lokal im Client, kein Backend-Zwang für V1.

---

## 4) Technischer Zielzustand

### Bestehende Kernfiles (werden erweitert)
- `components/providers/LucianBubbleProvider.tsx`
- `components/features/lucian/LucianBubble.tsx`
- `components/features/lucian/LucianSpriteAnimator.tsx`
- `components/providers/ChampionProvider.tsx`
- `lib/lucian/copy.ts`

### Neue Files (V1)
- `components/features/lucian/LucianCompanionShell.tsx`
  - Kapselt Character, aura, speech-bubble anchor, layering.
- `components/features/lucian/LucianSpeechBubble.tsx`
  - Neue Bubble-UI inkl. Tail + CTA/Action area.
- `components/features/lucian/LucianBreakOverlay.tsx`
  - Minigame HUD/Overlay.
- `lib/lucian/game/targetDrill.ts`
  - Spawn-/Score-/Combo-Logik als testbare pure functions.
- `tests/unit/lucian-target-drill.test.ts`
  - Unit-Tests für game rules.
- `public/sprites/lucian-v2-sprites.png` (oder .webp/.svg, je nach Asset-Pipeline)
- `public/sfx/lucian/*.mp3` (dezent, optional)

---

## 5) Architektur-Plan

### 5.1 Render-Architektur
- `LucianBubbleProvider` steuert nur State/Trigger/Cooldowns.
- `LucianCompanionShell` rendert:
  - Sprite
  - Speech bubble (über Anchor)
  - optional Break Overlay
- `ChampionProvider` bleibt Owner für Q/W/E/R input + combat VFX.

### 5.2 State Model (neu)
- Ergänzung um UI/Game-States:
  - `companionMode: 'ambient' | 'speaking' | 'break-invite' | 'break-active'`
  - `breakStats: { score, combo, hits, misses, durationMs }`
- Game-Loop getrennt von Messaging-Queue.

### 5.3 Event Flow
- Existing events bleiben:
  - TASK_COMPLETED, FOCUS_END, DEADLINE_WARNING, etc.
- Neue lokale Events:
  - `LUCIAN_BREAK_INVITE`
  - `LUCIAN_BREAK_START`
  - `LUCIAN_BREAK_END`

---

## 6) Visual Direction Spec (Premium x Dark Anime)

### Farbregeln
- Basissurface: tiefes Graphite/Navy, sehr wenig Sättigung.
- Akzentfarben nur für Mood/Spells.
- Max 1 dominanter Akzent pro Zustand.

### Motionregeln
- Entry-Motion: 180-260ms, ease-out.
- Aura-Pulse: langsam (2-3s), keine hektischen Loops.
- Spell-Impacts: kurz, knackig, schnell ausblenden.

### Typografie
- UI-Text clean und gut lesbar.
- Character/Spell-Label darf leicht stylized sein, aber sparsam.

---

## 7) Milestones & Aufwand

### M1 — Design Tokens + Shell (0.5-1 Tag)
- Speech-bubble-anchor über Lucian
- neue Layerstruktur und Design-Token
- keine Gameplay-Änderung

### M2 — Companion Visuals + Bubble Redesign (1-1.5 Tage)
- neue Bubble UI + Tail
- Mood-Varianten, hochwertige States
- CTA-Slot für Break Mode

### M3 — Spell FX Polish (0.5-1 Tag)
- VFX Harmonisierung Q/W/E/R
- Audio hooks dezent integrieren

### M4 — Break Activity V1 (1-1.5 Tage)
- Target Drill Minigame
- invite flow + score summary
- lokale Persistenz (best score optional)

### M5 — QA/Hardening (0.5-1 Tag)
- type-check/lint/tests
- Unit Tests für Game-Logik
- E2E smoke für Break-Start/Ende (wenn creds verfügbar)

Gesamt V1: **~3.5 bis 6 Tage**

---

## 8) Definition of Done (V1)

- Lucian erscheint in neuem visuellen Stil mit Speech Bubble über dem Character.
- Mood-basierte Darstellung ist klar unterscheidbar.
- Break Mode ist spielbar (start, run, end) und stabil.
- Keine Regression in bestehenden Lucian-Hints/Champion-Controls.
- `npm run type-check`, `npm run lint`, `npm run test -- --run` sind grün.

---

## 9) Risiken + Mitigation

1. **Zu viel Visuelles Rauschen**
- Mitigation: feste Intensitätsgrenzen + reduced motion support.

2. **Minigame fühlt sich disconnected an**
- Mitigation: Lucian-Voice/Copy + mood reaction direkt an Score koppeln.

3. **Scope drift durch zu viele Ideen**
- Mitigation: harte V1-Scope-Grenze (nur 1 Minigame, keine Backend-Abhängigkeit).

4. **Asset-Qualität inkonsistent**
- Mitigation: zuerst Style-Guide + einheitliche Palette/Glow-Profile definieren.

---

## 10) Entscheidungen, die noch von dir fehlen

1. **Break Trigger-Schwelle:** nach wie vielen Minuten Pause soll Lucian den Play-Invite zeigen?  
Vorschlag: `7 Minuten`.

2. **Minigame Dauer:** lieber `60s` oder `90s` pro Runde?  
Vorschlag: `60s` (schneller Loop).

3. **Belohnung V1:** nur visuell (Score + Lucian-Reaction) oder schon XP fürs Companion-System?  
Vorschlag: nur visuell in V1, XP erst V2.

4. **Tone der Play-Voicelines:** eher „cool/edgy“ oder „warm/pushend“?  
Vorschlag: 70% cool/edgy + 30% warm/pushend.

5. **Assetquelle:** Soll ich V1 mit schnell integrierbaren temporären Assets starten und danach finale Art austauschen?  
Vorschlag: ja, damit wir schnell iterieren.

---

## 11) Next Step nach Freigabe

Nach deinen Antworten setze ich sofort um:
1. `M1` + `M2` (neue Shell + Speech Bubble)
2. dann `M4` (Break Activity V1)
3. danach kompletter Audit + Commit + Push

