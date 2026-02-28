# /today Bento Redesign — Design Contract

Status: Active
Date: 2026-03-01
Owner: Design Lead
Consumers: UI Agent, QA Agent, Core
Scope: /today page — Layout + Visual System

---

## Vision

Kein generisches SaaS-Dashboard. Ein System das sich anfühlt als wäre es speziell für dich gebaut.
/today ist der erste Canvas — Änderungen propagieren danach auf /analytics und /university.

---

## Die 5 Prinzipien

### 1. Bento statt gleiches Grid
Wichtiges bekommt mehr Raum. Tasks dominieren links (tall), Schedule in der Mitte (tall), Timer und Study kompakt rechts, Deadlines + WeekOverview unten als breite Streifen.

### 2. Eine Farbe = eine Domäne, konsequent
Rot = Tasks, Amber = Uni, Orange = Focus/Streak, Sky = Career.
Bereits im CommandBar drin — jetzt überall. Sättigung per Theme gedeckelt, Kontrast AA-konform (siehe Accessibility).

### 3. Eine Zahl pro Card, der Rest flüstert
Strikte 3-Ebenen-Typografie (siehe Token-System). Keine vierte Ebene. Kein zweites "mittelgroßes" Element das das Prinzip verwässert.

### 4. Motion die Information trägt
Keine dauerhaften Puls-Loops. Eine ruhige Background-Animation nur im Focus-View. Alle anderen Animationen: einmalig, ≤300ms. Vollständige `prefers-reduced-motion`-Unterstützung (siehe Motion-System).

### 5. Weniger Borders, mehr Tiefe
Nur primäre/interaktive Cards behalten `border border-border`. Sekundäre Cards existieren durch Hintergrundkontrast.

---

## Typografie-Token-System

Statt einer harten Verbotsliste: drei semantische Klassen die im gesamten /today-Redesign verbindlich sind.
UI-Agent verwendet ausschließlich diese Klassen für Zahlen, Titel und Meta-Texte.

| Token | Tailwind-Klassen | Zweck |
|-------|-----------------|-------|
| `type-hero` | `text-4xl font-black tabular-nums leading-none` | Eine dominante Zahl pro Card |
| `type-title` | `text-sm font-semibold text-text-primary leading-tight` | Card-Titel, einmal pro Card |
| `type-meta` | `text-xs font-normal text-text-tertiary/60 leading-snug` | Alles andere: Labels, Subtexte, Einheiten |

**Regeln:**
- Pro Card: genau ein `type-hero`, genau ein `type-title`, beliebig viele `type-meta`.
- Kein freies `text-lg`, `text-xl`, `text-2xl`, `font-bold` außerhalb dieser Tokens.
- `type-hero` trägt immer die Domain-Color des Widgets (z.B. `text-red-300` für Tasks).
- Auf iPad (`md:`): `type-hero` reduziert auf `text-3xl` — in den Breakpoint-Styles explizit setzen.

---

## Motion-System

**Grundregel:** Maximal eine dauerhaft laufende Animation pro Viewport. Alle anderen einmalig und ≤300ms.

### prefers-reduced-motion (verpflichtend)

Jede Framer Motion Animation muss `useReducedMotion()` respektieren:

```tsx
const prefersReducedMotion = useReducedMotion();

// Beispiel-Pattern:
<motion.div
  animate={prefersReducedMotion ? {} : { scale: [1, 1.05, 1] }}
  transition={{ duration: 0.25 }}
/>
```

Bei `prefers-reduced-motion: reduce`:
- Alle Entry-Animationen: `opacity 0→1` only, kein Y-Offset, kein Scale.
- Task-Completion: kein Halo-Ring — nur Checkbox-State-Change.
- Background-Animation (/focus): vollständig deaktiviert.

### Erlaubte Animationen

