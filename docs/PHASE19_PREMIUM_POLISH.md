# Phase 19 — Premium Polish (Dashboard UX)

Status: Active execution contract
Date: 2026-03-07
Owner: UI agent
Scope: Visual polish only — no new features, no API changes, no logic changes

---

## Kontext: Was das Ziel ist

INNIS soll sich anfühlen wie Revolut oder Linear — clean, fluid, luxuriös.
Aktuell fühlt es sich *korrekt* an, aber nicht *premium*.

Das liegt nicht an fehlenden Features. Es liegt an vier konkreten Stellen die das Gesamtbild ziehen.

**Goldene Regel für dieses Dokument:**
> Weniger ist mehr. Whitespace ist kein leerer Raum, er ist Design.
> Kein Element darf das Auge dominieren das nicht das wichtigste ist.

---

## Priorität 1 — Calendar Empty State (größter Impact)

**Datei:** Finde die CalendarWidget-Komponente auf `/today` (wahrscheinlich `components/features/calendar/` oder `components/features/dashboard/`).

**Problem:**
Der "Connect Google Calendar" Zustand zeigt einen großen roten Button mittig im Dashboard. Dieser Button ist visuell das lauteste Element auf der gesamten Seite — lauter als Tasks, lauter als Trajectory. Das ist falsch. Ein Setup-Prompt soll nicht dominieren.

**Ziel:**
Der Empty State wird zur ruhigen Einladung — sichtbar aber nicht aufdringlich.

**Vorher (Prinzip):**
```
Großer zentrierter Container
Großes Icon
"Connect Google Calendar" als H2
Langer Erklärungstext
Riesiger roter primärer Button
```

**Nachher:**
```tsx
<div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
    <Calendar className="w-5 h-5 text-zinc-500" />
  </div>
  <div>
    <p className="text-sm font-medium text-zinc-400">Kalender verbinden</p>
    <p className="text-xs text-zinc-600 mt-0.5">Google Calendar synchronisieren</p>
  </div>
  <button className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white">
    <Calendar className="w-3.5 h-3.5" />
    Verbinden
  </button>
</div>
```

**Kernprinzip:**
- Icon: klein, subtil, nicht farbig
- Text: zwei Zeilen, klein, kein Ausrufezeichen
- Button: sekundärer Stil — kein roter Primär-Button
- Keine `scale` Hover-Animationen auf dem Button

---

## Priorität 2 — QuickActionsWidget (`components/features/dashboard/QuickActionsWidget.tsx`)

**Problem:**
Aktuell 5 Buttons im `grid grid-cols-2 gap-2` — alle gleich groß, alle mit farbigem Hintergrund, alle gleiches Gewicht. Das Auge weiß nicht wo es hinschauen soll. Kein Unterschied zwischen "Add Task" (primäre tägliche Aktion) und "Event" (selten genutzt).

**Ziel:**
Klare visuelle Hierarchie. "Add Task" ist die Hauptaktion — prominent. Die anderen vier sind sekundär — klein, ruhig.

**Nachher — komplette Neustruktur:**

```tsx
return (
  <div className="card-surface rounded-xl p-4 space-y-3">
    {/* Header */}
    <div className="flex items-center gap-2">
      <Plus className="w-4 h-4 text-zinc-500" />
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        Quick Actions
      </h3>
    </div>

    {/* Primary Action — Add Task */}
    <motion.button
      onClick={() => handleAction('/today')}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/[0.08] text-primary transition-all hover:bg-primary/[0.14] hover:border-primary/35"
      whileTap={{ scale: 0.98 }}
    >
      <FileText className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-semibold">Add Task</span>
      <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-50" />
    </motion.button>

    {/* Secondary Actions — pill row */}
    <div className="grid grid-cols-2 gap-2">
      {[
        { icon: Target, label: 'New Goal', href: '/goals', color: 'text-zinc-400' },
        { icon: Briefcase, label: 'Job App', href: '/career', color: 'text-zinc-400' },
        { icon: GraduationCap, label: 'Course', href: '/university', color: 'text-zinc-400' },
        { icon: Calendar, label: 'Event', href: '/calendar', color: 'text-zinc-400' },
      ].map((action) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            onClick={() => handleAction(action.href)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
            whileTap={{ scale: 0.97 }}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs font-medium">{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  </div>
);
```

**Wichtig:**
- `whileHover={{ scale: 1.05, y: -2 }}` entfernen — zu viel Bewegung für sekundäre Buttons
- `border-border` ersetzen durch `border-white/[0.07]` — weicher
- Keine farbigen Hintergründe auf sekundären Buttons — nur `bg-white/[0.03]`
- Import `ArrowRight` von lucide-react hinzufügen

---

## Priorität 3 — Card Whitespace (Today Page Layout)

**Datei:** `app/(dashboard)/today/page.tsx`

