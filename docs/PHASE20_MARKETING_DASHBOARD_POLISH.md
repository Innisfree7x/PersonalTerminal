# Phase 20 — Marketing + Dashboard Premium Polish

Status: Active execution contract
Date: 2026-03-07
Owner: UI agent + Marketing agent
Scope: Dashboard design elevation (per tab) + 3 Marketing features

---

## Kontext

INNIS ist technisch solide und funktional komplett. Was jetzt fehlt: das Gesamtprodukt muss sich auf *jedem Tab* premium anfühlen — nicht nur auf Today und Focus. Gleichzeitig hat die Marketing-Seite noch kein soziales Beweis-Moment und keine konkreten User-Stories.

Dieses Dokument ist der Bauplan für beides.

**Goldene Regel:**
> Ein Premium-Produkt hat eine dominante Farbe. Alles andere tritt zurück.
> Weniger ist mehr. Jede Änderung muss das Signal stärken, nicht den Lärm erhöhen.

---

## Teil 1: Dashboard Tab-by-Tab Design

### 1.1 Today — Pomodoro Timer (`components/features/dashboard/PomodoroTimer.tsx`)

**Problem:**
Der kreisförmige `25:00` Timer ist visuell das generischste Element im Dashboard. Ein grauer Kreis mit weißer Zahl — das sieht aus wie jeder Pomodoro-Clone von 2018.

**Lösung:**
Den Timer-Kreis durch einen `conic-gradient` SVG Ring ersetzen der den Fortschritt animiert visualisiert.

**Implementierung:**
```tsx
// Statt static circle: animierter SVG progress ring
const radius = 54;
const circumference = 2 * Math.PI * radius;
const progress = timeLeft / totalTime; // 0-1
const strokeDashoffset = circumference * (1 - progress);

<svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
  {/* Track */}
  <circle cx="60" cy="60" r={radius}
    fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="6" />
  {/* Progress */}
  <circle cx="60" cy="60" r={radius}
    fill="none"
    stroke="rgb(var(--primary))"
    strokeWidth="6"
    strokeLinecap="round"
    strokeDasharray={circumference}
    strokeDashoffset={strokeDashoffset}
    style={{ transition: 'stroke-dashoffset 1s linear' }}
  />
</svg>
```

Zusätzlich: Wenn Timer unter 5 Minuten → `stroke` wechselt von `primary` zu `red-400` mit `transition-colors duration-1000`. Visuelles Warnsignal ohne Notification.

---

### 1.2 Trajectory — Milestone Cards + Status-Change Highlight (`app/(dashboard)/trajectory/page.tsx`)

**Problem:**
Milestone-Cards sind eine flache Liste. Wenn sich der Risk-Status von `tight` → `at_risk` ändert, passiert visuell nichts. Der User sieht es erst beim nächsten Reload.

**Lösung A — Milestone Cards:**
Jede Milestone-Card bekommt eine farbige linke Border die dem Status entspricht:
```tsx
const statusBorder = {
  on_track: 'border-l-emerald-500/60',
  tight:    'border-l-amber-500/60',
  at_risk:  'border-l-red-500/60',
};

<div className={`card-surface border-l-2 ${statusBorder[milestone.status]} rounded-xl p-4`}>
```

**Lösung B — Status-Change Highlight:**
Wenn ein Milestone seinen Status ändert (erkennbar durch `useEffect` + `useRef` auf previous status), kurze Puls-Animation:
```tsx
// In der Milestone-Card Komponente:
const prevStatusRef = useRef(milestone.status);
const [justChanged, setJustChanged] = useState(false);

useEffect(() => {
  if (prevStatusRef.current !== milestone.status) {
    setJustChanged(true);
    const t = setTimeout(() => setJustChanged(false), 2000);
    prevStatusRef.current = milestone.status;
    return () => clearTimeout(t);
  }
}, [milestone.status]);

// Auf der Card:
className={`... ${justChanged ? 'animate-pulse' : ''}`}
```

