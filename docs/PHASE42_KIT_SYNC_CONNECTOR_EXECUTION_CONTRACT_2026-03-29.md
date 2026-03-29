# Phase 42 — KIT Sync Connector Execution Contract

Stand: 2026-03-29  
Status: Wave 3 implementiert

## Ziel

INNIS soll für den KIT-Studienalltag nicht mehr nur manuell gepflegt werden,
sondern CAMPUS und ILIAS gezielt in das bestehende System ziehen.

Das Produktziel ist nicht ein generischer "Uni-Importer", sondern ein
sauberer, belastbarer `KIT-first` Connector:

- CAMPUS liefert `Module`, `Noten`, `Prüfungen`, `Kalender`
- ILIAS liefert `Favoriten`, `Ankündigungen`, `Material-Metadaten`
- INNIS fusioniert diese Daten in:
  - `University`
  - `Today`
  - `Morning Briefing`
  - später optional `Trajectory` und `Strategy`

Das Kernversprechen:

> Ich muss CAMPUS und ILIAS nicht ständig separat öffnen, weil INNIS die
> relevanten KIT-Daten bereits strukturiert, priorisiert und in meinen
> Arbeitsfluss integriert zeigt.

## Produktprinzipien

### 1. Favoriten-first bei ILIAS

ILIAS wird in V1 nicht vollständig gespiegelt.

Nur die auf dem ILIAS-Dashboard sichtbaren `Favoriten` werden übernommen.
Das reduziert Rauschen und erhöht die Relevanz.

### 2. Read-only zuerst

V1 schreibt nichts zurück nach CAMPUS oder ILIAS.

INNIS liest und strukturiert Daten, aber:

- meldet keine Kurse an
- verschiebt keine ILIAS-Objekte
- verändert keine Favoriten
- bestätigt keine Workflows im Fremdsystem

### 3. Keine Passwortspeicherung

KIT-/Shibboleth-/ILIAS-Zugangsdaten werden nicht in INNIS gespeichert.

Es gibt genau zwei akzeptable Integrationspfade:

1. offizielle Feed-/Export-Mechaniken wie `WebCal`
2. lokaler, session-basierter Connector im Browser oder als lokaler Client

Nicht akzeptiert:

- Rohpasswortspeicherung in Supabase
- Server-Scraping mit hinterlegten KIT-Zugangsdaten
- fragile Login-Bots als Primärarchitektur

### 4. Struktur vor Dateiimport

Erst werden Metadaten sauber synchronisiert:

- Kurs
- Dokumenttitel
- Link
- Datum
- Typ

Erst danach wird optional echter Dateiimport gebaut.

### 5. KIT-first, intern modular

V1 ist bewusst KIT-spezifisch.
Die interne Architektur soll aber so geschnitten werden, dass später weitere
Unis als zusätzliche Connectoren möglich sind.

## Wave 1 - Implementierter Umfang

Wave 1 setzt bewusst nur die belastbare CAMPUS-WebCal-Basis um:

- Migration:
  - `docs/migrations/2026-03-29_phase42_kit_sync_wave1.sql`
- Tabellen:
  - `kit_sync_profiles`
  - `kit_sync_runs`
  - `kit_campus_events`
- API:
  - `GET /api/kit/status`
  - `POST /api/kit/webcal`
  - `POST /api/kit/sync`
  - `GET /api/cron/kit-webcal-sync`
- UI:
  - `components/features/university/KitSyncPanel.tsx`
  - Integration in `app/(dashboard)/university/page.tsx`
- Backend-Fundament:
  - verschlüsselte WebCal-Speicherung
  - Feed-Validierung vor Persistierung
  - iCal-Parsing für KIT-Events
  - Run-Historie + Statusmodell

Nicht Teil von Wave 1:

- Module
- Noten
- ILIAS-Favoriten
- Dokumentimport

