# Lucian Speech Bubble Duo-Plan

Stand: 2026-02-23
Status: Ready + Implementation in progress
Scope: Dashboard Lucian Companion

## Ziel
Lucian soll nicht mehr als "Text-Card" erscheinen, sondern als hochwertige, echte Sprechblase direkt ueber dem Companion-Character.

## UX-Ziele
- Bubble ist klar als Sprechblase erkennbar (Tail/Pointer auf Lucian)
- Bubble bleibt an Lucian geankert bei Scroll/Resize
- Look: premium clean + dark anime, aber dezent genug fuer Daily-Usage
- Keine Regression bei Interaktionslogik (Dismiss, Pause-on-hover, Break-CTA)

## Technische Leitlinien
1. Reuse statt Rewrite
- Bestehende Anchor-Logik in `components/features/lucian/LucianBubble.tsx` bleibt Basis.
- Provider-Flow (`components/providers/LucianBubbleProvider.tsx`) bleibt unveraendert.

2. Visuelles Redesign in einer Komponente
- Umbau nur in `LucianBubble.tsx`.
- Keine API-Aenderung der Props.

3. Stabilitaet
- Weiterhin viewport-clamping.
- Tail-Offset sauber clampen, damit Tail nicht an den Rand rutscht.
- Reduced-motion respektieren.

## Design-Spezifikation (v1)
- Form: Rounded speech balloon (`rounded-[26px]`) mit subtiler Rim-Light.
- Tail: echte dreieckige Pointer-Geometrie (oben/unten je nach Position).
- Header: Lucian-Mood-Chip + Mute-Button.
- Body: zentraler Message-Text, darunter Spell-Label.
- CTA (falls vorhanden): klarer Action-Button fuer Break Invite.
- Mood-Codierung:
  - motivate: cyan/blue
  - celebrate: amber/gold
  - warning: red
  - recovery: teal
  - idle: neutral

## Implementierungsschritte
1. `LucianBubble.tsx`:
- Entfernen des internen Sprite-Panels in der Bubble.
- Ersetzen durch reine Speech-Bubble-UI.
- Tail-Rendermodell auf SVG/clip-path Dreieck umstellen.
- Header/Body/CTA visuell neu staffeln (mehr Lesbarkeit, weniger Box-Look).

2. Positioning:
- Anchor-Recompute bei `resize` + `scroll` + sanftem Polling.
- TailOffset clamp: nicht unter 30px, nicht ueber width-30.

3. QA:
- Typecheck und Lint.
- Smoke im Dashboard:
  - Message erscheint ueber Lucian
  - Tail zeigt auf Lucian
  - Break-CTA klickbar
  - Hover pausiert Dismiss-Timer

## Definition of Done
- Lucian-Bubble ist als hochwertige Sprechblase ueber Lucian sichtbar.
- Bubble bleibt sauber geankert und reagiert auf Scroll/Resize.
- Keine Regression in `LucianBubbleProvider`-Flows.
- `npm run type-check` und `npm run lint` sind gruen.

## Nicht im Scope (dieser Schritt)
- Neue Gameplay-Mechaniken
- Provider-State-Modell umbauen
- Asset-Pipeline-Aenderung fuer neue Sprites
