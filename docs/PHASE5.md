# Phase 5 — Notion Speed (Performance & Feel)

> **Vision:** INNIS fühlt sich wie eine native App an. Kein sichtbarer Ladebalken mehr.
> Jede Seite erscheint sofort — wie Notion, nicht wie eine Web-App.

---

## Diagnose — Was aktuell langsam ist

### Das Gute (bereits vorhanden)
- Optimistic Updates auf Goals (Create/Update/Delete) ✅
- `refetchOnWindowFocus: false` ✅
- `refetchOnReconnect: false` ✅

### Die Bottlenecks

| Problem | Datei | Impact |
|---------|-------|--------|
| `staleTime: 1 Min` — zu kurz | `QueryProvider.tsx` | Erledigt |
| Framer Motion Delays bis 300ms | Alle Page-Komponenten | Erledigt (Core Pages) |
| Kein Prefetch bei Navigation | `Sidebar` | Erledigt |
| Server Actions als Fetch-Layer | `app/actions/*` | Mittel |
| Today-Page: sequentielle Fetches | `today/page.tsx` | Niedrig (parallelisiert) |
| Fehlende Optimistic Updates | Career, Tasks, University | Weitgehend erledigt |

---

## Übersicht

| Feature | Priorität | Status |
|---------|-----------|--------|
| P1 — staleTime + gcTime erhöhen | P0 | ✅ done |
| P2 — Framer Motion Delays entfernen | P0 | ✅ done (core dashboard pages) |
| P3 — Prefetch on Hover (Sidebar) | P1 | ✅ done |
| P4 — Optimistic Updates: Career | P1 | ✅ mostly done |
| P5 — Optimistic Updates: Tasks | P1 | ✅ mostly done |
| P6 — Optimistic Updates: University | P1 | ✅ mostly done |
| P7 — Today-Page parallel fetchen | P2 | ✅ done (parallel queries/widgets) |
| P8 — Skeleton → Stale-Data anzeigen | P2 | ✅ done (isLoading-first pattern) |

---

## Ist-Stand (bereits umgesetzt)

- Optimistic Updates sind bereits breit vorhanden:
  - Career: optimistic add/edit/delete/move mit rollback (`components/features/career/CareerBoard.tsx`)
  - Tasks: optimistic create + hide-first interaction flow (`components/features/dashboard/FocusTasks.tsx`)
  - University: optimistic create/update/delete + exercise toggle (`app/(dashboard)/university/page.tsx`, `components/features/university/CourseCard.tsx`)
- Query focus/reconnect refetch sind bereits deaktiviert (global QueryClient).
- Server-Timing Header für `/api/dashboard/next-tasks` ist bereits aktiv.

**Konsequenz:** P4-P6 werden in Phase 5 nicht "neu gebaut", sondern nur bei Bedarf nachgeschärft.
Haupthebel für spürbare Geschwindigkeit sind P1, P2, P3, P8.

---

## Phase-5 Fortschritt (heute umgesetzt)

- P1 umgesetzt:
  - `staleTime` von 1m auf 5m erhöht
  - `gcTime` von 10m auf 30m erhöht
  - Datei: `components/providers/QueryProvider.tsx`
- P2 für die wichtigsten Dashboard-Routen umgesetzt:
  - page-level motion delays entfernt in
    - `app/(dashboard)/today/page.tsx`
    - `app/(dashboard)/goals/page.tsx`
    - `app/(dashboard)/university/page.tsx`
  - kurze, direkte transitions statt gestaffelter delays
- P3 umgesetzt:
  - Sidebar prefetch bei `hover`, `focus`, `touchStart`
  - Route-prefetch plus Query-prefetch für `/today`, `/goals`, `/university`
  - Cache-aware guard: kein redundant fetch, wenn Query noch frisch ist
  - Datei: `components/layout/Sidebar.tsx`

---

## P1 — staleTime + gcTime erhöhen

**Datei:** `components/providers/QueryProvider.tsx`

**Problem:** Nach 1 Minute sind Daten "stale". Seitenwechsel → Background-Refetch → Framer Animations laufen neu ab. Gefühlt träge.