Diese Waves bauen auf exakt demselben Sync- und Secret-Modell auf.

## Wave 2 - Implementierter Umfang

Wave 2 erweitert das WebCal-Fundament um den ersten `campus_connector`-Pfad:

- Migration:
  - `docs/migrations/2026-03-29_phase42_kit_sync_wave2.sql`
- Tabellen / Schema:
  - `kit_campus_modules`
  - `kit_campus_grades`
  - `kit_campus_events.source` mit `campus_webcal | campus_connector`
- API:
  - `POST /api/kit/sync` akzeptiert jetzt auch `campus_connector`
  - Payload-Limit: `500 KB`
- Backend-Fundament:
  - idempotente Upserts für Module und Noten
  - Prüfungen laufen als `campus_connector`-Events in dieselbe Event-Tabelle
  - Connector-Version wird im Profil und im Run protokolliert
  - fehlende Modulreferenzen führen zu `partial`, nicht zu stillem Datenverlust
- UI / Status:
  - `KIT Sync` zeigt jetzt Module, Noten, letzte Note und nächste Prüfung

Nicht Teil von Wave 2:

- ILIAS-Favoriten
- ILIAS-Dokumente
- echter Dateiimport
- automatische Today-/Morning-Briefing-Fusion

## Wave 3 - Implementierter Umfang

Wave 3 erweitert den bestehenden KIT-Sync um den ersten `ilias_connector`-Pfad:

- Migration:
  - `docs/migrations/2026-03-29_phase42_kit_sync_wave3.sql`
- Tabellen / Schema:
  - `kit_ilias_favorites`
  - `kit_ilias_items`
  - `POST /api/kit/sync` akzeptiert jetzt auch `ilias_connector`
- Backend-Fundament:
  - idempotente Upserts für Favoriten und Kurs-Items
  - `first_seen_at`, `last_seen_at`, `acknowledged_at` statt flachem `is_new`
  - fehlende Favoritenreferenzen führen zu `partial`, nicht zu stillem Datenverlust
  - Status-Queries degradieren bis zum SQL-Run sauber statt hart zu crashen
- UI / Status:
  - `KIT Sync` zeigt jetzt ILIAS-Favoriten, neue Items der letzten 7 Tage und das letzte ILIAS-Signal

Nicht Teil von Wave 3:

- echter Browser-Connector
- Today-/Morning-Briefing-Fusion
- Dokumentimport
- Acknowledge-/Read-State-UI

## Was genau synchronisiert werden soll

## CAMPUS

V1-Ziel:

- Studienmodule
- Notenspiegel / Noten
- Prüfungen
- Kalender-/Terminfeed

### ILIAS

V1-Ziel:

- Dashboard-Favoriten
- pro favorisiertem Kurs:
  - Kursname
  - Semester / Kontext
  - Kurs-Link
  - neue Ankündigungen
  - neue Dokument-Metadaten
  - letzte Aktivität

Nicht Teil von V1:

- alle ILIAS-Kurse außerhalb der Favoriten
- Datei-Download im ersten Schnitt
- tiefes Parsing aller Unterseiten eines Kurses

## Zielbild in INNIS

### University

Neuer KIT-Hub:

- `KIT Sync Status`
- `Letzter Sync`
- `Favorisierte ILIAS-Kurse`
- `Neue Materialien`
- `Neu eingetragene Noten`
- `Nächste Prüfungen`

### Today

Nur die wirklich relevanten Uni-Signale:

- `2 neue Dateien in OR`
- `Neue Note in Modul X`
- `Prüfung in 6 Tagen`
- `ILIAS-Ankündigung in Makroökonomie`

### Morning Briefing

Kurze, konkrete Tageszusammenfassung:

- neue Materialien
- neue Noten
- anstehende Prüfungen
- Sync-Status

### Später

- `Trajectory`: Prüfungs-/Lernblöcke aus KIT-Daten ableiten
- `Strategy`: Semester- und Prüfungsentscheidungen mit echten Daten füttern

