# Phase 48 — Baseline-Metriken

Stand: 2026-04-22
Status: Baseline nach A1 + A2 (Provider-Scope abgeschlossen)

Dieses Dokument hält die messbaren Ausgangswerte für Phase 48 fest, gegen
die die Phase 2 (Data-Layer Fanout) und Phase 3 (Server-first Kernpfad)
gemessen werden.

---

## 1. Bundle-Sizes (aus `next build`)

Source: Production-Build vom 2026-04-22 direkt nach A2-Merge
(Commit `e9829b0`), gemessen mit `npm run build`.

### Dashboard-Routen (Fokus Phase 48)

| Route              | Route-JS | First Load JS |
| ------------------ | -------: | ------------: |
| `/today`           |  25.3 kB |        212 kB |
| `/uni/courses`     |  13.8 kB |        205 kB |
| `/uni/sync`        |  14.8 kB |        189 kB |
| `/uni/grades`      |  4.07 kB |        149 kB |
| `/workspace/tasks` |  11.6 kB |        160 kB |
| `/workspace/goals` |  9.21 kB |        193 kB |
| `/workspace/calendar` | 12.8 kB |      151 kB |
| `/focus`           |  10.4 kB |        182 kB |
| `/settings`        |  8.93 kB |        243 kB |
| `/reflect/analytics` | 6.48 kB |      224 kB |

### Career-Flow

| Route                   | Route-JS | First Load JS |
| ----------------------- | -------: | ------------: |
| `/career/applications`  |  41.4 kB |        231 kB |
| `/career/trajectory`    |  20.3 kB |        181 kB |
| `/career/strategy`      |    15 kB |        170 kB |

### Shared

| Chunk                          |   Größe |
| ------------------------------ | ------: |
| First Load JS shared by all    | 87.8 kB |
| └ chunks/7023-…                | 31.7 kB |
| └ chunks/fd9d1056-…            | 53.7 kB |
| └ other shared chunks (total)  |  2.42 kB |
| Middleware                     | 75.5 kB |

Die Route-Spalte zeigt den **Route-spezifischen JS-Anteil**, First Load
enthält zusätzlich die Shared-Chunks.

---

## 2. Query-Observer Count (statisch, Code-Analyse)

Zählt `useQuery` + `useMutation`-Aufrufe, die auf einer Route gemountet
werden. Summiert Page + alle Provider, die laut Layout-Tree aktiv sind.

Eine `enabled: false`-Query belegt weiterhin einen Observer-Slot im
QueryCache, aber triggert keine Netzwerk-Requests — daher werden sie
separat ausgewiesen.

### Dashboard-weite Provider (immer aktiv)

Layout: `AuthProvider` → `ThemeProvider` → `SoundProvider` →
`QueryProvider` → `FocusTimerProvider` → `CommandPaletteProvider` →
`ToastProvider` → `SidebarProvider` → `PowerHotkeysProvider`.

| Provider             | useQuery | useMutation |
| -------------------- | -------: | ----------: |
| FocusTimerProvider   |       1  |           1 |
| PowerHotkeysProvider |       2  |           0 |
| Header (FocusTimerButton + Streak-Stats) | 1 | 0 |
| Sidebar              |       0  |           0 |
| **Summe Always-On**  |   **4**  |       **1** |

### Route-gated Provider (seit A1/A2)

| Provider              | aktiv auf                            | useQuery | useMutation |
| --------------------- | ------------------------------------ | -------: | ----------: |
| LucianBubbleProvider  | **nur** `/today` + `/today/*`        |     5    |           0 |
| ChampionProvider      | alles im Dashboard **außer** `/focus`, `/settings`, `/reflect/*`, `/analytics/*` | 0 | 0 |

LucianBubbleProvider ist jetzt sowohl **Mount-gated** (nur `/today`) als
auch intern über `enabled: contextHintsActive` geschützt — das garantiert
Null Observer auf allen anderen Routen.

ChampionProvider nutzt ausschließlich localStorage + DOM-Events, kein
React-Query.

### Page-Level

| Route / Komponente                          | useQuery | useMutation |
| ------------------------------------------- | -------: | ----------: |
| `/today` Page                               |        1 |           0 |
| └ FocusTasks                                |        2 |           3 |
| └ useAchievements                           |        0 |           1 |
| `/uni/courses` Page                         |        1 |           3 |
| `/workspace/tasks` Page                     |        0 |           3 |
| `/workspace/goals` Page                     |      tbd |         tbd |
| `/focus` Page                               |      tbd |         tbd |

### Summe pro Route

| Route              | useQuery | useMutation | Total |
| ------------------ | -------: | ----------: | ----: |
| `/today`           |     13   |           5 |    18 |
| `/uni/courses`     |      5   |           4 |     9 |
| `/workspace/tasks` |      4   |           4 |     8 |
| `/focus`           |      4   |           1 |  5+ Page |

Vor A1/A2 (nur zum Vergleich, erwartete Werte basierend auf Diff):

| Route              | useQuery | Δ vs. nachher |
| ------------------ | -------: | ------------: |
| `/today`           |       13 |         ±0 (Provider bleibt) |
| `/uni/courses`     |       10 |  −5 (LucianBubble weg)       |
| `/workspace/tasks` |        9 |  −5 (LucianBubble weg)       |
| `/focus`           |        9 |  −5 (LucianBubble weg)       |

Damit sinkt die statische Query-Observer-Menge auf Non-`/today`-Routen
um ~55 %, bevor Phase C (Fanout-Reduktion) überhaupt greift.

---

## 3. Provider-Mount-Matrix

Effektiver Provider-Tree pro Route nach A1/A2:

