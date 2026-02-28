# /today Bento Redesign

Status: Planned
Date: 2026-03-01
Scope: /today page — Layout + Visual System (all 5 principles)

---

## Vision

Kein generisches SaaS-Dashboard mehr. Ein System das sich anfühlt als wäre es speziell für dich gebaut. /today ist der erste Canvas — dann propagieren wir die Änderungen auf andere Seiten.

---

## Die 5 Prinzipien

### 1. Bento statt gleiches Grid
Dinge die wichtig sind kriegen mehr Raum. Tasks dominieren links (tall), Schedule in der Mitte (tall), Timer und Study kompakt rechts, Deadlines + WeekOverview unten als breite Streifen.

### 2. Eine Farbe = eine Domäne, konsequent
Rot = Tasks, Amber = Uni, Orange = Streak/Focus, Sky = Career. Bereits im CommandBar drin — jetzt überall.

### 3. Eine Zahl pro Card, der Rest flüstert
Eine riesige Zahl die dominiert, alles andere 30–50% kleiner. Dein Auge weiß sofort was es aufnehmen soll.

### 4. Motion die Information trägt
Keine reinen Entry-Animationen. Motion bedeutet etwas: Task-Completion-Halo, Streak-Puls, Timer-Tick.

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
│  UpcomingDeadlines (5col) │  WeekOverview (7col)    │
└───────────────────────────┴─────────────────────────┘
```

```tsx
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-5 row-span-2">  {/* FocusTasks — tall */}
  <div className="col-span-4 row-span-2">  {/* ScheduleColumn — tall */}
  <div className="col-span-3">             {/* PomodoroTimer — top right */}
  <div className="col-span-3">             {/* StudyProgress — bottom right */}
  <div className="col-span-5">             {/* UpcomingDeadlines — bottom left */}
  <div className="col-span-7">             {/* WeekOverview — bottom right */}
</div>
```

**QuickActionsWidget** wird entfernt — Commands gehören in die CommandPalette (Cmd+K).

---

## Farbdomänen pro Widget

| Widget | Domäne | Accent-Farben |
|--------|--------|---------------|
| FocusTasks | Tasks → Rot | `text-red-300`, `bg-red-500/8`, linke Stripe `bg-red-400/40` |
| StudyProgress | Uni → Amber | `text-amber-300`, Progressbar `bg-amber-400/60` |
| PomodoroTimer | Focus → Orange | `text-orange-300`, Ring `border-orange-400/40` |
| UpcomingDeadlines | gemischt | je nach Typ: red / amber / orange / sky |
| ScheduleColumn | neutral | primary accent, kein Domain-Color |
| WeekOverview | alle Domänen | mini color dots per Typ |

---

## Hero-Zahlen pro Widget

| Widget | Hero | Meta |
|--------|------|------|
| FocusTasks | `X` (completed) in `text-4xl font-black text-red-300` | `/ Y` klein daneben |
| PomodoroTimer | `MM:SS` in `text-5xl font-black tabular-nums text-orange-300` | Phase-Label klein |
| StudyProgress | `XX%` pro Kurs in `text-2xl font-bold text-amber-300` | Kursname `text-xs` |
| UpcomingDeadlines | Tage-Zahl groß | Item-Titel klein |

---

## Motion-Bedeutung

| Event | Animation |
|-------|-----------|
| Task completed | Checkbox `scale(1.05) → scale(1)` + kurze grüne Halo-Welle (Framer Motion) |
| Streak aktiv | Counter `opacity 0.7 → 1 → 0.7`, 2s loop |
| Timer-Tick | Zeit-Zahl `scale(1) → scale(1.015) → scale(1)` jede Sekunde |
| Timer abgelaufen | Ring-Pulse + kurzes Victory-Flash |

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

---

## Dateien

| Datei | Änderung |
|-------|----------|
| `app/(dashboard)/today/page.tsx` | Bento-Grid, `QuickActionsWidget` entfernen |
| `components/features/dashboard/FocusTasks.tsx` | Rot-Domain, Hero-Zahl `X/Y`, Completion-Animation |
| `components/features/dashboard/StudyProgress.tsx` | Amber-Domain, kein Border, Hero-% pro Kurs |
| `components/features/dashboard/PomodoroTimer.tsx` | Orange-Domain, Hero-Timer `MM:SS`, Tick-Animation |
| `components/features/dashboard/UpcomingDeadlines.tsx` | Domain-Farben per Typ, kein Border |
| `components/features/dashboard/WeekOverview.tsx` | kein Border, `bg-surface/20` |

---

## Definition of Done

- [ ] `/today` zeigt Bento-Grid, kein 3-col-Grid mehr
- [ ] `QuickActionsWidget` nicht mehr auf /today
- [ ] Jedes Widget hat seine Domänenfarbe sichtbar
- [ ] Hero-Zahl dominiert pro Card, Meta flüstert
- [ ] Task-Completion-Animation sichtbar und befriedigend
- [ ] Streak-Puls + Timer-Tick funktionieren
- [ ] Kein Border auf sekundären Cards
- [ ] `npm run type-check` + `lint` grün
- [ ] Visuell auf Desktop + iPad geprüft

---

## Nächste Schritte nach /today

Nach Signoff auf /today:
1. Farbdomänen auf `/analytics` propagieren
2. Farbdomänen auf `/university` propagieren
3. Lucian Ambient Redesign (separate Planung → `docs/LUCIAN_AMBIENT.md`)