## Architektur

## Schicht A — Offizielle Feeds

### CAMPUS WebCal

Erster sauberer Integrationspfad.

Der Nutzer hinterlegt seine persönliche CAMPUS-WebCal-URL.
INNIS importiert daraus:

- Vorlesungen
- Übungen
- Prüfungstermine, sofern im Feed enthalten

Vorteile:

- offiziell vorgesehen
- stabiler als DOM-Scraping
- kein Passwort nötig

### WebCal-URL Handling

Die CAMPUS-WebCal-URL ist technisch wie ein Bearer-Token zu behandeln.

Deshalb gelten für V1 diese Regeln:

1. Vor Persistierung:
   - URL-Schema validieren (`webcal://` oder `https://`)
   - Test-Fetch durchführen
   - Response als iCal/WebCal-Feed validieren
2. Speicherung:
   - encrypted-at-rest
   - nie vollständig im UI zurückgeben
   - im UI nur maskiert anzeigen
3. Fehler:
   - ungültiges Format
   - kein abrufbarer Feed
   - Response ist kein iCal
   werden als konkrete Setup-Fehler angezeigt, nicht als generischer
   Sync-Fehler

## Schicht B — Lokaler KIT Connector

Primärform: Browser-Extension oder Userscript.

Der Connector:

- läuft lokal im Browser des Nutzers
- nutzt die bereits aktive CAMPUS-/ILIAS-Session
- liest nur die benötigten Seiten aus
- sendet strukturierte JSON-Payloads an INNIS

Der Server sieht nie:

- Passwort
- Login-Flow
- Shibboleth-Credentials

Sonderfall für später:

- optional lokaler Desktop-Companion statt Browser-Extension

## Schicht C — INNIS Sync API

INNIS nimmt strukturierte, validierte Sync-Payloads entgegen.

Der Server ist verantwortlich für:

- Schema-Validation
- User-Isolation
- Idempotenz
- Diffing / Updates
- UI-Read-Modelle für Today / University / Briefing
- Connector-Version-Prüfung
- Rate-Limits
- Payload-Größenlimits

### Connector-Authentifizierung

Der lokale Connector authentifiziert sich in V1 über die bestehende
eingeloggte INNIS-Session des Nutzers.

Konkret:

- Browser-Connector liest das aktive INNIS-Supabase-Auth-Token
- Requests an INNIS laufen als normal authentifizierte User-Requests
- kein separater API-Key in V1

Vorteile:

- keine zweite Credential-Schicht
- klare User-Zuordnung
- weniger Secret-Management

## Security-Modell

### Harte Regeln

1. Keine KIT-/ILIAS-Passwörter im Backend
2. Keine Session-Cookies im Backend persistieren
3. Nur strukturierte Sync-Payloads akzeptieren
4. Jeder Sync strikt an `auth.uid()` gebunden
5. Sync-Runs auditierbar speichern
6. Rate-Limit auf Sync-Endpunkte
7. Payload-Größe begrenzen
8. Connector-Version serverseitig validieren

### Konsequenzen

Wenn der Connector kompromittiert wäre, ist der Blast Radius kleiner:

- es werden nur extrahierte Daten gesendet
- nicht die komplette Login-Identität

### Konkrete Limits für V1

- max. `1 Sync pro Source pro 5 Minuten pro User`
- max. Payload-Größe `500 KB`

Diese Limits gelten für:

- `campus_connector`
- `ilias_connector`

WebCal-Cron-Läufe werden separat serverseitig gesteuert.

## Datenmodell

Geplante Tabellen:

### `kit_sync_profiles`

- `id`
- `user_id`
- `campus_webcal_url`
- `campus_enabled`
- `ilias_enabled`
- `connector_version`
- `last_successful_sync_at`
- `last_sync_source`
- `created_at`
- `updated_at`

