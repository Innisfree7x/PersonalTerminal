> **Status: Archived (Historical).**
> This document is kept for historical traceability and is **not** the active execution source anymore.
> Use docs/PHASE12_MASTERPLAN.md and docs/CONTEXT_CANON.md as canonical context.

# Phase 7 — Mobile PWA

> **Vision:** INNIS ist auf dem iPhone installierbar und fühlt sich wie eine native App an.
> Kein App Store, keine Kosten, Sync mit Desktop ist gratis via Supabase.
> Lucian läuft auch auf dem Handy-Screen rum — kleiner, aber da.

---

## Übersicht

| Feature | Priorität | Status |
|---------|-----------|--------|
| M1 — PWA Setup (manifest + installierbar) | P0 | 🔲 todo |
| M2 — Bottom Tab Bar | P0 | 🔲 todo |
| M3 — Mobile Layout: /today | P0 | 🔲 todo |
| M4 — Mobile Layout: /goals | P0 | 🔲 todo |
| M5 — Floating Quick-Add Button | P1 | 🔲 todo |
| M6 — Lucian auf Mobile (skaliert) | P1 | 🔲 todo |
| M7 — Mobile Layout: /career + /university | P2 | 🔲 todo |
| M8 — Swipe Gestures | P2 | 🔲 todo |
| M9 — Push Notifications (iOS 16.4+) | P2 | 🔲 todo |

---

## M1 — PWA Setup

### Was gebraucht wird

**1. `public/manifest.json`**
```json
{
  "name": "INNIS Terminal",
  "short_name": "INNIS",
  "description": "Personal Productivity Terminal",
  "start_url": "/today",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**2. Meta Tags in `app/layout.tsx`**
```tsx
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="INNIS" />
<meta name="theme-color" content="#0a0a0a" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<link rel="manifest" href="/manifest.json" />
```

**3. App Icons erstellen**
- `icon-192.png` — 192×192px (INNIS Logo / Lucian Icon)
- `icon-512.png` — 512×512px
- `apple-touch-icon.png` — 180×180px (iOS Homescreen)

**Installation auf iPhone:**
```
Safari → innis-url.vercel.app
Teilen ↑ → "Zum Home-Bildschirm hinzufügen"
→ App-Icon erscheint auf dem Homescreen
→ Öffnet fullscreen, kein Browser-UI
```

### Viewport + Safe Areas

```tsx
// app/layout.tsx
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
/* globals.css — iPhone Notch + Home Indicator */
.mobile-bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
.mobile-content {
  padding-top: env(safe-area-inset-top);
}
```

---

## M2 — Bottom Tab Bar

Ersetzt die Desktop-Sidebar auf Mobile. Daumen-freundlich, unten fixiert.

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│         PAGE CONTENT                    │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🏠 Today  🎯 Goals  💼 Career  🎓 Uni │  ← Bottom Tab Bar
└────── safe-area-inset-bottom ───────────┘
```

### Komponente `BottomTabBar.tsx`

```typescript
// Nur auf Mobile sichtbar (< 768px)
// Desktop: normale Sidebar bleibt unverändert

const tabs = [
  { href: '/today',      icon: Home,     label: 'Today'  },
  { href: '/goals',      icon: Target,   label: 'Goals'  },
  { href: '/career',     icon: Briefcase,label: 'Career' },
  { href: '/university', icon: GraduationCap, label: 'Uni' },
]
```

**Visuell:**
- Aktiver Tab: Accent-Farbe + kleiner Dot darunter
- Inaktiv: gedimmte Icons
- Gleiche Icons wie Desktop-Sidebar
- `backdrop-blur` + `bg-background/80` für Glasmorphism-Effekt

### Responsive Breakpoint

```tsx
// Dashboard Layout (app/(dashboard)/layout.tsx)
<>
  {/* Desktop Sidebar — nur ab md */}
  <Sidebar className="hidden md:flex" />

  {/* Mobile Content — volle Breite auf Mobile */}
  <main className="flex-1 md:ml-[sidebar-width]">
    {children}
  </main>

  {/* Mobile Bottom Nav — nur unter md */}
  <BottomTabBar className="flex md:hidden" />
</>
```

