# PHASE 8 — Duo Marketing Site (Codex + Claude)

## Vision
Eine High-Quality Public Website vor dem Login, die Prism klar positioniert und Besucher in Registrierungen konvertiert.
Referenzniveau: moderne SaaS-Seiten wie `prisma.market` / `mixedbread.com`.

## Visual Direction (verbindlich)
- Primäre Brand-Richtung: **Schwarz / Rot / Gold**
- Stil: dark-first, premium, clean, high-contrast, keine generische SaaS-Lila-Optik
- Lila nur als sekundärer Akzent (sparsam), nicht als Hauptfarbe

### Core Palette
- `Background`: #0A0A0A
- `Surface`: #171717
- `Surface Hover`: #262626
- `Primary Red`: #EF4444
- `Primary Red Hover`: #DC2626
- `Gold Accent`: #EAB308
- `Gold Accent Hover`: #CA8A04
- `Text Primary`: #FAF0E6
- `Text Secondary`: #D4D4D8

### Usage Rules
- Haupt-CTA: Rot
- Premium/Highlight/Badges: Gold
- Flächen/Struktur: Schwarz- und Anthrazitstufen
- Keine farblich konkurrierenden Hero-Gradients
- Marketing und App müssen dieselben Tokens sprechen (ein Produktbild)

## Business Outcome
- Visitor versteht in <10 Sekunden: Was ist Prism? Für wen? Warum besser?
- Primäre Conversion: `Get Started` (Signup)
- Sekundäre Conversion: `Login` (bestehende Nutzer)

## Scope
- Public Seiten:
  - `/` (Landing)
  - `/features`
  - `/pricing`
  - `/about`
  - `/privacy`
  - `/terms`
- Auth bleibt separat:
  - `/auth/login`
  - `/auth/signup`

## Information Architecture
1. Hero (Value Proposition + Primary CTA)
2. Product Proof (Screenshots/Flows/Use-cases)
3. Feature Blocks (Today, University, Goals, Career, Analytics)
4. Social Proof / Trust Section
5. Pricing Section (Free/Pro, auch ohne live Billing möglich)
6. FAQ
7. Footer (Legal + Contact)

## Duo Split

### Claude owns (Design + Story)
- Visual direction, typographic hierarchy, copywriting
- Hero, feature storytelling, CTA language
- Motion polish (meaningful transitions, staged reveal)
- Responsive aesthetics (mobile-first premium)

### Codex owns (Engineering + Conversion Infrastructure)
- Public/protected routing boundaries
- SEO metadata, OpenGraph, sitemap, robots
- Performance hardening (image strategy, lazy-loading, bundle hygiene)
- Analytics events and conversion tracking hooks
- Accessibility and regression checks

## File Boundaries

### Claude zone
- `app/(marketing)/**` or `app/(public)/**` UI pages
- `components/features/marketing/**`
- Marketing copy docs

### Codex zone
- `app/layout.tsx` (if required for metadata structure)
- `middleware.ts` route guards
- `lib/analytics/**`
- `lib/seo/**`
- `public/**` optimization conventions
- test + CI coverage for critical routes

## Technical Requirements
- Public pages must never require auth
- App pages must remain protected
- Clean handoff between landing CTA and signup flow
- Structured metadata per page (`title`, `description`, OG)
- No blocking third-party runtime scripts on first paint

## Conversion Events (minimum)
- `landing_cta_primary_clicked`
- `landing_cta_secondary_clicked`
- `pricing_plan_selected`
- `signup_started`
- `signup_completed`

## Performance Budget
- LCP target: < 2.5s (mobile good network)
- Avoid heavy above-the-fold JS
- Use optimized images, no oversized hero assets
- Avoid external blocking font/API dependencies at build time

## Accessibility Baseline
- Keyboard navigable navbar + CTA
- Focus-visible states on all interactive elements
- Contrast-compliant text and buttons
- Proper heading hierarchy (single H1 per page)

## 5-Step Execution Plan

### Step 1 — Foundation
- Create marketing route group
- Add shared marketing layout + navbar/footer
- Define design tokens and section primitives

### Step 2 — Landing Core
- Build premium hero + product proof + CTA
- Add feature teaser cards and quick demo strip

### Step 3 — Supporting Pages
- Implement `/features`, `/pricing`, `/about`
- Add `/privacy` + `/terms` content pages

### Step 4 — Growth Layer
- Wire analytics events and CTA tracking
- Add SEO metadata, OG images, sitemap/robots

### Step 5 — Release Hardening
- Lighthouse pass
- Cross-device responsive QA
- Fix regressions + finalize launch checklist

## Definition of Done
- Public site is visually premium and production-stable
- Core CTA funnel works end-to-end (`/` -> `/auth/signup`)
- SEO metadata and OG previews are present
- Performance and accessibility checks pass baseline
- No protected route leakage to unauthenticated users

## Review Checklist (Duo)
- Is the value proposition immediately clear?
- Are CTAs obvious and correctly routed?
- Does mobile feel as polished as desktop?
- Are event names consistent and queryable?
- Is page speed still strong after visual polish?

## Out of Scope (Phase 8)
- Full billing implementation (Stripe checkout/webhooks)
- Complex CMS integration
- Multi-language localization

## Next Phase Preview (Phase 9)
- Billing activation (Free/Pro enforcement)
- Trial lifecycle and subscription settings
- Revenue dashboard and funnel analytics

## Execution Status (current)
- `Step 1 — Foundation`: done
- `Step 2 — Landing Core`: done
- `Step 3 — Supporting Pages`: done
- `Step 4 — Growth Layer`: done
- `Step 5 — Release Hardening`: done

### Delivered in this phase
- Marketing route group with public landing + supporting pages
- Black/Red/Gold visual direction implemented for marketing surface
- SEO essentials shipped: metadata structure, sitemap, robots
- CTA analytics plumbing shipped (`landing_cta_*`, `pricing_plan_selected`)
- QA pass clean: `npm run build`, `npm run type-check`, `npm run lint`

### Lighthouse Results (2026-02-18)
- Route `/` (desktop): Performance `91`, Accessibility `96`, Best Practices `96`, SEO `100`
- Route `/` (mobile): Performance `89`, Accessibility `96`, Best Practices `96`, SEO `100`
- Route `/features` (desktop): Performance `100`, Accessibility `95`, Best Practices `96`, SEO `100`
- Route `/features` (mobile): Performance `93`, Accessibility `96`, Best Practices `96`, SEO `100`
- Route `/pricing` (desktop): Performance `100`, Accessibility `96`, Best Practices `96`, SEO `100`
- Route `/pricing` (mobile): Performance `94`, Accessibility `96`, Best Practices `96`, SEO `100`

### Cross-Device QA (2026-02-18)
- Public routes respond with `200`: `/`, `/features`, `/pricing`, `/about`, `/privacy`, `/terms`, `/auth/login`, `/auth/signup`
- Protected routes redirect unauthenticated users to login: `/today`, `/calendar`, `/goals`, `/university`, `/career`, `/analytics`, `/settings`, `/onboarding`
- Responsive snapshots captured for `/`, `/features`, `/pricing` at:
  - Desktop (`1440x900`)
  - Mobile (`390x844`)
  - Tablet (`834x1194`)
- Screenshot artifacts generated locally in `.tmp/qa/`
