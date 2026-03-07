# Phase 19 — Design Elevation (Glass + Glow)

Status: Active execution contract
Date: 2026-03-07
Scope: Visual elevation only — no logic, no new features, no API changes

---

## Ziel

INNIS fühlt sich aktuell *korrekt* an. Nach dieser Phase fühlt es sich *wertig* an.

Drei präzise Eingriffe:
1. **CommandBar** → Glass + Backdrop-Blur + Glow auf StatChip-Hover
2. **Dashboard-Widgets (Cards)** → leichtere Glass-Tiefe + weicherer Border
3. **RailChip** → subtiler Farbglow im jeweiligen Akzentton

**Was nicht geändert wird:**
- 4-Farben-Gradientlinie am CommandBar-Bottom (Identität, bleibt exakt)
- Farbpalette (amber/red/orange/sky — bleibt)
- Alle Funktionen, States, Animationen
- Keine neuen Komponenten

---

## Constraint: Performance

Backdrop-blur ist GPU-teuer. Pflicht-Guards:

```css
/* Nur aktivieren wenn keine reduced-motion Präferenz */
@media (prefers-reduced-motion: no-preference) {
  .glass-elevated { backdrop-filter: blur(12px); }
}
```

Tailwind-Equivalent: `motion-safe:backdrop-blur-md`

Alle `backdrop-blur-*` Klassen in diesem Doc sind implizit `motion-safe:backdrop-blur-*`.

---

## 1. CommandBar (`components/features/dashboard/CommandBar.tsx`)

### Wrapper (Zeile 401–406)

**Vorher:**
```tsx
className="card-surface relative overflow-hidden rounded-xl"
```

**Nachher:**
```tsx
className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/80 shadow-2xl motion-safe:backdrop-blur-md"
```

Begründung:
- `card-surface` durch explizite Glass-Klassen ersetzen (Kontrolle)
- `bg-zinc-950/80` = leicht transparent für Blur-Effekt
- `border-white/[0.08]` = weicher als aktueller card-surface Border
- `shadow-2xl` = Tiefe und Floating-Gefühl
- `motion-safe:backdrop-blur-md` = Glass-Effekt mit Accessibility-Guard

### Top Inset Highlight (Zeile 408)

**Vorher:**
```tsx
className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent"
```

**Nachher:**
```tsx
className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent"
```

Begründung: Leicht stärker (0.12 → 0.18) damit der obere Edge auf dem Glass-Hintergrund noch lesbar ist.

### StatChip Hover (`function StatChip`, Zeile 118)

**Vorher:**
```tsx
className="group relative flex min-w-[140px] flex-1 items-center gap-2.5 overflow-hidden px-4 py-3.5 transition-colors hover:bg-surface-hover/40"
```

**Nachher:**
```tsx
className="group relative flex min-w-[140px] flex-1 items-center gap-2.5 overflow-hidden px-4 py-3.5 transition-all duration-200 hover:bg-white/[0.04]"
```

Begründung: `hover:bg-surface-hover/40` passt nicht zur Glass-Oberfläche. `hover:bg-white/[0.04]` ist glassnativ — hellt den Bereich minimal auf ohne Kontrast zu brechen.

### StatChip Left Stripe — Glow on Hover (Zeile 119)

**Vorher:**
```tsx
<div className={`absolute inset-y-2.5 left-0 w-0.5 rounded-r-full ${c.stripe}`} />
```

**Nachher:**
```tsx
<div className={`absolute inset-y-2.5 left-0 w-0.5 rounded-r-full transition-all duration-200 ${c.stripe} group-hover:shadow-[0_0_6px_1px] group-hover:shadow-current`} />
```

Begründung: Auf Hover bekommt die farbige Stripe einen minimalen Glow. `shadow-current` nutzt die Textfarbe der Stripe — kein hardcoded Farbwert, keine Dopplung.

> **Wichtig:** Nicht mehr als 6px blur. Subtil ist das Ziel — kein Neon-Look.

---

## 2. Dashboard-Widgets (`card-surface` Klasse)

Die globale `.card-surface` Klasse wird in `app/globals.css` oder `tailwind.config` definiert.

**Finde die Definition von `card-surface` und passe sie an:**