---

### 1.3 Focus — Cinematic Today→Focus Transition (`app/(dashboard)/focus/page.tsx`)

**Problem:**
Der Übergang von `/today` → `/focus` ist ein harter Page-Load. Für eine App die sich "premium" anfühlen soll ist das der schwächste Moment.

**Lösung:**
Framer Motion `layoutId` auf dem Focus-Button in Today und dem Focus-Screen-Container nutzen — shared layout animation.

**Implementierung in `FocusTimerProvider`:**
Wenn der User auf "Focus" klickt, statt `router.push('/focus')`:
1. Eine `isTransitioning` State auf `true` setzen
2. Eine fullscreen Overlay-Div mit `motion.div` und `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` über das Dashboard legen
3. Nach 300ms `router.push('/focus')` ausführen

```tsx
// In FloatingTimer oder FocusButton:
const handleFocusTransition = () => {
  setIsTransitioning(true);
  setTimeout(() => router.push('/focus'), 280);
};

// Overlay (in dashboard layout):
<AnimatePresence>
  {isTransitioning && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background"
    />
  )}
</AnimatePresence>
```

Einfach, effektiv, kein Layout-Shift.

---

### 1.4 Analytics — Chart Elevation (`app/(dashboard)/analytics/page.tsx`)

**Problem:**
Recharts sind funktional aber optisch generisch. Gleicher Look wie jedes andere Analytics-Tool. Kein visueller Unterschied zu Google Analytics oder einem Notion-Chart.

**Lösung — 3 konkrete Änderungen:**

**A. Gradient Fill unter Line/Area Charts:**
```tsx
// In jedem AreaChart:
<defs>
  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3} />
    <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
  </linearGradient>
</defs>
<Area
  type="monotone"
  dataKey="hours"
  stroke="rgb(var(--primary))"
  strokeWidth={2}
  fill="url(#focusGradient)"
/>
```

**B. Animierter Chart-Eintritt:**
Recharts unterstützt `isAnimationActive` und `animationBegin` / `animationDuration`:
```tsx
<Line
  isAnimationActive={true}
  animationBegin={0}
  animationDuration={800}
  animationEasing="ease-out"
/>
```

**C. Glass-styled Tooltip:**
```tsx
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.12] bg-zinc-950/90 px-3 py-2 shadow-2xl backdrop-blur-md">
      <p className="text-xs font-semibold text-text-primary">{payload[0].value}h</p>
      <p className="text-[10px] text-zinc-500">{payload[0].name}</p>
    </div>
  );
};
<Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgb(255 255 255 / 0.08)' }} />
```

---

### 1.5 Career — Timeline View + Pipeline Score

**Problem:**
Kanban-Boards für Job-Applications sind 2020. User sehen nicht wo sie in ihrer Job-Search Journey stehen.

**Lösung A — Pipeline Score (oben auf der Career-Page):**
Deterministisch berechnet — kein LLM:
```
score = (aktive_applications * 10) + (interviews * 25) + (offers * 50)
max = 100

Anzeige: "Pipeline: 42 / 100 — Gut aufgestellt"
```

Implementierung in `lib/career/pipelineScore.ts` — pure function, testbar.

**Lösung B — Timeline View Toggle:**
Neben dem Kanban-Toggle ein "Timeline" Icon-Button. Timeline zeigt Applications als horizontale Karte mit:
- Datum der Bewerbung links
- Status als farbiger Punkt
- Firma + Rolle als Titel

```tsx
// Minimal-Implementierung:
<div className="space-y-2">
  {applications
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .map(app => (
      <div key={app.id} className="flex items-center gap-4 py-2 border-b border-white/[0.06]">
        <span className="w-20 text-xs text-zinc-500 shrink-0">
          {formatDate(app.appliedAt)}
        </span>
        <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor[app.status]}`} />
        <span className="text-sm text-text-primary">{app.company}</span>
        <span className="text-xs text-zinc-500 ml-auto">{app.status}</span>
      </div>
    ))}
