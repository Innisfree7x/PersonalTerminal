# Phase 47 — V2 Spaces, Room, Achievements

Datum: 2026-04-04
Status: Reviewt im lokalen Worktree; Merge- und Kanonisierungskandidat, noch nicht als deployter Main-Stand behaupten

## Zweck
Diese Phase dokumentiert den realen V2-Stand, der bereits im Code verdrahtet ist, aber bisher nicht sauber im Canon gespiegelt wurde. Fokus ist kein neuer Scope, sondern ein ehrlicher Review-Snapshot eines bereits existierenden Produktzustands:

- neue Space-IA
- Today als Daily Loop mit Room + Ritual + Achievements
- erweiterte Settings fuer Sound, Room und Lucian
- neue V2-Risiken, die bei weiteren Änderungen beachtet werden muessen

## Review-Fazit
Die V2-Welle ist produktseitig echt und kein Konzept-Branch mehr. Auf dem aktuellen lokalen Worktree ist sie konsistent verdrahtet und als Review-Kandidat nachvollziehbar, aber noch nicht automatisch als deployter Hauptstand zu behandeln:

- neue Space-Navigation ist live
- Today ist ein Daily-Operating-Surface mit Room und Ritual
- Achievements, Room-Styles, Sound-Packs und Lucian-Outfits sind im UI verdrahtet
- Settings sind zu einem echten Control Center geworden

Der Qualitätszustand ist brauchbar, aber nicht folgenlos:

- die Produktlogik ist klar stärker geworden
- die Struktur ist an mehreren Stellen empfindlicher geworden
- Canon, Agent-Kontext und Storage-Disziplin waren hinter dem Code zurück

## Validierungsstand dieses Review-Snapshots
- `npm run type-check` grün
- `npm run lint` grün

Dieser Stand ist damit als lokaler V2-Kandidat technisch plausibel. Er ist jedoch erst dann volle Canon-/Deploy-Wahrheit, wenn der gesamte Block sauber gemerged, gebaut und produktseitig explizit freigegeben wurde.

## Im lokalen Worktree verdrahtet und reviewt

### 1. Space-IA statt flacher Dashboard-Navigation
Die Produktstruktur ist jetzt in Spaces organisiert.

- `Today`
  - `/today`
- `Workspace`
  - `/workspace/tasks`
  - `/workspace/goals`
  - `/workspace/calendar`
- `Uni`
  - `/uni/courses`
  - `/uni/grades`
  - `/uni/sync`
- `Career`
  - `/career/applications`
  - `/career/strategy`
  - `/career/trajectory`
- `Reflect`
  - `/reflect/analytics`
  - `/reflect/momentum`

Die Space-Subnavigation ist live ueber `components/layout/SpaceTabBar.tsx`.
Legacy-Routen wie `/calendar`, `/trajectory`, `/university`, `/analytics` sind Redirects und duerfen nicht mehr als Primaerpfade dokumentiert werden.

### 2. Today ist kein Widget-Dashboard mehr, sondern Daily Loop
`app/(dashboard)/today/page.tsx` ist deutlich weiter als der vorherige Dashboard-Stand.

Live verdrahtet:
- `LucianRoom`
- `MorningRitual`
- `AchievementUnlockOverlay`
- Trajectory Morning Briefing
- Momentum-/Streak-/KIT-Signale
- Sound-Events fuer Daily-State-Übergänge

Today ist damit der zentrale tägliche Einstieg, nicht nur eine Task-Liste.

Zusätzlich gilt:
- `Today` ist jetzt der Primärort für den täglichen Check-in
- Room-State und Ritual sind keine kosmetischen Add-ons mehr
- neue Daily-Features muessen von diesem Einstieg aus gedacht werden, nicht an ihm vorbei

### 3. Achievements sind live
Achievements sind live ueber:

- `app/api/achievements/route.ts`
- `lib/achievements/registry.ts`
- `lib/achievements/checker.ts`
- `lib/hooks/useAchievements.ts`

Aktuell definierte Achievement-Gruppen:
- erste Task
- Wochen-/Monats-/100er-Streak
- erstes/fuenf bestandenes Module
- erste Fokusstunde
- gruener Trajectory-Zustand

### 4. Room-System ist live
Das Room-System ist keine Konzeptdatei mehr, sondern Teil des Produkts.

Live relevant:
- `components/features/room/LucianRoom.tsx`
- `components/features/room/MorningRitual.tsx`
- `components/features/room/AchievementUnlockOverlay.tsx`
- `lib/room/roomState.ts`

Der Room-State wird derzeit aus:
- Momentum
- Streak
- Today-Progress
- bestandenen Modulen

abgeleitet.

Room-Items werden aktuell praktisch achievement-getrieben freigeschaltet. Ein separates, vollständig ausgenutztes Inventory-System ist noch nicht aktiv.

### 5. Settings wurden zu einem echten V2-Control-Center erweitert
`app/(dashboard)/settings/page.tsx` lädt jetzt dynamisch:

- `AppearanceSettingsSection`
- `SoundSettingsSection`
- `RoomSettingsSection`
- `LucianSettingsSection`
- `ChampionSettingsSection`

Live verdrahtet:
- Room Styles (`cozy`, `minimal`, `neon`, `library`)
- Lucian Outfits mit Achievement-Locks
- Sound Packs (`default`, `lofi`, `nature`, `silent`)
- Notification Tone + Sound Preview

Konsequenz:
- neue Produkt-Prefs duerfen nicht mehr als verstreute Einzelflags gedacht werden
- Settings sind jetzt Teil der Produktarchitektur, nicht nur ein Sammelbecken

## Reviewte V2-Realitaet dieses Worktree-Kandidaten