| Event | Animation | Dauer | Loop | reduced-motion |
|-------|-----------|-------|------|----------------|
| Card entry | `opacity 0→1, y -6→0` | 200ms | nein | `opacity` only |
| Task completed | Checkbox `scale(1.05→1)` + grüner Halo-Ring | 250ms | nein | kein Halo, kein Scale |
| Timer abgelaufen | Ring-Flash + kurzer Moment | 300ms | nein | kein Flash |
| Focus Background | Eine ruhige ambient Bewegung | — | ja (nur /focus) | deaktiviert |

**Gestrichen:** Streak-Puls-Loop, Timer-Tick-Scale-Loop — zu viel parallele Bewegung.

---

## Accessibility-Regeln

### Icon-only Zone (QuickActionsWidget)
Jeder Button ohne sichtbaren Text muss:
1. `aria-label="[Aktion]"` haben — eindeutig und handlungsbeschreibend (z.B. `"Neue Aufgabe"`, nicht `"Plus"`).
2. Einen Tooltip (`title` oder custom Tooltip-Komponente) zeigen bei Hover und bei `:focus-visible`.
3. Einen sichtbaren Focus-Ring haben: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1`.
4. Keyboard-navigierbar sein (Tab-Reihenfolge logisch, kein `tabIndex=-1` ohne Grund).

```tsx
// Pflicht-Pattern für Icon-Buttons in QuickActionsWidget:
<button
  aria-label="Neue Aufgabe erstellen"
  title="Neue Aufgabe (N)"
  className="... focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
>
  <PlusIcon className="h-4 w-4" aria-hidden="true" />