---

## M3 — Mobile Layout: /today

Desktop hat 3 Spalten (Focus Tasks | Schedule | Widgets). Auf Mobile: **Single Column, gestapelt**.

### Mobile Reihenfolge (nach Wichtigkeit)

```
┌─────────────────────────┐
│  Guten Morgen, Maido    │  ← Greeting + Datum
│  🔥 7 Tage Streak       │
├─────────────────────────┤
│  QUICK STATS            │  ← Kompakte Stats-Leiste
│  Tasks: 3/8  Focus: 2h  │
├─────────────────────────┤
│  HEUTE'S TASKS          │  ← FocusTasks (Priorität 1)
│  ☐ Analysis Blatt 8     │
│  ☐ Portfolio updaten    │
│  ☐ ...                  │
├─────────────────────────┤
│  SCHEDULE               │  ← Nur wenn Events vorhanden
│  14:00 — Vorlesung      │
├─────────────────────────┤
│  MOOD TRACKER           │  ← Schnell tippbar
├─────────────────────────┤
│  [+ Quick Add Task]     │  ← Floating Button (M5)
└─────────────────────────┘
```

**Was wegfällt auf Mobile:**
- TimeBlockVisualizer (zu komplex für kleinen Screen)
- WeekOverview (zu klein auf Mobile)
- ActivityFeed (nice to have, nicht kritisch)
- CircularProgress (ersetzt durch kompakte Stats)

**Implementierung:**
```tsx
// today/page.tsx
// Responsive mit Tailwind:
<div className="
  grid grid-cols-1           // Mobile: 1 Spalte
  md:grid-cols-[1fr_auto_1fr]  // Desktop: 3 Spalten
  gap-4
">
```

---

## M4 — Mobile Layout: /goals

Desktop: Grid mit 3 Cards pro Reihe. Mobile: **1 Card pro Reihe**, kompakter.

```
┌─────────────────────────┐
│ 🎯 Goals       [+ Add]  │
│ All │ Fitness │ Career  │  ← Scroll-Tabs (kein Dropdown)
├─────────────────────────┤
│ ┌───────────────────┐   │
│ │ Machine Learning  │   │  ← Card: kompakter als Desktop
│ │ Learning  🟡 Mid  │   │     kein Hover-State
│ │ ████████░░  80%   │   │     Tap = öffnet Modal
│ │ 15. März 2026     │   │
│ └───────────────────┘   │
│ ┌───────────────────┐   │
│ │ ...               │   │
└─────────────────────────┘
```

**Touch-Optimierung:**
- Tap auf Card → Modal öffnet (kein hover nötig)
- Delete: Swipe Left auf Card → Löschen-Button erscheint (M8)
- Kein Sort-Dropdown auf Mobile — default Sort bleibt

---

## M5 — Floating Quick-Add Button

Immer sichtbar auf Mobile — schnellste Möglichkeit einen Task hinzuzufügen.

```
┌─────────────────────────┐
│                         │
│    PAGE CONTENT         │
│                         │
│                    [+]  │  ← Floating Action Button (FAB)
├─────────────────────────┤
│  🏠  🎯  💼  🎓        │  ← Bottom Tab Bar
└─────────────────────────┘
```

**Tap auf [+]:**
```
→ Bottom Sheet erscheint (von unten raufgleiten):
  ┌─────────────────────────┐
  │  Was willst du hinzufügen?  │
  │  [📋 Task] [🎯 Goal] [💼 Bewerbung]  │
  │  ________________________  │
  └─────────────────────────┘
```

- Kontextsensitiv: auf /today → öffnet sofort Task-Form
- FAB Position: rechts unten, über Bottom Tab Bar
- Framer Motion: scale(0) → scale(1) beim Erscheinen

---

## M6 — Lucian auf Mobile

Lucian erscheint auch auf Mobile — kleiner skaliert.

### Größe

```
Desktop: ×4 = 192×192px
Mobile:  ×2 = 96×96px   ← halbiert, trotzdem sichtbar
```