**Problem:**
Alle Cards sind zu eng beieinander. Gap zwischen Widgets ist zu klein.
Das Ergebnis: die Seite wirkt gedrängt, nicht premium.

**Suche nach dem Grid/Layout Container auf der Today-Page.**

**Vorher (typisch):**
```tsx
<div className="grid grid-cols-3 gap-4">
  ...
</div>
```

**Nachher:**
```tsx
<div className="grid grid-cols-3 gap-5 lg:gap-6">
  ...
</div>
```

Zusätzlich: Padding innerhalb der Cards erhöhen wo es unter `p-4` liegt → `p-5`.

**Spezifisch für die Today-Page:**
- Abstand zwischen Morning Briefing Strip und CommandBar: mindestens `mb-5` statt `mb-3`/`mb-4`
- Abstand zwischen CommandBar und Widget-Grid: mindestens `mt-5`
- Kein Widget darf direkt an den Page-Edge kleben — mindestens `px-5` auf dem Container

---

## Priorität 4 — Sidebar (`components/layout/Sidebar.tsx`)

**Achtung:** Die Sidebar ist bereits gut implementiert mit:
- Animated flowing light indicator (`layoutId="sidebar-active"`)
- `drop-shadow(0 0 5px currentColor)` auf aktiven Icons
- Gradient overlay auf aktiven Items

**Nur eine Anpassung nötig:**

Die `dashboard-sidebar-surface` CSS-Klasse muss auf Glass-Basis gebracht werden — analog zu `card-surface` aus PHASE19_DESIGN_ELEVATION.md.

**Suche in `app/globals.css` oder `tailwind.config`:**

```css
/* Vorher */
.dashboard-sidebar-surface {
  background: hsl(var(--surface));
  border-color: hsl(var(--border));
}

/* Nachher */
.dashboard-sidebar-surface {
  background: rgb(7 7 10 / 0.92);
  border-color: rgb(255 255 255 / 0.07);
}

@media (prefers-reduced-motion: no-preference) {
  .dashboard-sidebar-surface {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
}
```

Begründung: Die Sidebar soll sich leicht vom Hintergrund abheben — wie ein schwebendes Panel, nicht wie ein flaches Rechteck.

---

## Reihenfolge der Implementierung

**Genau in dieser Reihenfolge. Nicht parallel.**

1. **Calendar Empty State** — eine Datei, isoliert, kein Risiko
2. **QuickActionsWidget** — eine Datei, isoliert
3. **Today Page Whitespace** — nur Gap/Padding Werte, kein Logik-Touch
4. **Sidebar Glass** — nur CSS-Klassen-Update

Nach jeder Änderung: Screenshot machen und mit dem Original vergleichen bevor weiter.

---

## Was NICHT geändert wird

| Bereich | Warum |
|---------|-------|
| CommandBar | Bereits durch PHASE19_DESIGN_ELEVATION.md behandelt |
| Morning Briefing Strip | Funktioniert, kein Design-Problem |
| Momentum Score / RailChips | Bereits gut |
| Alle Animationen (Framer Motion) | Nur `scale: 1.05, y: -2` auf sekundären Buttons entfernen |
| Farbpalette (primary/amber/red) | Bleibt exakt |
| 4-Farben Gradient Line | Identität, bleibt |
| Irgendwelche API/Logik | Gar nichts anfassen |

---

## QA-Checkliste

Nach Implementierung Screenshot der Today-Page machen und prüfen:

- [ ] Calendar-Bereich: kein dominanter roter Button mehr sichtbar
- [ ] Quick Actions: "Add Task" klar als primäre Aktion erkennbar, Rest deutlich kleiner
- [ ] Zwischen allen Widget-Cards: sichtbarer Abstand (nicht gequetscht)
- [ ] Sidebar: leicht vom Hintergrund abgehoben (Glass-Effekt)
- [ ] Kein Layout-Shift durch Padding-Änderungen
- [ ] Mobile-Ansicht: kein Element läuft über
- [ ] `npm run type-check` ✅
- [ ] `npm run lint` ✅
- [ ] Keine Regression auf `/focus`, `/trajectory`, `/goals`

---

## Das Gesamtprinzip (für Codex zu verinnerlichen)

Premium Design ist nicht mehr Features — es ist weniger visueller Lärm.

Jedes Element auf der Seite sollte eine klare Antwort auf diese Frage haben:
**"Wie wichtig bin ich im Vergleich zu allem anderen?"**

- Calendar Setup ist nicht wichtig → klein machen
- Add Task ist täglich wichtig → prominent machen
- Whitespace ist kein leerer Raum → er gibt den wichtigen Elementen Luft zum Atmen

Revolut, Linear, Arc folgen alle diesem Prinzip. Kein Element schreit. Die wichtigen Dinge sind klar, der Rest tritt zurück.