### `kit_sync_runs`

- `id`
- `user_id`
- `source` (`campus_webcal`, `campus_connector`, `ilias_connector`)
- `status` (`success`, `partial`, `error`)
- `items_written`
- `error_summary`
- `payload_version`
- `created_at`

### `kit_campus_modules`

- `id`
- `user_id`
- `external_id`
- `module_code`
- `title`
- `status`
- `semester_label`
- `credits`
- `source_updated_at`
- `created_at`
- `updated_at`

### `kit_campus_grades`

- `id`
- `user_id`
- `module_id` (FK auf `kit_campus_modules.id`)
- `external_grade_id`
- `grade_value`
- `grade_label`
- `exam_date`
- `published_at`
- `source_updated_at`
- `created_at`

### `kit_campus_events`

- `id`
- `user_id`
- `external_event_id`
- `title`
- `kind` (`lecture`, `exercise`, `exam`, `seminar`, `other`)
- `starts_at`
- `ends_at`
- `location`
- `source`
- `created_at`
- `updated_at`

### `kit_ilias_favorites`

- `id`
- `user_id`
- `external_course_id`
- `title`
- `semester_label`
- `course_url`
- `last_seen_at`
- `created_at`
- `updated_at`

### `kit_ilias_items`

- `id`
- `user_id`
- `favorite_id`
- `external_item_id`
- `item_type` (`announcement`, `document`, `task`, `link`)
- `title`
- `item_url`
- `published_at`
- `first_seen_at`
- `last_seen_at`
- `acknowledged_at`
- `content_hash`
- `created_at`
- `updated_at`

### Optional später: `kit_ilias_documents`

Erst nach stabiler Metadaten-Sync-Stufe.

## Sync-Flow

## Trigger-Modell

### WebCal

WebCal hat in V1 zwei Trigger:

1. manueller User-Trigger:
   - `Jetzt synchronisieren`
2. serverseitiger Cron-Trigger:
   - periodischer Import über INNIS

### Connector

Connector-Syncs sind event-driven:

1. manueller Sync aus INNIS
2. manueller Sync aus dem Connector
3. optional später leichte Auto-Syncs bei aktiver Session

Wichtig:

- WebCal ist serverseitig pull-basiert
- CAMPUS/ILIAS-Connector ist clientseitig push-basiert

### V1-CAMPUS

1. User hinterlegt WebCal-URL
2. INNIS importiert Feed
3. Events werden normalisiert
4. neue / geänderte Events landen in `kit_campus_events`
5. Today / University / Briefing lesen daraus

### V1-ILIAS

1. Lokaler Connector liest Dashboard-Favoriten
2. Connector besucht nur diese favorisierten Kurse
3. Connector extrahiert:
   - Kurs-Metadaten
   - neue Dokument-Metadaten
   - neue Ankündigungen
4. INNIS validiert und speichert
5. UI zeigt nur relevante neue Informationen

### V1-CAMPUS-Connector

Später nach WebCal:

1. Connector liest Module / Noten / Prüfungen
2. INNIS speichert strukturierte Entitäten
3. neue Noten und Prüfungsänderungen erzeugen Signale in `Today`

## Produkt-Waves

## Wave 1 — KIT Sync Foundation

Scope:

- `KIT Sync`-Section in `University`
- `campus_webcal_url` hinterlegen
- Feed importieren
- erste Sync-Run-Historie
- erste `GET /api/kit/status`
- erste `POST /api/kit/webcal`

Definition of Done:

- CAMPUS-Kalenderdaten erscheinen in INNIS
- Sync ist pro User isoliert
- keine Passwörter im System
- WebCal-URL wird validiert und verschlüsselt gespeichert

## Wave 2 — CAMPUS Academic Snapshot

Scope:

- Connector-Grundgerüst
- Module
- Prüfungen
- Noten
- `POST /api/kit/sync`