</button>
```

### Farbkontrast
- Alle `type-hero` und `type-title` Texte: WCAG AA (≥4.5:1) in allen 6 Themes.
- Domain-Colors: maximale Sättigung `300`-Variante (z.B. `text-red-300`, nicht `text-red-400`) auf Dark Themes.
- Progressbars und Stripes: rein dekorativ, kein Kontrast-Requirement, aber `aria-hidden="true"`.

### Semantik
- Card-Titel (`type-title`) als `<h3>` oder mit `role="heading" aria-level="3"`.
- Interaktive Cards haben `role="region"` mit `aria-label`.
- Scrollbare Bereiche: `tabIndex={0}` damit Keyboard-User scrollen können.

---

## Per-Widget Design Spec

### FocusTasks
**Primärziel:** Task-Completion ohne Navigation weg von /today ermöglichen — in einem Klick.
- `min-height: 420px` / `max-height: 640px`
- `overflow-y: auto` mit subtilem Scrollbar-Fade
- Domain: **Rot** — `text-red-300` (hero), `bg-red-500/8` (background tint), `bg-red-400/40` (linke 2px Stripe)
- Hero: `X` completed Tasks als `type-hero text-red-300`

### ScheduleColumn
**Primärziel:** Heutige Zeitblöcke auf einen Blick — ohne Kalender-Navigation.
- `min-height: 420px` / `max-height: 640px`
- `overflow-y: auto` — aktuelle Zeit immer im sichtbaren Bereich on mount
- Domain: **Neutral** — primary accent für Current-Time-Indicator, kein Domain-Color
- Hero: aktuelle/nächste Veranstaltung als `type-title`, Uhrzeit als `type-hero text-primary`

### PomodoroTimer
**Primärziel:** Focus-Session in einem Klick starten mit sofort sichtbarer Restzeit.
- `min-height: 180px` / `max-height: 210px`
- `overflow: hidden` — fixed Layout, kein Scroll
- Domain: **Orange** — `text-orange-300` (hero timer), `border-orange-400/40` (Ring)
- Hero: `MM:SS` Countdown als `type-hero text-orange-300`

### StudyProgress
**Primärziel:** Dringlichsten Kursfortschritt auf einen Blick — sortiert nach Prüfungsnähe.
- `min-height: 180px` / `max-height: 210px`
- `overflow-y: auto` wenn >2 Kurse
- Domain: **Amber** — `text-amber-300` (hero %), `bg-amber-400/60` (Progressbar)
- Hero: `XX%` pro Kurs als `type-hero text-amber-300`
- Kein Border — `bg-surface/30` als Hintergrund

### UpcomingDeadlines
**Primärziel:** Anstehende Deadlines domänenübergreifend in einer kompakten Liste.
- `min-height: 140px` / `max-height: 200px`
- `overflow-y: auto`
- Domain: **Gemischt per Typ** — Tasks red, Exams amber, Goals orange, Interviews sky
- Hero: Tage-Zahl (`Xd`) als `type-hero` in jeweiliger Domain-Color
- Kein Border — `bg-surface/30`

### WeekOverview
**Primärziel:** Wöchentliche Orientierung ohne Interaktion — rein visueller Kontext.
- `min-height: 140px` / `max-height: 200px`
- `overflow: hidden` — statische Visualisierung, kein Scroll
- Domain: **Alle Domänen** — mini Color-Dots pro Typ als Legende
- Kein Hero (kein Zahlenfokus) — `type-title` als einzige Hierarchie
- Kein Border — `bg-surface/20`

### QuickActionsWidget (Secondary Zone)
**Primärziel:** Häufige Aktionen als Shortcut — ohne Cmd+K öffnen zu müssen.
- `min-height: 140px` / `max-height: 200px`
- `overflow: hidden`
- Domain: **Neutral** — primary auf Hover/Focus
- Kein Titel (`type-title` entfällt) — nur Icon-Buttons mit `aria-label` + Tooltip
- Kein Border — visuell minimal, kein Gewicht

---

## Layout

### Desktop (≥1024px) — 12-col Bento

```
┌─────────────────────────────────────────────────────┐
│  CommandBar (col-span-12)                           │
├──────────────────┬───────────────┬──────────────────┤
│                  │               │  PomodoroTimer   │
│  FocusTasks      │  Schedule     │  col-span-3      │
│  col-span-5      │  col-span-4   ├──────────────────┤
│  row-span-2      │  row-span-2   │  StudyProgress   │
│                  │               │  col-span-3      │
├──────────────────┴───────────────┴──────────────────┤
│  UpcomingDeadlines   │  WeekOverview  │ QuickActions │
│  col-span-5          │  col-span-4    │ col-span-3   │
└──────────────────────┴────────────────┴─────────────┘
```

### iPad (768px–1023px) — 8-col, explizit designed

```
┌───────────────────────────────────┐
│  CommandBar (col-span-8)          │
├─────────────────┬─────────────────┤
│  FocusTasks     │  PomodoroTimer  │
│  col-span-5     │  col-span-3     │
│  min-h-[360px]  ├─────────────────┤
│                 │  StudyProgress  │
│                 │  col-span-3     │
├─────────────────┴─────────────────┤
│  ScheduleColumn (col-span-8)      │
├─────────────────┬─────────────────┤
│  Deadlines      │  WeekOverview + │
│  col-span-4     │  QuickActions   │
│                 │  col-span-4     │
└─────────────────┴─────────────────┘
```

Touch-Targets auf iPad: alle interaktiven Elemente `min-h-[44px] min-w-[44px]`.

### Mobile (<768px)
Single column, Cards linear gestapelt in Prioritätsreihenfolge:
CommandBar → FocusTasks → PomodoroTimer → StudyProgress → ScheduleColumn → Deadlines → WeekOverview → QuickActions

---

## Visual Acceptance Criteria

QA prüft jeden Breakpoint gegen diese Kriterien. Screenshots als Baseline vor Merge.

### Desktop 1920px
- [ ] 12-col Bento vollständig sichtbar, kein horizontaler Scroll
- [ ] FocusTasks + ScheduleColumn gleich hoch, kein Höhen-Mismatch
- [ ] Alle Domain-Colors sichtbar und konsistent mit CommandBar
- [ ] Hero-Zahlen dominieren sichtbar, Meta-Texte merklich kleiner
- [ ] QuickActions-Zone sichtbar unten rechts, kompakt
- [ ] Kein Border auf sekundären Cards

### Laptop 1366×768
- [ ] Kein Clipping — alle Cards vollständig sichtbar oder intern scrollbar
- [ ] Tall Cards (FocusTasks, Schedule) passen in ~600px (Viewport minus Header+CommandBar ~170px)
- [ ] PomodoroTimer + StudyProgress auf ≤210px begrenzt — kein Überlauf
- [ ] Hero-Zahlen lesbar (mind. 32px rendered)
- [ ] Keine Overflow-Artefakte an Card-Rändern

### iPad 768px
- [ ] 8-col Layout aktiv (nicht 12-col gequetscht)
- [ ] ScheduleColumn full-width lesbar
- [ ] Alle Touch-Targets ≥44px
- [ ] Tooltip-Text bei Icon-Buttons sichtbar bei :focus-visible
- [ ] Kein horizontaler Scroll auf dem Gesamt-Layout

---

## Border-Entscheidungen

| Widget | Border | Grund |
|--------|--------|-------|
| FocusTasks | ✅ bleibt | primary action area |
| PomodoroTimer | ✅ bleibt | interaktives Element |
| ScheduleColumn | ✅ bleibt | strukturgebend |
| StudyProgress | ❌ weg | `bg-surface/30` |
| WeekOverview | ❌ weg | `bg-surface/20` |
| UpcomingDeadlines | ❌ weg | `bg-surface/30` |
| QuickActionsWidget | ❌ weg | minimal, kein visuelles Gewicht |

---

## Dateien

| Datei | Änderung |
|-------|----------|
| `app/(dashboard)/today/page.tsx` | Bento-Grid (Desktop + iPad), QuickActions Secondary-Zone |
| `components/features/dashboard/FocusTasks.tsx` | Rot-Domain, Hero `type-hero`, Completion-Animation, min/max-height |
| `components/features/dashboard/StudyProgress.tsx` | Amber-Domain, kein Border, Hero-%, overflow |
| `components/features/dashboard/PomodoroTimer.tsx` | Orange-Domain, Hero `MM:SS`, kein Tick-Loop |
| `components/features/dashboard/UpcomingDeadlines.tsx` | Domain-Farben per Typ, kein Border, overflow |
| `components/features/dashboard/WeekOverview.tsx` | kein Border, `bg-surface/20` |
| `components/features/dashboard/QuickActionsWidget.tsx` | Icon-only, aria-label, tooltip, focus-ring, kein Titel |

---

## Definition of Done

**Layout**
- [ ] Desktop 12-col Bento korrekt — alle col-span/row-span wie spec
- [ ] iPad 8-col Layout aktiv bei 768px — nicht Desktop-Downscale
- [ ] Mobile single-column in Prioritätsreihenfolge

**Visual**
- [ ] Jedes Widget hat Domain-Color sichtbar (AA-konform)
- [ ] Typo-Token-System eingehalten — kein freies text-lg/xl
- [ ] Kein Border auf sekundären Cards
- [ ] Hero-Zahl dominiert eindeutig pro Card

**Constraints**
- [ ] Alle Cards: `min-height` + `max-height` + `overflow` definiert
- [ ] 1366×768: kein Clipping, interne Scrolls wo nötig

**Motion & Accessibility**
- [ ] `useReducedMotion()` in allen animierten Komponenten
- [ ] Icon-Buttons: `aria-label` + `title` + `focus-visible:ring-2`
- [ ] Task-Completion-Animation (250ms, einmalig, reduced-motion-safe)

**QA**
- [ ] Visual Acceptance: Desktop 1920, Laptop 1366, iPad 768 geprüft
- [ ] `npm run type-check` + `lint` grün

---

## Nächste Schritte nach /today Signoff

1. Farbdomänen auf `/analytics` propagieren
2. Farbdomänen auf `/university` propagieren
3. Lucian Ambient Redesign → `docs/LUCIAN_AMBIENT.md`