**Vorher (typisch):**
```css
.card-surface {
  background: hsl(var(--surface));
  border: 1px solid hsl(var(--border));
  border-radius: ...;
}
```

**Nachher:**
```css
.card-surface {
  background: rgb(9 9 11 / 0.75);        /* zinc-950/75 */
  border: 1px solid rgb(255 255 255 / 0.07);
  border-radius: inherit;
}

@media (prefers-reduced-motion: no-preference) {
  .card-surface {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}
```

Begründung:
- `bg-zinc-950/75` statt solid → ermöglicht Blur-Tiefe
- `border-white/[0.07]` statt `border` CSS-Variable → konsistenter, weicher
- `blur(8px)` ist weniger aggressiv als CommandBar's `blur(12px)` — Widgets sind sekundär

> Falls `card-surface` via Tailwind @apply definiert ist, equivalente Tailwind-Klassen:
> `bg-zinc-950/75 border-white/[0.07] motion-safe:backdrop-blur-sm`

---

## 3. RailChip Glow (`function RailChip`, Zeile 61–82)

**Vorher:**
```tsx
<span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${toneClasses[tone]}`}>
```

**Nachher:**
```tsx
<span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] transition-shadow duration-200 ${toneClasses[tone]} ${glowClasses[tone]}`}>
```

Dazu neue `glowClasses` Map direkt nach `toneClasses` einfügen:

```tsx
const glowClasses: Record<ChipTone, string> = {
  muted:   '',
  danger:  'shadow-[0_0_8px_0px] shadow-red-500/25',
  warning: 'shadow-[0_0_8px_0px] shadow-amber-500/25',
  success: 'shadow-[0_0_8px_0px] shadow-emerald-500/25',
  info:    'shadow-[0_0_8px_0px] shadow-sky-500/25',
};
```

Begründung:
- `muted` bekommt keinen Glow — neutrale Chips bleiben neutral
- 8px blur, 25% opacity = sichtbar aber nicht aufdringlich
- Kein Hover-State nötig — Glow ist permanent für aktive Status-Chips (danger/warning/success/info)

---

## 4. Nicht anfassen

| Bereich | Warum |
|---------|-------|
| Bottom 4-Farben-Gradient | Projekt-Identität, bleibt pixel-genau |
| `TONE` Farbpalette in StatChip | red/amber/orange/sky bleibt |
| Framer Motion Animationen | Keine Änderungen an `initial`/`animate`/`transition` |
| ActionSection Buttons | Funktional korrekt, kein Design-Problem |
| `GlowSep` / `Sep` | Bereits gut |
| Theme-Variablen (CSS Custom Properties) | Nicht umbenennen, nicht löschen |

---

## QA-Checkliste nach Implementierung

- [ ] CommandBar auf `/today` sieht aus wie eine schwebende Glass-Pill — kein flat card
- [ ] StatChip Hover zeigt subtilen Glow auf der Stripe — kein neonartiger Effekt
- [ ] RailChip `danger`/`warning`/`success` haben leichten Farbglow
- [ ] Auf `prefers-reduced-motion: reduce` → kein Blur sichtbar, alles funktioniert normal
- [ ] Keine neue visual regression auf `/focus`, `/trajectory`, `/settings`
- [ ] `npm run type-check` ✅
- [ ] `npm run lint` ✅
- [ ] Kein Layout-Shift durch blur/shadow Ergänzungen (overflow-hidden bleibt wo nötig)

---

## Referenz-Ästhetik

Die Zielrichtung: **Glass, nicht Frosted**. Nicht opak. Nicht verspiegelt.
Ein Hauch Tiefe. Präzise Glows. Alles andere bleibt wie es ist.

Linear → Raycast → Arc: alle haben dieses Prinzip. Wenige Anpassungen, großer Unterschied.

---

## Implementation Notes (2026-03-07)

- `shadow-current` für die StatChip-Stripe wurde robust umgesetzt, indem die Stripe `bg-current` + explizite `text-*` Tonklasse nutzt.
- `.card-surface-hover` wurde auf dieselbe Glass-Basis wie `.card-surface` gebracht, damit Hover-Cards nicht aus dem neuen Layering herausfallen.
- Blur bleibt überall an `prefers-reduced-motion: no-preference` gebunden.