Definition of Done:

- Module/Noten/Prüfungen erscheinen in INNIS
- neue Noten werden erkannt
- Briefing kann Noten-/Prüfungsereignisse anzeigen

Implementiert:

- `campus_connector`-Payloads laufen über denselben Sync-Endpoint wie WebCal
- `kit_campus_modules` und `kit_campus_grades` sind owner-isolated via RLS
- `KIT Sync` in `University` zeigt den ersten Academic Snapshot
- Prüftermine werden als `campus_connector`-Events in den bestehenden Kalenderpfad geschrieben

## Wave 3 — ILIAS Favorites Sync

Scope:

- ILIAS-Favoriten vom Dashboard
- neue Ankündigungen
- neue Dokument-Metadaten

Definition of Done:

- nur Favoriten werden importiert
- neue Items sind in `University` und `Today` sichtbar
- UI ist noise-arm

Implementiert:

- `ilias_connector`-Payloads laufen über denselben Sync-Endpoint wie WebCal und CAMPUS
- `kit_ilias_favorites` und `kit_ilias_items` sind owner-isolated via RLS
- `KIT Sync` in `University` zeigt Favoriten, neue Items der letzten 7 Tage und das letzte ILIAS-Signal
- Today bleibt bewusst für Wave 5 reserviert; Wave 3 liefert dafür das Datenfundament

## Wave 4 — ILIAS Document Intelligence

Scope:

- bessere Item-Typisierung
- Deltas / "neu seit letztem Sync"
- spätere Import-Vorbereitung

Definition of Done:

- neue Dokumente klar von alten unterscheidbar
- Sync bleibt robust und nachvollziehbar

## Wave 5 — INNIS Fusion

Scope:

- Today-Integration
- Morning-Briefing-Integration
- optionale Ableitungen in `Trajectory`

Definition of Done:

- KIT-Daten fühlen sich nicht wie Fremddaten an
- sie sind Teil des echten Daily Flows

## Best Practices aus bisherigen Wellen

Diese Regeln bleiben ausdrücklich bestehen:

### 1. Kein Big-Bang

Nicht CAMPUS + ILIAS + Dokumentimport + Analytics gleichzeitig bauen.
Nur Wave für Wave.

### 2. Strikte Scope-Trennung

Ein Sync-Wave darf nicht gleichzeitig:

- Marketing
- Performance
- Sound
- unrelated UI-Polish

mitziehen.

### 3. Read-Modelle zuerst

Erst Daten stabil erfassen und anzeigen.
Danach Automationen und Ableitungen.

### 4. Deterministische Parser statt "AI drüber"

HTML/DOM-Extraktion für CAMPUS/ILIAS muss über klare Selektoren und Parser
laufen, nicht über LLM-Magie.

### 5. Fixtures + Regressionstests

Für Parser brauchen wir gespeicherte HTML-Fixtures / Beispielpayloads.
Wenn KIT das Markup ändert, müssen Tests das sichtbar brechen lassen.

### 6. Harte User-Isolation

Alle Tabellen und Sync-Endpunkte sind strikt `user_id`-gebunden.

Zusätzlich:

- alle `kit_*`-Tabellen erhalten owner-only RLS
- RLS orientiert sich an den bestehenden User-Isolation-Standards des Repos

### 7. Gute Fehlzustände

Nicht nur `Sync failed`, sondern:

- WebCal ungültig
- ILIAS-Session abgelaufen
- Connector-Version veraltet
- keine Favoriten gefunden

## Teststrategie

### Unit

- Feed-Normalisierung
- DOM-Parser auf Fixtures
- Payload-Validation
- Diff-/Idempotenzlogik
- Connector-Version-Prüfung
- WebCal-URL-Validierung

### Integration

- Sync-API schreibt richtige Tabellen
- Today/University lesen die neuen Daten korrekt
- Sync-Fehlerzustände werden sauber angezeigt
- Rate-Limit / Payload-Limit greifen korrekt