### Primäre Navigation
- `Today`
- `Workspace`
- `Uni`
- `Career`
- `Reflect`
- `Focus`

### Live V2-Surfaces
- `Today` als Daily Loop
- `LucianRoom`
- `MorningRitual`
- `AchievementUnlockOverlay`
- `RoomSettingsSection`
- `LucianSettingsSection`
- `SoundSettingsSection`
- `SpaceTabBar`

### Nicht mehr als Primärmodell dokumentieren
- flache alte Dashboard-Routen wie `/calendar`, `/trajectory`, `/university`, `/analytics`
- Room als rein dekoratives Element
- Settings als kleine Nebenfläche

## Wichtige Review-Findings

### A. Wirklich live
Diese Bereiche sind nicht mehr nur vorbereitet, sondern produktiv im UI:

- SpaceTabBar + neue Routen
- Today Room / Morning Ritual / Achievements
- Room/Lucian/Sound-Settings
- neue Command-Palette-Routen auf die Space-IA

### B. Teilweise vorbereitet, aber noch nicht voll genutzt
Die Migration `docs/migrations/2026-04-03_achievements_and_room_items.sql` erstellt:

- `user_achievements`
- `user_room_items`

Aktuell ist jedoch nur `user_achievements` sichtbar im aktiven Flow verankert.
`user_room_items` ist als Datenmodell vorhanden, aber der Room rendert derzeit faktisch achievement-getriebene Unlocks statt echte equip-/inventory-Logik.

Konsequenz:
- `user_room_items` nicht als voll genutzte Kernfunktion dokumentieren
- bei weiterer Room-Arbeit zuerst explizit entscheiden: inventory-based oder achievement-derived
- solange diese Entscheidung nicht umgesetzt ist, bleibt `user_achievements` die echte Produktquelle fuer Unlocks

### C. Storage-Key-Disziplin ist hier noch uneinheitlich
Es gibt bereits eine zentrale Registry in `lib/storage/keys.ts`, aber die neuen V2-Hooks nutzen teils noch direkte lokale Keys:

- `innis:room-style:v1`
- `innis:lucian-outfit:v1`
- `innis:sound-settings:v1`

Das ist kein Blocker, aber ein echter Drift-Punkt. Neue Persistenz fuer Room/Lucian/Sound soll kuenftig zuerst ueber `lib/storage/keys.ts` laufen.

### D. V2 ist produktseitig stark, strukturell aber empfindlicher geworden
Große Risikoflächen bleiben:

- `app/(dashboard)/today/page.tsx`
- `components/features/university/KitSyncPanel.tsx`
- `lib/dashboard/queries.ts`
- `components/providers/ChampionProvider.tsx`

Das ist nicht chaotisch, aber jede neue Wave muss dort bewusst kleine, testbare Schnitte machen.

### E. Agent-Kontext war hinter dem Code
`docs/CONTEXT_CANON.md` und `CLAUDE.md` beschrieben vor diesem Review noch den KIT-/Phase-45-Stand als oberste Wahrheit. Das war faktisch falsch, weil die live verdrahtete V2-Welle mit Spaces, Room und Achievements dort nicht gespiegelt war.

Konsequenz:
- nach jeder größeren V2-Welle muessen Canon und Agent-Kontext im selben Turn angehoben werden
- V2-Surfaces duerfen nicht erst Wochen später dokumentiert werden

### F. Achievements-Mutation ist noch unter API-Standard
`app/api/achievements/route.ts` ist funktional brauchbar, liegt aber unter dem aktuellen API-Qualitätsstandard:

- keine explizite CSRF-Absicherung im Mutationspfad
- keine zentrale Schema-Validierung
- kein Rate-Limit
- kein zentrales Error-Handling ueber den ueblichen Server-Error-Pfad

Konsequenz:
- Achievements derzeit nicht als voll gehaerteten High-Traffic-Mutationspfad behandeln
- vor echter Kanonisierung die Mutation an den ueblichen API-Standard angleichen

### G. Room-/Lucian-Settings haben Copy-/i18n-Drift
Die neuen Settings-Surfaces sind produktseitig sinnvoll, tragen aber aktuell direkte Hardcoded-Copy in den Komponenten:

- `components/features/settings/RoomSettingsSection.tsx`
- `components/features/settings/LucianSettingsSection.tsx`

Das ist kein Launch-Blocker, aber ein echter Drift-Punkt gegen den sonst konsistenteren Produkt-Copy-Ansatz.

## Verbindliche Regeln ab diesem Review-Stand

1. Neue Dokumentation behandelt die Space-IA als Primärnavigation.
2. `Today` ist Daily Operating Surface, nicht generisches Dashboard.
3. `Room`, `Achievements`, `Lucian Outfits`, `Sound Packs` gelten als live Produktfläche.
4. `user_room_items` wird nicht als voll ausgenutzte Inventory-Engine behauptet, solange Equip-State nicht im aktiven Flow steckt.
5. Neue Persistenz-Keys fuer V2 werden zuerst in `lib/storage/keys.ts` registriert.
6. Room-/Achievement-Arbeit darf keine zweite Wahrheit neben `useAchievements` und dem aktiven Today-Flow erzeugen.
7. Ein lokal reviewter V2-Block darf nicht als deployter `main`-Stand beschrieben werden, solange Merge-/Build-/Freigabeschritt fehlt.

## Nächste sinnvolle Produktisierung

1. Room-State weiter von einem dekorativen System zu einem echten Progress-System ziehen
2. Achievement- und Room-Inventory konsolidieren
3. `Today` in kleinere, testbare Surfaces zerlegen
4. neue Space-IA auch in Docs, Marketing und QA-Flows konsequent spiegeln
5. Storage-Key-Registry fuer Room/Lucian/Sound auf denselben Standard wie Theme/Focus bringen