</div>
```

---

### 1.6 Goals — Progress Visualization (`app/(dashboard)/goals/page.tsx`)

**Problem:**
Goal-Cards zeigen ob ein Goal existiert — aber kein Gefühl ob man *näher dran* ist. Die Stat-Kacheln oben (`Total Goals`, `Completed`, `Success Rate`, `Overdue`) nutzen raw `bg-success/10 bg-primary/10 bg-error/10` — inkonsistent mit dem Rest des Designs.

**Lösung A — Stat-Kacheln auf `card-surface` vereinheitlichen:**
```tsx
// Vorher: bg-success/10 border border-success/30 rounded-lg p-4
// Nachher:
<div className="card-surface rounded-xl p-4">
  <div className="text-2xl font-bold text-success">{stats.completed}</div>
  <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 mt-0.5">Completed</div>
</div>
```

**Lösung B — Progress Bar auf Goal-Cards:**
Wenn ein Goal ein `targetDate` hat: zeige einen dünnen Progress-Balken der den zeitlichen Fortschritt visualisiert.
```tsx
const timeProgress = Math.min(
  (Date.now() - new Date(goal.createdAt).getTime()) /
  (new Date(goal.targetDate).getTime() - new Date(goal.createdAt).getTime()),
  1
);
<div className="mt-2 h-0.5 w-full rounded-full bg-white/[0.06]">
  <div
    className="h-0.5 rounded-full bg-primary/50 transition-all duration-700"
    style={{ width: `${timeProgress * 100}%` }}
  />
</div>
```

---

### 1.7 University — Exam Countdown Visual (`app/(dashboard)/university/page.tsx`)

**Problem:**
"Exam in 3d" als Text-Badge ist funktional aber emotionslos. Ein Exam in 3 Tagen ist ein kritisches Event das visuell mehr Gewicht braucht.

**Lösung — Urgency-Ring auf Course-Cards:**
Wenn `daysUntilExam <= 7`:
```tsx
const urgencyRing =
  daysUntilExam <= 1 ? 'ring-2 ring-red-500/50 shadow-[0_0_12px_2px_rgba(239,68,68,0.2)]' :
  daysUntilExam <= 3 ? 'ring-2 ring-amber-500/40' :
  daysUntilExam <= 7 ? 'ring-1 ring-amber-400/25' : '';

<div className={`card-surface rounded-xl p-4 ${urgencyRing}`}>
```

Zusätzlich: Das Exam-Datum als Countdown statt als Text:
```tsx
// Statt "Prüfung in 3d":
<span className="font-mono text-[10px] font-semibold text-amber-300">
  {daysUntilExam === 0 ? 'Heute' : daysUntilExam === 1 ? 'Morgen' : `${daysUntilExam}d`}
</span>
```

---

### 1.8 Calendar — Trajectory Milestones als Events

**Problem:**
Der Kalender zeigt Google Calendar Events — aber keine Trajectory-Milestones. Ein User sieht seine GMAT-Prep-Start-Date nicht im Kalender obwohl Trajectory sie kennt.

**Lösung:**
Trajectory-Milestones als eigene Event-Kategorie in die Calendar-Komponente laden:
- API: `/api/trajectory/overview` gibt bereits `startDate` und `dueDate` zurück
- Diese als "Ghost Events" im Kalender rendern — anderer Style als normale Events

```tsx
// In der Calendar-Komponente:
const trajectoryEvents = trajectoryGoals.map(goal => ({
  id: `traj-${goal.id}`,
  title: `📍 ${goal.title}`,
  date: goal.startDate,
  type: 'trajectory',
}));