**Fix:**
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 1 Min → 5 Min
      gcTime: 30 * 60 * 1000,     // 10 Min → 30 Min
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})
```

**Impact:** Daten bleiben 5 Min. frisch. Schneller Seitenwechsel (Goals → Today → Goals) fetcht nicht mehr neu.

---

## P2 — Framer Motion Delays entfernen

**Dateien:** Alle Page-Komponenten (`goals/page.tsx`, `career/page.tsx`, `university/page.tsx`, etc.)

**Problem:** Gestaffelte `transition={{ delay: 0.1/0.2/0.3 }}` blockieren die Wahrnehmung. Seite ist gerendert aber erst nach 300ms voll sichtbar. Notion animiert kaum — es ist einfach sofort da.

**Fix — Delays raus, kurze Durations:**
```typescript
// Vorher (langsam):
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
>

// Nachher (sofort):
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.1 }}
>
```

**Regel:** Kein `delay` mehr auf page-level Elementen. Nur noch `duration: 0.1` für subtiles Einblenden. Modals dürfen kurze Animationen behalten (fühlt sich gut an).

**Impact:** Seiten erscheinen sofort nach Navigation. Größte spürbare Verbesserung.

---

## P3 — Prefetch on Hover (Sidebar)

**Datei:** `components/layout/Sidebar.tsx` (oder ähnlich)

**Problem:** Klick auf "Goals" → Fetch startet erst jetzt → Loading State sichtbar. Notion lädt Daten schon beim Hover über den Link.

**Fix:**
```typescript
// Sidebar Nav-Item:
const queryClient = useQueryClient()

const prefetchMap: Record<string, () => Promise<unknown>> = {
  '/goals':      () => queryClient.prefetchQuery({ queryKey: ['goals'],      queryFn: fetchGoalsAction }),
  '/career':     () => queryClient.prefetchQuery({ queryKey: ['applications'], queryFn: fetchApplicationsAction }),
  '/university': () => queryClient.prefetchQuery({ queryKey: ['courses'],    queryFn: fetchCoursesAction }),
  '/today':      () => queryClient.prefetchQuery({ queryKey: ['daily-tasks'], queryFn: fetchTasksAction }),
}

<NavItem
  href="/goals"
  onMouseEnter={() => prefetchMap['/goals']?.()}
>
  Goals
</NavItem>
```

**Verhalten:**
- Hover über Sidebar-Link → Prefetch startet (noch keine Navigation)
- Klick → Daten sind bereits im Cache → Seite erscheint sofort
- Falls Hover zu kurz war → normaler Fetch greift als Fallback

**Impact:** Gefühlte Ladezeit ~0ms. Das ist das Notion-Feeling.

---

## P4 — Optimistic Updates: Career

**Datei:** `app/(dashboard)/career/page.tsx`

**Problem:** Status-Wechsel (Applied → Interview → Offer) wartet auf Server-Response. Bei LoL-Hotkeys (W = Status wechseln) muss das sofort reagieren.

**Fix-Muster:**
```typescript
const updateStatusMutation = useMutation({
  mutationFn: ({ id, status }) => updateApplicationAction(id, { status }),
  onMutate: async ({ id, status }) => {
    await queryClient.cancelQueries({ queryKey: ['applications'] })
    const previous = queryClient.getQueryData(['applications'])
    queryClient.setQueryData(['applications'], (current: Application[]) =>
      current.map(app => app.id === id ? { ...app, status } : app)
    )
    return { previous }
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(['applications'], context?.previous)
    toast.error('Failed to update status')
  },
})
```

---

## P5 — Optimistic Updates: Daily Tasks

**Datei:** `app/(dashboard)/today/page.tsx` (oder Tasks-Komponente)

**Problem:** Task als erledigt markieren wartet auf Server. Bei J/K + Space (Phase 4 Hotkeys) muss das instant sein.

**Fix-Muster:**
```typescript
const toggleTaskMutation = useMutation({
  mutationFn: ({ id, completed }) => toggleTaskAction(id, completed),
  onMutate: async ({ id, completed }) => {
    await queryClient.cancelQueries({ queryKey: ['daily-tasks'] })
    const previous = queryClient.getQueryData(['daily-tasks'])
    queryClient.setQueryData(['daily-tasks'], (current: Task[]) =>
      current.map(task => task.id === id ? { ...task, completed } : task)
    )
    return { previous }
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(['daily-tasks'], context?.previous)
  },
})
```

---

## P6 — Optimistic Updates: University (Blatt abhaken)

**Datei:** `app/(dashboard)/university/page.tsx`

**Problem:** Übungs-Blatt abhaken → wartet auf Server. Bei Phase 4 (W = Blatt abhaken) muss das sofort reagieren.

**Fix-Muster:** Identisch wie P5 aber für `exercise_progress` queries.

```typescript
onMutate: async ({ courseId, blatt, completed }) => {
  await queryClient.cancelQueries({ queryKey: ['exercise-progress', courseId] })
  const previous = queryClient.getQueryData(['exercise-progress', courseId])
  queryClient.setQueryData(['exercise-progress', courseId], (current) =>
    current.map(ex => ex.blatt === blatt ? { ...ex, completed } : ex)
  )
  return { previous }
}
```

---

## P7 — Today-Page: Parallel Fetching

**Datei:** `app/(dashboard)/today/page.tsx`

**Problem:** Today-Dashboard fetcht wahrscheinlich Tasks, Goals, Kurse, Calendar-Events sequentiell. Jeder Fetch wartet auf den vorherigen.

**Fix — Alle Queries parallel:**
```typescript
// Statt mehrere useQuery nacheinander:
const [tasksQuery, goalsQuery, coursesQuery, calendarQuery] = useQueries({
  queries: [
    { queryKey: ['daily-tasks'], queryFn: fetchTasksAction, staleTime: 5 * 60 * 1000 },
    { queryKey: ['goals'],       queryFn: fetchGoalsAction, staleTime: 5 * 60 * 1000 },
    { queryKey: ['courses'],     queryFn: fetchCoursesAction, staleTime: 5 * 60 * 1000 },
    { queryKey: ['calendar'],    queryFn: fetchCalendarAction, staleTime: 2 * 60 * 1000 },
  ]
})
```

**Impact:** Today-Page lädt so schnell wie der langsamste einzelne Fetch (statt Summe aller Fetches).

---

## P8 — Skeleton → Stale-Data anzeigen

**Problem:** Wenn Daten stale sind (nach 5 Min.) und User navigiert zurück → zeigt Skeleton obwohl alte Daten vorhanden sind.

**Fix — `isLoading` statt `isPending` für Skeleton-Entscheidung:**
```typescript
// isLoading = true NUR wenn KEINE Daten im Cache (echter erster Load)
// isFetching = true auch wenn Background-Refetch läuft

