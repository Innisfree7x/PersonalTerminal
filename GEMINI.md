# GEMINI.md - INNIS Entrypoint

Dieses Dokument ist bewusst **kein zweiter Canon**.
Es ist nur ein dünner Einstieg für neue Agenten. Wenn etwas hier und im Repo
widersprüchlich ist, gilt immer zuerst:

1. `docs/CONTEXT_CANON.md`
2. die dort gelisteten aktiven Phase-Dokumente
3. `CLAUDE.md`

## Projekt in einem Satz
**INNIS** ist ein persönliches Operating System für Studenten und Early-Career-User:
`Today`, `Trajectory`, `Career`, `University`, `Calendar`, `Settings`.

## Sofort lesen
1. `docs/CONTEXT_CANON.md`
2. danach nur die aktuell relevanten aktiven Docs für die Aufgabe

## Nicht verhandelbare Regeln
- kein Blind-Merge bei UI-Änderungen
- kein zweiter Architekturpfad neben bestehenden Flows
- keine generischen SaaS-Lösungen
- keine Passwortspeicherung für externe Systeme
- kein Drift gegen bestehende Auth-/RLS-Muster
- `type-check`, `lint` und relevante Tests sind Pflicht

## Architektur
- UI bleibt in `components/*` und `app/(dashboard)`
- Business-Logik bleibt in `lib/*`
- API-Routen validieren, autorisieren und antworten
- neue Queries nur, wenn daraus sichtbarer Produktwert entsteht

## Qualitätsmaßstab
- premium, ruhig, klar
- weniger Text, mehr Signal
- kein Admin-Look
- kein halbfertiger Nebenpfad
- erst sauber schneiden, dann bauen

## Delivery
Am Ende immer:
- betroffene Dateien
- ausgeführte Checks
- offene Risiken
