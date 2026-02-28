# /today Bento Redesign

Status: Planned
Date: 2026-03-01
Scope: /today page — Layout + Visual System (all 5 principles + 6 refinements)

---

## Vision

Kein generisches SaaS-Dashboard mehr. Ein System das sich anfühlt als wäre es speziell für dich gebaut. /today ist der erste Canvas — dann propagieren wir die Änderungen auf andere Seiten.

---

## Die 5 Prinzipien

### 1. Bento statt gleiches Grid
Dinge die wichtig sind kriegen mehr Raum. Tasks dominieren links (tall), Schedule in der Mitte (tall), Timer und Study kompakt rechts, Deadlines + WeekOverview unten als breite Streifen.

### 2. Eine Farbe = eine Domäne, konsequent
Rot = Tasks, Amber = Uni, Orange = Streak/Focus, Sky = Career. Bereits im CommandBar drin — jetzt überall. Sättigung wird per Theme gedeckelt (siehe Refinement 4).

### 3. Eine Zahl pro Card, der Rest flüstert
Eine dominante Zahl, ein klarer Section-Title, danach nur noch ruhige Sekundärtexte. Strikte Staffelung — keine zweite "mittelgroße" Zahl die das Prinzip verwässert.

### 4. Motion die Information trägt
Keine dauerhaften Puls-Animationen. Eine ruhige Background-Animation im Focus-View. Alle anderen Animationen: einmalig, ≤300ms. Details siehe Motion-System unten.

### 5. Weniger Borders, mehr Tiefe
Nur interaktive/primäre Cards behalten `border border-border`. Sekundäre Cards existieren durch Hintergrundkontrast.

---

## Layout — Vorher → Nachher

**Vorher:** `grid grid-cols-1 lg:grid-cols-3 gap-6` — 3 gleiche Spalten, alles gleichwertig

**Nachher:** 12-col Bento mit Hierarchie durch Größe

```
┌─────────────────────────────────────────────────────┐
│  CommandBar (full width, bleibt)                    │
├──────────────────┬───────────────┬──────────────────┤
│                  │               │  PomodoroTimer   │
│  FocusTasks      │  Schedule     │  (kompakt, oben) │
│  (tall, 5col)    │  (tall, 4col) ├──────────────────┤
│                  │               │  StudyProgress   │
│                  │               │  (kompakt, unten)│
├──────────────────┴───────────────┴──────────────────┤
│  UpcomingDeadlines (5col) │  WeekOverview (4col)    │
│                           │  QuickActions (3col)    │
└───────────────────────────┴─────────────────────────┘
```

### Desktop (≥1024px)
```tsx
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-5 row-span-2 min-h-[420px] max-h-[640px]">  {/* FocusTasks */}
  <div className="col-span-4 row-span-2 min-h-[420px] max-h-[640px]">  {/* ScheduleColumn */}
  <div className="col-span-3 max-h-[200px] overflow-hidden">            {/* PomodoroTimer */}
  <div className="col-span-3 max-h-[200px] overflow-y-auto">            {/* StudyProgress */}
  <div className="col-span-5 max-h-[180px] overflow-y-auto">            {/* UpcomingDeadlines */}
  <div className="col-span-4 max-h-[180px]">                            {/* WeekOverview */}
  <div className="col-span-3 max-h-[180px]">                            {/* QuickActions (klein) */}
</div>
```

### iPad (768px–1023px) — explizit designed, nicht "Desktop skaliert runter"
```tsx
<div className="grid grid-cols-8 gap-3">
  <div className="col-span-8">                           {/* CommandBar — full */}
  <div className="col-span-5 min-h-[360px]">             {/* FocusTasks — breiter */}
  <div className="col-span-3 min-h-[360px]">             {/* PomodoroTimer + StudyProgress gestapelt */}
  <div className="col-span-8">                           {/* ScheduleColumn — full width */}
  <div className="col-span-4">                           {/* UpcomingDeadlines */}
  <div className="col-span-4">                           {/* WeekOverview + QuickActions */}
</div>
```

### Mobile (<768px)
Single column, Cards gestapelt, gleiche Reihenfolge wie iPad aber linear.

---

## QuickActionsWidget — Secondary Zone, nicht entfernt

Bleibt als **kompakte 3-col Secondary-Zone** unten rechts (Desktop) bzw. am Ende (iPad/Mobile).
- Nur 3–4 Icon-Buttons, kein voller Widget-Block
- Kein Titel, keine Erklärung — Icons sprechen für sich
- Discoverability bleibt erhalten ohne Primär-Hierarchie zu stören

---

## Farbdomänen pro Widget

Farben werden token-basiert mit WCAG AA-Kontrast in Dark Themes erzwungen.
Sättigung wird per Theme gedeckelt — kein reines `text-red-400` auf dunklem Grund ohne Kontrast-Check.