// Vorher (zeigt Skeleton bei jedem Refetch):
if (isPending) return <Skeleton />

// Nachher (zeigt Skeleton nur beim allerersten Load):
if (isLoading) return <Skeleton />

// Stale Daten im Hintergrund refetchen → User sieht sofort Inhalte
// Optional: kleiner Spinner-Indikator in der Ecke wenn isFetching
```

---

## Implementierungs-Reihenfolge

### Sprint 1 — Quick Wins (< 1h, sofort spürbar)
1. **P1** staleTime erhöhen — 2 Minuten Arbeit
2. **P2** Framer Motion Delays entfernen — 30 Minuten, alle Pages

### Sprint 2 — Prefetch + Optimistic (2-4h)
3. **P3** Prefetch on Hover in Sidebar
4. **P5** Optimistic Updates Tasks (täglich genutzt → höchster Impact)
5. **P4** Optimistic Updates Career

### Sprint 3 — Feinschliff (2-3h)
6. **P6** Optimistic Updates University
7. **P7** Today-Page parallel fetchen
8. **P8** isLoading vs isFetching fix

---

## Erwartetes Ergebnis

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Seitenwechsel (cached) | ~300ms gefühlt (Animationen) | ~50ms |
| Seitenwechsel (stale) | ~800ms (Fetch + Animationen) | ~100ms (Prefetch) |
| Task erledigen | ~200ms (Server-Wait) | ~0ms (Optimistic) |
| Status wechseln | ~300ms (Server-Wait) | ~0ms (Optimistic) |
| Today-Page Initial | ~1.5s (sequentiell) | ~600ms (parallel) |

---

## Design-Prinzipien

1. **Never block on server** — UI reagiert immer sofort, Server bestätigt im Hintergrund
2. **Stale-while-revalidate** — Alte Daten zeigen, leise im Hintergrund aktualisieren
3. **Prefetch > Fetch** — Daten laden bevor der User sie braucht
4. **No delays** — Animationen dürfen existieren, aber nie mit `delay` auf page-level
5. **Optimistic by default** — Jede Mutation geht davon aus dass sie erfolgreich ist

---

*Phase 5 — Started: Februar 2026*
