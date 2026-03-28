---
name: innis-design-system
description: INNIS Design System — Farben, Komponenten-Patterns, Layout-Regeln
globs:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
  - "app/globals.css"
---

# INNIS Design System

## Farbpalette

### Base Colors
- **Background**: `#08080c` (near-black, warm)
- **Surface**: `card-surface` CSS Klasse (alle Widgets)
- **Text Primary**: `text-white` / `text-[#FAF0E6]`
- **Text Secondary**: `text-zinc-400` / `text-zinc-500`
- **Text Tertiary**: `text-zinc-600`

### Brand Colors
- **Gold** (Primary): `#E8B930` — Akzente, Highlights, Gradient-Start
- **Gold Light**: `#F5D565` — Gradient-Mitte
- **Red** (Alert/Action): `#DC3232` / `#e54d42` — CTAs, Warnungen, At-Risk
- **Red Hover**: `#f06455`
- **Emerald**: `emerald-500` — On-Track Status

### Status Colors
| Status | Dot/Text | Background |
|--------|----------|------------|
| on_track | `emerald-400/500` | `emerald-500/30` |
| tight | `#E8B930` | `#E8B930/30` |
| at_risk | `red-400/500` | `red-500/30` |

## Komponenten-Patterns

### Card Surface
```tsx
// Immer card-surface Klasse verwenden, nie bg-surface/65
<div className="card-surface rounded-xl p-5">
```

### Premium CTA Buttons
```tsx
// Primary — Gold/Red mit Glow
<button className="premium-cta-primary">
// Secondary — Ghost
<button className="premium-cta-secondary">
```

### Premium Grid Background
```tsx
// Für Marketing/Auth Seiten
<div className="premium-grid-bg">
```

### RailChip (Status Badges)
5 Töne + Pulse-Dot für Live-Status

### CommandBar Pattern
Horizontaler Strip: `StatChip + GlowSep + ActionSection`, ~56px Höhe

## Layout-Regeln
- Mobile-First: `sm:` / `md:` / `lg:` Breakpoints
- Max-Width Container: `max-w-7xl mx-auto px-6`
- Marketing Container: `marketing-container` Klasse
- Spacing: Tailwind Standard (4, 6, 8, 10, 12, 16, 20)

## Animation-Regeln
<important>
Nur GPU-composited Properties animieren:
- `opacity` — OK
- `transform` (translate, scale, rotate) — OK
- `blur()` — VERBOTEN (GPU-Killer)
- `boxShadow` Animation — VERBOTEN
- `filter` Animation — VERBOTEN
- CSS-only Backgrounds (radial-gradient, linear-gradient) — OK (zero per-frame cost)
</important>

## Typography
- Headlines: `premium-heading` Klasse + `font-semibold`
- Kicker: `text-[11px] uppercase tracking-[0.35em] text-zinc-500`
- Subtext: `premium-subtext` Klasse
- Body: `text-sm` / `text-[13px]` mit `leading-relaxed`

## 4-Color Identity Stripe
Bottom-Line Gradient: red → amber → orange → sky
