# PHASE 8.1 — Appearance Upgrade (Premium Visual Pass)

## Ziel
Die bestehende Marketing-Site von "gut" auf "high-end" heben: mehr visuelle Tiefe, klarere Hierarchie, hochwertigere Oberflächen, konsistenter Markencharakter.

## Leitlinien
- Dark-first Schwarz/Rot/Gold bleibt die Kernidentität.
- Weniger "normale SaaS-Karte", mehr Premium-Atmosphäre (Depth, Light, Contrast).
- CTA-Hierarchie bleibt maximal klar: `Get Started` dominiert.
- Motion bleibt subtil und intentional (kein Effekt-Overload).

## Pass 1 (umgesetzt)
- Marketing-Layout:
  - zusätzliche Overlays für `vignette` und `spotlight` eingebaut.
  - dadurch mehr Fokus im oberen Hero-Bereich und bessere Blickführung.
- Global Styles:
  - neue Premium-Utilities für wiederverwendbare visuelle Patterns:
    - `premium-kicker`
    - `premium-chip`
    - `premium-cta-primary`
    - `premium-cta-secondary`
  - neue Atmosphären-Layer:
    - `marketing-vignette`
    - `marketing-spotlight` (subtile breathing animation)
- Hero:
  - CTA-Klassen vereinheitlicht.
  - zusätzliche Trust-Chips (`No credit card`, `2 min Setup`, `Built for students`).
  - Badge/Glow und spacing poliert.
- Features:
  - Kicker-Klasse vereinheitlicht.
  - stärkere Hover-Tiefe (subtiler Lift + ambient highlight).
- Pricing/FAQ:
  - Kicker-Typografie vereinheitlicht.
- CTA-Sektion:
  - CTA-Stile auf globale Premium-CTA-Klassen vereinheitlicht.

## QA (Pass 1)
- `npm run type-check` ✅
- `npm run lint` ✅

## Nächster Pass (8.1.2 Vorschlag)
- Hero-Wordmark/Typografie-Feintuning (custom display font eval, fallback-safe).
- Product proof erweitern:
  - 2. Mockup-Variante (mobile frame + desktop frame)
  - kurze "workflow before/after" strip.
- Micro-interactions:
  - section reveal choreography vereinheitlichen.
  - refined hover-timing (curves + duration tokens).
- Trust layer:
  - "Built with Supabase / Next.js / Vercel" credibility rail.