| Widget | Domäne | Accent-Farben |
|--------|--------|---------------|
| FocusTasks | Tasks → Rot | `text-red-300`, `bg-red-500/8`, linke Stripe `bg-red-400/40` |
| StudyProgress | Uni → Amber | `text-amber-300`, Progressbar `bg-amber-400/60` |
| PomodoroTimer | Focus → Orange | `text-orange-300`, Ring `border-orange-400/40` |
| UpcomingDeadlines | gemischt | je nach Typ: red / amber / orange / sky |
| ScheduleColumn | neutral | primary accent, kein Domain-Color |
| WeekOverview | alle Domänen | mini color dots per Typ |
| QuickActions | neutral | primary auf Hover |

---

## Typografie-Staffelung (strikt)

Drei Ebenen, keine vierte:

| Ebene | Stil | Verwendung |
|-------|------|------------|
| **Hero** | `text-4xl font-black tabular-nums` + Domain-Color | Eine Zahl pro Card |
| **Section-Title** | `text-sm font-semibold text-text-primary` | Card-Titel, einmal |
| **Meta / Secondary** | `text-xs text-text-tertiary/60` | Alles andere |

Kein `text-lg`, kein `text-xl`, kein `font-bold` außerhalb dieser drei Ebenen.

---

## Motion-System (systematisiert)

**Regel:** Maximal eine dauerhaft laufende Animation pro Viewport. Alle anderen sind einmalig und ≤300ms.

| Event | Animation | Dauer | Loop |
|-------|-----------|-------|------|
| Task completed | Checkbox `scale(1.05→1)` + grüne Halo-Welle | 250ms | nein |
| Timer abgelaufen | Ring-Flash + kurzer Victory-Moment | 300ms | nein |
| Card entry | `opacity 0→1, y -6→0` | 200ms | nein |
| Focus Background | eine ruhige ambient Bewegung | — | ja (nur /focus) |

**Gestrichen:** Streak-Puls-Loop, Timer-Tick-Scale — zu viel parallele Bewegung.

---

## Border-Entscheidungen

| Widget | Border | Grund |
|--------|--------|-------|
| FocusTasks | ✅ bleibt | primary action area |
| PomodoroTimer | ✅ bleibt | interaktives Element |
| ScheduleColumn | ✅ bleibt | strukturgebend |
| StudyProgress | ❌ weg | `bg-surface/30` reicht |
| WeekOverview | ❌ weg | `bg-surface/20`, reiner Kontext |
| UpcomingDeadlines | ❌ weg | `bg-surface/30`, sekundär |
| QuickActions | ❌ weg | minimal, kein visuelles Gewicht |

---

## Dateien

| Datei | Änderung |
|-------|----------|
| `app/(dashboard)/today/page.tsx` | Bento-Grid Desktop + iPad Breakpoint, QuickActions Secondary-Zone |
| `components/features/dashboard/FocusTasks.tsx` | Rot-Domain, Hero-Zahl `X/Y`, Completion-Animation, min/max-height |
| `components/features/dashboard/StudyProgress.tsx` | Amber-Domain, kein Border, Hero-%, `overflow-y-auto` |
| `components/features/dashboard/PomodoroTimer.tsx` | Orange-Domain, Hero-Timer `MM:SS`, kein Tick-Loop |
| `components/features/dashboard/UpcomingDeadlines.tsx` | Domain-Farben per Typ, kein Border, `overflow-y-auto` |
| `components/features/dashboard/WeekOverview.tsx` | kein Border, `bg-surface/20` |
| `components/features/dashboard/QuickActionsWidget.tsx` | Icon-only kompakt, kein Titel |

---

## Definition of Done

- [ ] `/today` zeigt Bento-Grid auf Desktop (12-col) und iPad (8-col) korrekt
- [ ] 1366×768 clippt nichts — alle Cards haben `min/max-height` + `overflow` definiert
- [ ] QuickActionsWidget als kompakte Icon-Zone unten rechts vorhanden
- [ ] Jedes Widget hat seine Domänenfarbe mit AA-Kontrast
- [ ] Typografie-Staffelung: nur Hero / Section-Title / Meta — nichts dazwischen
- [ ] Keine dauerhaften Puls-Animationen parallel aktiv
- [ ] Task-Completion-Animation (250ms, einmalig) funktioniert
- [ ] `npm run type-check` + `lint` grün
- [ ] Visuell geprüft: Desktop 1920px, Laptop 1366px, iPad 768px

---

## Nächste Schritte nach /today

Nach Signoff auf /today:
1. Farbdomänen auf `/analytics` propagieren
2. Farbdomänen auf `/university` propagieren
3. Lucian Ambient Redesign (separate Planung → `docs/LUCIAN_AMBIENT.md`)