### Anpassungen für Mobile

**Movement:**
- Rechtsklick gibt es nicht auf Touch → **Tap auf leere Fläche** = Move Command
- Lucian läuft zum Tap-Punkt
- Tap auf Lucian = Aktiv-Modus (wie Desktop-Klick)

**Aktiv-Modus auf Mobile:**
- Kein Q/W/E/R (keine Tastatur auf Mobile)
- Stattdessen: **Ability Buttons** erscheinen als Touch-Targets um Lucian herum
```
         [Q]
    [W]  🧍  [E]
         [R]
```
- Tap auf Ability-Button = Ability auslösen
- [X] Range Indicator: kleiner Button erscheint

**Passive Reaktionen:** Identisch wie Desktop — Task erledigt → Victory Pose, etc.

---

## M7 — Mobile Layout: /career + /university

Niedrigere Priorität — müssen nutzbar sein, müssen nicht perfekt sein.

**Career:**
- Kanban-Spalten → vertikale Liste pro Status
- Karte: Name + Firma + Status Badge
- Tap = Details-Modal

**University:**
- Kurs-Cards untereinander
- Blätter: Checkbox-Grid bleibt, nur kompakter
- Prüfungs-Countdown gut sichtbar

---

## M8 — Swipe Gestures

```
Goal/Task Card: Swipe Left  → Löschen-Button erscheint (rot)
Goal/Task Card: Swipe Right → Als erledigt markieren (grün)
Seiten:         Swipe Left/Right → Navigation (optional, vorsichtig)
```

**Implementation:** Framer Motion `drag` + `dragConstraints` + `onDragEnd`

---

## M9 — Push Notifications (iOS 16.4+)

Nur wenn App zum Homescreen hinzugefügt wurde (PWA).

**Use Cases:**
```
"Analysis Prüfung in 3 Tagen" → Reminder
"Streak in Gefahr — heute noch nichts erledigt" → Abends um 20:00
"Focus Session abgeschlossen — gut gemacht!" → Nach Timer-Ende
```

**Implementation:** Web Push API + Notification Permission Request beim ersten Start.

---

## Implementierungs-Reihenfolge

### Sprint 1 — Installierbar (< 1 Tag)
1. **M1** PWA manifest + Meta Tags + Icons
2. App ist auf iPhone installierbar

### Sprint 2 — Nutzbar auf Mobile (2-3 Tage)
3. **M2** Bottom Tab Bar
4. **M3** Mobile /today Layout
5. **M4** Mobile /goals Layout

### Sprint 3 — Polish (1-2 Tage)
6. **M5** Floating Quick-Add Button
7. **M6** Lucian auf Mobile (Touch-Movement + Ability Buttons)
8. **M7** Career + University Mobile-fix

### Sprint 4 — Extras
9. **M8** Swipe Gestures
10. **M9** Push Notifications

---

## Technische Entscheidungen

| Entscheidung | Gewählt |
|---|---|
| App-Typ | PWA (kein App Store, kein React Native) |
| Sync | Gratis — gleiche Supabase DB |
| Navigation Mobile | Bottom Tab Bar |
| Priorität Mobile-Pages | /today + /goals (P0), Rest (P2) |
| Lucian auf Mobile | Ja — ×2 Größe, Touch-Move, Ability Buttons |
| Desktop | Bleibt 100% unverändert |
| Breakpoint | `md` (768px) — unter 768px = Mobile Layout |

---

## Wichtig: Desktop bleibt unberührt

Alle Mobile-Änderungen passieren ausschließlich mit Tailwind Responsive Prefixes:
```
hidden md:flex     → auf Mobile versteckt, auf Desktop sichtbar
flex md:hidden     → auf Mobile sichtbar, auf Desktop versteckt
grid-cols-1 md:grid-cols-3  → Mobile 1 Spalte, Desktop 3 Spalten
```

Kein Desktop-Code wird angefasst. Zero Regression-Risiko.

---

*Phase 7 — INNIS in der Hosentasche.*
*Geplant: Februar 2026*
