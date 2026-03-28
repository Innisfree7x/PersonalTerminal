---
name: commit
description: Standardisierter Commit-Flow mit Quality Gates
---

Führe einen sauberen Commit durch:

1. `git status` — zeige alle Änderungen
2. `git diff --cached` und `git diff` — analysiere was committed wird
3. `git log --oneline -5` — prüfe den bisherigen Commit-Style
4. Erstelle eine präzise Commit-Message:
   - Fokus auf das "Warum", nicht das "Was"
   - 1-2 Sätze, keine generischen Beschreibungen
   - Kein "update" oder "fix" ohne Kontext
5. Stage nur relevante Dateien (kein `git add .`)
6. Warnung bei sensiblen Dateien (.env, credentials)
7. Commit mit Co-Authored-By Footer
8. `git status` zur Bestätigung nach dem Commit

<important>
Niemals --no-verify oder --amend verwenden, es sei denn explizit angefragt.
Wenn der Pre-Commit-Hook fehlschlägt: Problem fixen und NEUEN Commit erstellen.
</important>
