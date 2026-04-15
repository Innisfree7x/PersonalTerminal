# Marketing Components

## Design Direction
- Base: `#08080c` (warm near-black)
- Gold: `#E8B930` / `#F5D565` (gradient)
- Red: `#DC3232` (alerts, CTAs)
- Grid: `.premium-grid-bg` CSS class (72px, 4% white opacity)

<important>
## Performance — Zero Blur Architecture
Only animate `opacity` and `transform`. Never:
- CSS `blur()` on animated elements
- `boxShadow` animations
- Canvas with Retina DPR
- SVG `feTurbulence` filters
- `perspective` + `rotateX` 3D transforms

Background effects: static CSS `background-image` only (radial-gradient, linear-gradient) — zero per-frame cost.
</important>

## Key Components
- `CinematicLanding.tsx` — scroll-hijacked PRISMA-style landing, 6 stops, MotionValue-driven
- `CinematicLanding.tsx` — active primary landing experience on `/`
- `CTASection.tsx` — shared CTA block used on `/features` and `/pricing`
- `TerminalFrame.tsx` — browser chrome mockup wrapper
- `mockups/` — TrajectoryMockup, TodayMockup, CareerMockup (framer-motion animated)

## Patterns
- All mockup animations: staggered entry with `delay: 0.2 + i * 0.15`
- CTA buttons: `TrackedCtaLink` with analytics event tracking
- Marketing layout adds `.premium-grid-bg` automatically
