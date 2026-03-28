---
name: review
description: Code-Review vor Merge — Qualität sicherstellen
---

Führe ein gründliches Code-Review der aktuellen Änderungen durch:

1. `git diff main...HEAD` — alle Änderungen seit Branch-Abzweigung
2. Prüfe auf:
   - **Security**: SQL Injection, XSS, Command Injection, OWASP Top 10
   - **TypeScript**: Strikte Typisierung, keine `any`, keine `as` Casts ohne Grund
   - **Architecture**: Richtige Layer-Zuordnung (UI → API → lib → data)
   - **Performance**: Unnötige Re-Renders, fehlende useMemo/useCallback, N+1 Queries
   - **Error Handling**: Fehlt Fehlerbehandlung? Blockiert ein Fehler die ganze Seite?
   - **Tests**: Gibt es Tests für neue Logik? Sind bestehende Tests noch korrekt?
3. Gib ein Rating:
   - **Ship it** — Keine Probleme gefunden
   - **Nits** — Kleine Verbesserungsvorschläge, nicht blockierend
   - **Blocker** — Muss gefixt werden vor dem Merge
4. Liste jedes Finding mit Datei:Zeile und Begründung

<important>
Kein "sieht gut aus" ohne echte Analyse. Jede Datei muss gelesen werden.
Bei UI-Änderungen: darauf hinweisen dass Browser-Check nötig ist.
</important>