// Rendering — anderer Style:
{event.type === 'trajectory' && (
  <div className="rounded border-l-2 border-primary/60 bg-primary/[0.06] px-1.5 py-0.5 text-[10px] text-primary/80">
    {event.title}
  </div>
)}
```

---

## Teil 2: Marketing Features

### 2.1 Trajectory Plan PNG Export ("Share on LinkedIn")

**Warum:**
Jeder geteilte Screenshot ist kostenlose Werbung. Notion hat seine User-Base zu 40% durch "Made with Notion"-Shares aufgebaut. INNIS kann dasselbe mit "My GMAT Plan — built with INNIS".

**Was es macht:**
Ein "Export als Bild" Button auf der Trajectory-Page. Generiert ein sauberes 1200×630px PNG (perfekt für LinkedIn/Twitter) mit:
- INNIS Branding-Logo oben rechts
- Goal-Name + Deadline prominent
- Risk-Status als farbiger Badge
- Milestone-Timeline als vereinfachte visuelle Leiste
- "innis.app" als Watermark unten

**Implementierung:**

Package: `html-to-image` (bereits möglicherweise in dependencies, sonst: `npm install html-to-image`)

```tsx
// Neue Datei: components/features/trajectory/TrajectoryShareCard.tsx
// Eine versteckte Komponente (position: fixed, left: -9999px) die den Export-Inhalt rendert

import { toPng } from 'html-to-image';

const exportRef = useRef<HTMLDivElement>(null);

const handleExport = async () => {
  if (!exportRef.current) return;
  const dataUrl = await toPng(exportRef.current, {
    width: 1200,
    height: 630,
    pixelRatio: 2,
  });
  const link = document.createElement('a');
  link.download = `innis-trajectory-${goal.title.toLowerCase().replace(/\s/g, '-')}.png`;
  link.href = dataUrl;
  link.click();
  // Analytics:
  void trackAppEvent('trajectory_plan_exported', { goal_id: goal.id, status: goal.status });
};
```

**Export-Card Design:**
```tsx
<div ref={exportRef} style={{ width: 1200, height: 630 }}
  className="bg-[#0d0d12] p-12 flex flex-col justify-between font-sans">
  {/* Header */}
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">My Plan</p>
      <h1 className="text-5xl font-semibold text-white">{goal.title}</h1>
      <p className="text-zinc-400 mt-2">Deadline: {formatDate(goal.dueDate)}</p>
    </div>
    <StatusBadge status={goal.status} large />
  </div>
  {/* Timeline bar */}
  <MilestoneTimelineBar milestones={goal.milestones} />
  {/* Footer */}
  <div className="flex items-center justify-between">
    <p className="text-zinc-600 text-sm">Built with INNIS — Strategic Planning for Students</p>
    <p className="text-zinc-600 text-sm">innis.app</p>
  </div>
  {/* 4-color gradient bottom stripe */}
  <div className="absolute inset-x-0 bottom-0 h-1"
    style={{ background: 'linear-gradient(to right, #f87171, #fbbf24, #fb923c, #38bdf8)' }} />
</div>
```

**Button auf Trajectory-Page:**
```tsx
<button onClick={handleExport}
  className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.08]">
  <Share2 className="h-3.5 w-3.5" />
  Als Bild exportieren
</button>
```

**Analytics Event:**
In `lib/analytics/events.ts` hinzufügen:
```ts
trajectory_plan_exported: z.object({ goal_id: z.string(), status: z.string() })
```

---

### 2.2 /for-students — Real Use-Case Page mit Walkthrough

**Warum:**
Menschen kaufen Geschichten, nicht Features. "INNIS hilft Studenten" ist zu abstrakt. "So hat Viet seinen GMAT-Plan strukturiert" ist konkret und vertrauensbildend.

**URL:** `/for-students` (neue Route unter `app/(marketing)/for-students/page.tsx`)

**Page-Struktur:**

```
Hero: "Wie Viet seinen GMAT in 6 Monaten geplant hat"
→ Reale Story: Student im 5. Semester, parallele Bewerbungen, kein System

Problem-Strip: "Das Problem das wir alle kennen"
→ 3 konkrete Pain-Points mit echten Zitaten (fiktiv aber realistisch)

