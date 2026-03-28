---
name: fix-tests
description: Test-Failures analysieren und fixen
---

Analysiere und fixe fehlschlagende Tests:

1. **Identifiziere das Problem**:
   - `npm run test:unit` — welche Tests schlagen fehl?
   - Lies die Fehlermeldung genau — was wird erwartet vs. was kommt?

2. **Kategorisiere den Fehler**:
   - **Test ist veraltet** — Code hat sich geändert, Test nicht angepasst → Test updaten
   - **Code-Bug** — Test deckt einen echten Fehler auf → Code fixen
   - **Mock-Problem** — Mock reflektiert nicht die aktuelle Implementierung → Mock updaten
   - **Flaky Test** — Race Condition oder Timing-Issue → Test stabilisieren

3. **Fix anwenden**:
   - Minimalen Fix bevorzugen — nicht den ganzen Test umschreiben
   - Bei Code-Bugs: erst den Bug fixen, dann Test verifizieren
   - Bei Mock-Updates: prüfen ob andere Tests denselben Mock nutzen

4. **Verifizieren**:
   - Betroffenen Test einzeln laufen lassen
   - Dann `npm run test:unit` komplett
   - Sicherstellen dass der Fix keine anderen Tests bricht

<important>
Nie einen Test löschen oder skippen um ihn "grün" zu machen.
Wenn ein Test einen echten Bug aufdeckt: Code fixen, nicht den Test.
</important>
