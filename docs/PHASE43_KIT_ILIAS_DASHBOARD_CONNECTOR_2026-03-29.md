# Phase 43 — KIT ILIAS Dashboard Connector

Stand: 2026-03-29

## Ziel

Der erste echte lokale ILIAS-Testpfad soll ohne Passwortspeicherung und ohne
Server-Scraping funktionieren:

- Favoriten direkt aus dem ILIAS-Dashboard exportieren
- Export in INNIS importieren
- Favoriten im bestehenden `KIT Sync` sichtbar machen

Noch bewusst nicht Teil dieses Schnitts:

- Kursseiten-Crawling
- Dokument-Metadaten pro Kurs
- Ankündigungs-Deep-Parsing
- Dateiimport

## Umgesetzt

- statischer lokaler Exporter:
  - `public/connectors/kit-ilias-dashboard-exporter.js`
- Parser-/Validierungslogik:
  - `lib/kit-sync/iliasDashboardExport.ts`
- Import-Flow im UI:
  - `components/features/university/KitSyncPanel.tsx`
- Tests:
  - `tests/unit/kit-ilias-dashboard-export.test.ts`

## Produktverhalten

Der Nutzer kann jetzt:

1. das Export-Skript in INNIS kopieren
2. es im ILIAS-Dashboard lokal im Browser ausführen
3. die JSON-Datei oder Clipboard-Payload direkt in INNIS importieren

Der Import nutzt denselben abgesicherten `ilias_connector`-Pfad wie Wave 3.

## Sicherheitsmodell

- keine Passwortspeicherung
- kein Session-Forwarding
- keine Cross-Origin-Logik vom ILIAS-Origin direkt in INNIS
- nur lokaler Export -> manuell importierter strukturierter JSON-Payload

## Nächster Schritt

Die nächste Welle ist erst dann sinnvoll:

1. wenn der Dashboard-Favoriten-Export stabil getestet ist
2. dann Kursseiten-/Dokument-Intelligence pro Favorit
3. danach Today-/Morning-Briefing-Fusion