Step-by-Step Walkthrough: "So funktioniert es"
→ 4 Steps mit echten INNIS-Screenshots + Annotations

Trajectory Demo: Der Interactive Hero Simulator (wiederverwendet von HeroSection)
→ "Simuliere deinen eigenen Plan — kein Signup nötig"

CTA: "Starte deinen Plan"
→ /auth/signup mit pre-selected segment "student"
```

**Implementierung:**

```tsx
// app/(marketing)/for-students/page.tsx
export const metadata = {
  title: 'Für Studenten — INNIS',
  description: 'Wie ambitionierte Studenten Thesis, GMAT und Praktikum mit INNIS in einem strategischen Plan vereinen.',
};

// Steps Array:
const WALKTHROUGH_STEPS = [
  {
    step: '01',
    title: 'Goal anlegen — in 2 Minuten',
    description: 'Du gibst dein Ziel ein (GMAT, Thesis, Praktikum), die Deadline und wie viele Stunden pro Woche du realistisch hast.',
    detail: 'INNIS berechnet sofort: reicht das? Bist du on track oder musst du früher anfangen?',
    screenshot: '/screenshots/onboarding-trajectory.png', // Echte Screenshots einbinden
    status: 'on_track' as const,
  },
  {
    step: '02',
    title: 'Risk-Status — dein täglicher Kompass',
    description: 'Jeden Morgen siehst du auf Today: bist du on track, tight oder at risk?',
    detail: 'Kein Rätselraten mehr. INNIS rechnet rückwärts von deiner Deadline.',
    screenshot: '/screenshots/today-briefing.png',
    status: 'tight' as const,
  },
  {
    step: '03',
    title: 'Focus Sessions — Stunden die zählen',
    description: 'Jede Focus Session trägt zu deinem Wochenplan bei.',
    detail: 'Der Momentum Score zeigt dir wöchentlich ob du aufholst oder abdriftest.',
    screenshot: '/screenshots/focus-screen.png',
    status: 'on_track' as const,
  },
  {
    step: '04',
    title: 'Career parallel — kein Chaos',
    description: 'Bewerbungen, Interviews und Angebote im selben System.',
    detail: 'Keine separaten Notion-Tabellen mehr.',
    screenshot: '/screenshots/career-board.png',
    status: 'on_track' as const,
  },
];
```

**SEO-Metadata:**
```tsx
export const metadata = {
  title: 'GMAT & Thesis parallel planen — INNIS für Studenten',
  description: 'INNIS zeigt dir in 2 Minuten ob dein GMAT-Plan realistisch ist. Backplanning von der Deadline rückwärts. Kein Signup für die Demo.',
  openGraph: {
    title: 'Plane GMAT, Thesis und Praktikum in einer Timeline',
    description: 'INNIS — Strategic Planning for Students',
    images: ['/og/for-students.png'],
  },
};
```

---

### 2.3 Waitlist Segment Activation Emails

**Warum:**
Du hast bereits Waitlist-Segmentierung live (Phase 18). User haben sich als Thesis/GMAT/Praktikum/Master eingetragen. Aber sie haben noch nichts von dir gehört seitdem. Eine segment-spezifische E-Mail hat 3-5x höhere Open-Rate als eine generische "Wir sind ready" Mail.

**3 E-Mail Templates — je nach Segment:**

**Segment: GMAT**
```
Subject: "Dein GMAT-Plan — bist du wirklich on track?"
Preview: "Die meisten Studenten merken es erst 2 Monate zu spät."

Body:
Hey [Name],

du hast dich für INNIS angemeldet weil du deinen GMAT planst.

Die ehrliche Frage: Weißt du gerade ob dein Plan realistisch ist?

INNIS berechnet in 2 Minuten:
→ Wann du mit der Vorbereitung anfangen musst
→ Wie viele Stunden/Woche du brauchst
→ Ob dein aktueller Plan ausreicht

