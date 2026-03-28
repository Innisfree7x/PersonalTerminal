---
name: deploy
description: Build-Validierung + Push + Vercel Deployment Check
---

Deployment-Pipeline durchführen:

1. **Pre-Flight Checks** (parallel):
   - `npm run type-check` — TypeScript-Fehler?
   - `npm run lint` — ESLint-Probleme?
   - `npm run test:unit` — Unit Tests bestanden?

2. **Build-Test**:
   - `npm run build` — Produktions-Build erfolgreich?
   - Prüfe Build-Output auf Warnungen

3. **Push**:
   - `git push` — zum Remote pushen
   - Prüfe ob Branch Protection aktiv ist

4. **Status-Report**:
   - Zusammenfassung: was deployed wird (Commit-Range)
   - Vercel Preview URL falls Feature-Branch
   - Hinweis auf CI-Pipeline Status

<important>
Nie force-push auf main. Bei Build-Fehlern: erst fixen, nicht ignorieren.
</important>