### E2E

Nicht sofort.

Erst wenn die ersten zwei Waves stabil sind.
Dann:

- WebCal hinterlegen
- Sync auslösen
- University-/Today-Resultat prüfen

## No-Gos

Diese Dinge werden in Phase 42 ausdrücklich nicht gemacht:

- Passwort im Backend speichern
- Server-seitigen Shibboleth-Bot bauen
- komplettes ILIAS spiegeln
- Binärdateiimport im ersten Schnitt
- Cross-University-Abstraktion in V1 überoptimieren

## API Surface für V1

### `GET /api/kit/status`

Liefert:

- aktiver Sync-Status
- letzte erfolgreichen Syncs
- Quellenstatus
- Fehlerstatus

### `POST /api/kit/webcal`

Nimmt:

- WebCal-URL

Verantwortlich für:

- Format-Check
- Test-Fetch
- iCal-Validierung
- verschlüsselte Persistierung

### `POST /api/kit/sync`

Nimmt:

- Connector-Payloads aus CAMPUS/ILIAS

Verantwortlich für:

- Auth
- Schema-Validation
- Version-Check
- Rate-Limit
- Upserts / Diffing

### `POST /api/cron/kit-webcal-sync`

Verantwortlich für:

- periodischen Import aller aktiven WebCal-Profile
- Sync-Run-Logging
- Fehlerbehandlung pro User

## Calendar-Fusion-Entscheidung

KIT-CAMPUS-Events werden nicht in einem separaten Kalender-Silo gehalten.

Sie werden in das bestehende Kalender-Erlebnis integriert und als eigene
Quelle kenntlich gemacht:

- `Google`
- `KIT CAMPUS`
- später optional `ILIAS`

Das Ziel ist ein gemeinsamer Kalender mit klarer Source-Kennzeichnung, nicht
ein weiterer isolierter Unterbereich.

## Connector-Versionierung

`connector_version` ist nicht nur Metadatenfeld, sondern Gate.

Wenn der Connector zu alt ist:

- Sync wird serverseitig abgelehnt
- Response enthält einen klaren `upgrade_required`-Fehler
- INNIS zeigt einen sichtbaren Hinweis:
  - `Connector-Update erforderlich`

Kein stilles Degradieren.

## Observability

Jeder Sync-Run soll mindestens diese Felder auditierbar machen:

- Quelle
- Dauer
- Items gelesen
- Items geschrieben
- Parser-/Connector-Version
- Fehlerklasse
- User-bezogener Status

Das ist nötig, damit Parser-/Markup-Brüche schnell sichtbar werden.

## Offene Risiken

1. KIT-Markup kann sich ändern
2. ILIAS-Items können uneinheitlich strukturiert sein
3. WebCal enthält evtl. nicht alle akademisch wichtigen Events
4. Connector-Verteilung (Extension/Userscript) ist ein eigenes UX-Thema

Diese Risiken sind akzeptabel, solange:

- Sync-Runs sichtbar sind
- Parser getestet sind
- Fallbacks sauber sind

## Abnahmebedingungen für Start der Implementierung

Wir starten die Umsetzung, wenn diese Punkte akzeptiert sind:

1. `KIT-first` statt generischer Uni-Architektur
2. `Favoriten-first` bei ILIAS
3. `Read-only`
4. `Kein Passwortspeichern`
5. `WebCal zuerst`
6. `Dokument-Metadaten vor echtem Dateiimport`

## Nächster direkter Schritt

Nach Wave 3 folgt:

1. lokales Connector-Interface für ILIAS-Dashboard-Favoriten
2. echte HTML-Parser für Favoriten / Ankündigungen / Dokument-Metadaten
3. Today-/Morning-Briefing-Fusion für KIT- und ILIAS-Signale
4. danach erst Dokumentimport / Wave 4