[Starte deinen GMAT-Plan →]

P.S. Du brauchst keinen Kreditkartencode. Die Demo läuft sofort.
```

**Segment: Thesis**
```
Subject: "Thesis-Abgabe rückwärts planen — so geht es"
Preview: "Wann musst du spätestens mit Kapitel 1 fertig sein?"

Body:
Hey [Name],

Thesis-Abgabe in [X Monaten]? INNIS zeigt dir heute:

→ Welcher Milestone bis wann fertig sein muss
→ Ob du gerade on track bist oder nacharbeiten musst
→ Was die nächste konkrete Aufgabe ist

Kein Stress, keine Überraschungen.

[Thesis-Plan starten →]
```

**Segment: Praktikum/Karriere**
```
Subject: "Bewerbungsphase organisiert — nicht chaotisch"
Preview: "Parallele Bewerbungen, ohne den Überblick zu verlieren."

Body:
Hey [Name],

Mehrere Bewerbungen gleichzeitig managen ist anstrengend.

INNIS gibt dir:
→ Alle Bewerbungen in einer Timeline
→ Pipeline Score — weißt du wie aktiv du wirklich bist?
→ Reminder wenn du zu lange nichts gehört hast

[Karriere-Board starten →]
```

**Technische Implementierung:**
E-Mails über Supabase Edge Functions + Resend (oder SendGrid):

```ts
// supabase/functions/send-waitlist-activation/index.ts
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Aus user_metadata.waitlist_segment das richtige Template laden
const template = TEMPLATES[user.user_metadata.waitlist_segment ?? 'general'];

await resend.emails.send({
  from: 'Viet von INNIS <viet@innis.app>',
  to: user.email,
  subject: template.subject,
  html: template.html,
});
```

Cron-Trigger: Täglich die neuen Waitlist-User abfragen die noch kein Activation-E-Mail bekommen haben.

---

## Implementierungsreihenfolge

**Genau in dieser Reihenfolge. Ein Feature nach dem anderen.**

| # | Feature | Aufwand | Impact |
|---|---------|---------|--------|
| 1 | Goals + University Card-Elevation (1.6 + 1.7) | 2h | Sofort sichtbar |
| 2 | Analytics Chart Elevation (1.4) | 3h | Hoch |
| 3 | Career Pipeline Score (1.5A) | 2h | Mittel |
| 4 | Trajectory Share Export (2.1) | 4h | Hoch (virality) |
| 5 | Pomodoro Timer Ring (1.1) | 2h | Sichtbar |
| 6 | /for-students Page (2.2) | 4h | Mittel (SEO) |
| 7 | Waitlist Emails (2.3) | 3h | Hoch (conversion) |
| 8 | Calendar Trajectory Events (1.8) | 3h | Mittel |
| 9 | Focus Transition (1.3) | 2h | Poliert |
| 10 | Trajectory Status Highlight (1.2) | 2h | Subtil |

---

## Design-Prinzip (für alle Änderungen)

**Eine dominante Farbe — der Rest tritt zurück.**

INNIS hat zu viele gleichgewichtige Farben gleichzeitig: rot, amber, orange, sky, emerald.
Das Auge weiß nicht wo es landen soll.

Regel für jede neue Komponente:
- Primary (red/amber) = aktive Zustände, CTAs, wichtigste Metrik
- Zinc (400/500/600) = sekundäre Infos, Labels, Metadata
- Emerald/amber/red = nur für Status-Chips (on_track/tight/at_risk)
- Nie mehr als 2 Akzentfarben gleichzeitig sichtbar auf einer Card

---

## QA nach jeder Änderung

- [ ] Screenshot vor und nach
- [ ] `npm run type-check` ✅
- [ ] `npm run lint` ✅
- [ ] Keine Regression auf Today, Trajectory, Focus
- [ ] Mobile-Ansicht gecheckt (min. 375px Viewport)
- [ ] `prefers-reduced-motion` gecheckt für alle Animationen