| Route                  | FocusTimer | PowerHotkeys | ChampionProv. | LucianBubble |
| ---------------------- | :--------: | :----------: | :-----------: | :----------: |
| `/today`               |     ✓      |      ✓       |       ✓       |      ✓       |
| `/uni/*`               |     ✓      |      ✓       |       ✓       |      —       |
| `/workspace/*`         |     ✓      |      ✓       |       ✓       |      —       |
| `/career/*`            |     ✓      |      ✓       |       ✓       |      —       |
| `/focus`               |     ✓      |      ✓       |       —       |      —       |
| `/settings`            |     ✓      |      ✓       |       —       |      —       |
| `/reflect/*`           |     ✓      |      ✓       |       —       |      —       |
| `/analytics` + `/analytics/*` | ✓   |      ✓       |       —       |      —       |

Vor Phase 48: `ChampionProvider` lief dashboardweit, `LucianBubbleProvider`
war auf allen Routen außer `/focus` gemountet.

---

## 4. Runtime-Messpunkte (manuell nachzutragen)

Für Werte, die nur im Browser ermittelbar sind (React Profiler,
Chrome DevTools Memory, Query-Observer zur Laufzeit aus `queryClient`),
ist folgende Methodik einzuhalten. Die Werte werden in der Tabelle
unten eingetragen, sobald der Flow einmal live vermessen wurde.

### 4.1 React Profiler

1. Chrome DevTools → React → Profiler → Record
2. Navigiere direkt zu `/today` (Hard-Reload, `Cmd+Shift+R`)
3. Stop Recording sobald Content sichtbar ist (Initial Render)
4. Starte erneutes Recording, klicke auf `/uni/courses` im Sidebar
5. Stop Recording nach Content sichtbar

| Messpunkt                           | Dauer (ms) |
| ----------------------------------- | ---------: |
| `/today` Initial Render             |        tbd |
| `/today` → `/uni/courses` Wechsel   |        tbd |
| `/uni/courses` → `/today` Wechsel   |        tbd |

### 4.2 Chrome Performance

1. Chrome DevTools → Performance → Record
2. Hard-Reload der Zielseite
3. Stop nach 3 Sekunden

| Messpunkt                 | Scripting (ms) | Rendering (ms) | Total (ms) |
| ------------------------- | -------------: | -------------: | ---------: |
| `/today` Cold Load        |            tbd |            tbd |        tbd |
| `/uni/courses` Cold Load  |            tbd |            tbd |        tbd |
| `/focus` Cold Load        |            tbd |            tbd |        tbd |

### 4.3 Chrome Memory (Heap Snapshots)

1. Chrome DevTools → Memory → Heap Snapshot
2. Snapshot 1: direkt nach `/today` Cold Load, idle 5 s
3. Navigation: `/today` → `/uni/courses` → `/workspace/tasks` → `/today`
4. Snapshot 2: idle 5 s nach Rückkehr zu `/today`

| Messpunkt                          | Heap (MB) |
| ---------------------------------- | --------: |
| Cold `/today`                      |       tbd |
| Nach 3 Navigations-Zyklen          |       tbd |
| Δ (Leak-Indikator)                 |       tbd |

### 4.4 Query-Observer zur Laufzeit

Schnelle Erfassung über Devtools-Konsole:

```js
window.__rqClient?.getQueryCache().getAll().length
```

(`__rqClient` ist in `components/providers/QueryProvider.tsx` zu
exposen, falls nicht vorhanden — nur für Messung, danach entfernen.)

| Route              | Query-Observer zur Laufzeit |
| ------------------ | --------------------------: |
| `/today`           |                         tbd |
| `/uni/courses`     |                         tbd |
| `/workspace/tasks` |                         tbd |
| `/focus`           |                         tbd |

Erwartet: Laufzeit-Count ≤ statischer Count aus Abschnitt 2. Eine
höhere Zahl deutet auf stale Observers hin (z. B. nicht aufgeräumte
Subscriptions bei Route-Wechseln).

---

## 5. Fazit Baseline

**Statische Verbesserung durch A1+A2 bereits messbar:**

- `/uni/courses`, `/workspace/tasks`, `/focus`, `/reflect/*`,
  `/career/*`, `/settings`, `/analytics/*` haben jetzt **keinen**
  LucianBubble-Observer mehr (zuvor je 5 inaktive Query-Subscriptions)
- `/focus`, `/settings`, `/reflect/*`, `/analytics/*` haben zusätzlich
  **keinen** Champion-Runtime mehr (zuvor dashboardweit 17 `useEffect`
  + RAF-Loop + Keyboard-Hotkeys)
- Bundle-First-Load-Zahlen bleiben unverändert — die Provider waren
  alle im gleichen Shared-Chunk; die Einsparung ist rein
  **Runtime-Overhead**, nicht Bytes.

**Offene Hebel für Phase C/D:**

1. `/today` hat immer noch 13 useQuery-Observer — großer Teil davon
   sind die 5 LucianBubble-Queries, die jeweils einen separaten
   Endpunkt treffen. Bundle-Kandidat für Phase C1.
2. `/uni/courses` First Load 205 kB — Next.js Route-Chunk 13.8 kB +
   Shared 87.8 kB + zusätzliche Chunks. Server-first Ansatz (Phase D)
   kann initiale Hydration-Last reduzieren.
3. `/today` 212 kB First Load ist die teuerste Dashboard-Route.
   Kandidat für Code-Splitting Folgephase (Phase 49?).

---

## 6. Re-Baseline

Nach Phase C und D dieses Dokument **nicht ersetzen**, sondern neue
Spalten `nach C` und `nach D` zur Tabelle in Abschnitt 1 und 2
ergänzen. Sichtbare Trendlinie statt einzelner Snapshots.
