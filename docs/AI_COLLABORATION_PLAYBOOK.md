# AI Collaboration Playbook
> Learnings aus dem INNIS-Projekt — wie man Claude + Codex effektiv für High-Quality Code einsetzt.

---

## Die wichtigste Erkenntnis

**Claude denkt, Codex baut, Claude reviewed.**

Das ist die Arbeitsteilung die funktioniert. Wenn du sie umdrehst oder vermischst, verlierst du Zeit und Qualität.

---

## 1. Projekt aufsetzen — bevor du eine Zeile Code schreibst

### CLAUDE.md anlegen (Tag 1, zwingend)
Eine Datei im Root die Claude immer mitliest:
```
- Tech Stack (Framework, DB, State-Management)
- Architektur-Patterns (wie fließen Daten, welche Konventionen)
- Wichtigste Dateipfade
- Commands (type-check, lint, test)
- Was NICHT getan werden soll
```
→ Ohne diese Datei muss du Claude bei jeder Session neu briefen. Mit ihr startet jede Session sofort produktiv.

### Supabase RLS von Anfang an
Entscheide in Phase 1: `user_id`-Column in jeder Tabelle + RLS-Policy `auth.uid() = user_id`.
Das nachträglich einzubauen ist schmerzhaft. Wir hatten in INNIS keine user_id-Columns (RLS war auf App-Ebene) — das ist OK aber eine frühe Entscheidung die du bewusst treffen musst.

### TypeScript strict mode sofort
```json
"strict": true,
"exactOptionalPropertyTypes": true
```
Macht Codex-Output zuverlässiger weil Type-Fehler früh auffallen.

---

## 2. Phasen-Struktur

### Was eine gute Phase hat
```markdown
# Phase X — [Name]

## Ziel
Ein Satz was diese Phase liefert.

## Codex macht
- [ ] Konkreter Task mit Dateipfad
- [ ] Konkreter Task mit Dateipfad

## Claude macht
- [ ] Konkreter Task mit Dateipfad
- [ ] Konkreter Task mit Dateipfad

## Definition of Done
- type-check clean
- [konkrete Kriterien]
```

### Phasen klein halten
Eine Phase = ein klar abgrenzbares Feature. Wenn du mehr als 5 Codex-Tasks in einer Phase hast, teile sie auf. Große Phasen führen dazu dass Codex Entscheidungen trifft die du nicht reviewed hast.

### Docs vor Code
Schreib die Phase-Dokumentation zuerst (Claude hilft dabei). Erst wenn der Plan klar ist — Codex loslassen.

---

## 3. Claude optimal nutzen

### Wofür Claude stark ist
- **Architektur-Entscheidungen** — Tradeoffs erklären, Ansätze vergleichen
- **Reine Logik-Module** — Funktionen die kein Framework kennen müssen (`lib/lucian/hints.ts`, Email-Templates)
- **Type-System-Design** — Interfaces, generische Typen, strenge Input-Typen
- **Code-Reviews** — Codex-Output auf Korrektheit prüfen (besonders: branding, i18n, query keys)
- **Spec schreiben** — KPI-Definitionen, SQL-Queries, Funnel-Logik dokumentieren
- **Copy & UX-Text** — alle deutschen Strings, Error-Messages, Email-Copy

### Wie du Claude briefst
```
❌ "Mach die Analytics-Seite besser"
✅ "analytics/page.tsx: refetchOnWindowFocus ist false, dadurch aktualisieren sich
   die Daten nicht wenn ich vom Focus-Timer zurückkomme. Setz es auf true und
   reduziere staleTime auf 30s."
```
Je konkreter das Problem, desto präziser die Lösung.

### Claude als Reviewer einsetzen
Nach jeder Codex-Phase: "Schau ob Codex alles richtig implementiert hat."
Claude prüft systematisch auf:
- Falsches Branding (alte Namen, falsche Keys)
- Englische Strings die deutsch sein sollten
- Query-Keys die nicht mit anderen Komponenten übereinstimmen
- Type-Fehler die der Compiler nicht fängt

---

## 4. Codex optimal nutzen

### Wofür Codex stark ist
- API-Routes (CRUD, Auth-Middleware)
- Datenbank-Migrations und Schema-Änderungen
- Komponenten nach festem Pattern (Form-Modal, List-Page)
- Cron-Jobs, Webhooks, externe Integrationen (Resend, etc.)
- Tests schreiben nach Spezifikation

### Codex-Tasks formulieren
```
❌ "Implementiere Email-Notifications"
✅  "Erstelle app/api/cron/deadline-reminders/route.ts:
    - Liest alle User aus Supabase die email_notifications: true haben
    - Prüft ob eine Prüfung in 14/7/3/1/0 Tagen ist
    - Ruft buildDeadlineReminderEmail() aus lib/email/templates.ts auf
    - Sendet via sendEmail() aus lib/email/resend.ts
    - Auth: prüfe CRON_SECRET Header
    Input-Typen: siehe lib/email/templates.ts -> DeadlineReminderInput"
```

### Codex reviewed man selbst nicht
Codex verifiziert nicht ob sein Output konsistent mit dem Rest der Codebase ist. Das machst du (mit Claude).

---

## 5. Was wir in INNIS gelernt haben

### Was gut funktioniert hat
- **Phase-Docs mit Claude/Codex-Split** — klare Verantwortlichkeiten, keine Überschneidungen
- **Claude schreibt die "Brain"-Module** — `getLucianHint()`, Email-Templates, KPI-Specs — Codex verdrahtet nur
- **Type-check nach jeder Phase** — `npm run type-check` fängt Interface-Mismatches sofort
- **Claude als Qualitäts-Gate** — nach jeder Codex-Phase einmal draufschauen lassen

### Was wir falsch gemacht haben
- **Phasen zu groß** — Phase 10 war zu viel auf einmal, Codex hat Details übersehen (login-Seite englisch, `prism_`-Keys)
- **Kein CLAUDE.md von Anfang an** — mussten Kontext immer wieder neu erklären
- **Zu früh auf Infrastruktur** — SLO/Error-Budget in Phase 11 war prematur für 0 User

### Konkrete Bugs die Claude gefunden hat (die Codex gebaut hatte)
- `prism_demo_ids` statt `innis_demo_ids` in localStorage
- Login-Seite komplett auf Englisch obwohl alles andere Deutsch
- E2E-Test nutzte `/sign in/i` obwohl Button-Text "Anmelden" war
- `PowerHotkeysProvider` hatte anderen Query-Key als `today/page.tsx` → doppelter API-Call

---

## 6. Checkliste für neue Projekte

**Tag 1:**
- [ ] `CLAUDE.md` anlegen (Tech Stack, Patterns, Commands)
- [ ] TypeScript strict mode an
- [ ] Supabase RLS-Strategie entscheiden (user_id-Column oder App-Level)
- [ ] Phase 1 Dokument schreiben (Claude hilft)

**Pro Phase:**
- [ ] Phase-Doc mit klarem Claude/Codex-Split
- [ ] Claude schreibt Logik-Module und Types
- [ ] Codex implementiert nach Spec
- [ ] Claude reviewed Codex-Output
- [ ] `npm run type-check` — muss clean sein

**Vor dem Launch:**
- [ ] Claude Full-Audit: Branding, i18n, Security, Query-Keys
- [ ] E2E-Tests für kritische Flows
- [ ] Selbst intensiv benutzen vor ersten Usern

---

## 7. Prompts die immer funktionieren

```
"Lies dir [PHASE-DOC] durch und erledige deinen Teil"
→ Gibt Kontext, klare Erwartung, Claude weiß was Codex macht

"Schau ob Codex alles richtig implementiert hat"
→ Löst systematischen Review-Pass aus

"Lies [FILE] und erkläre mir was fehlt / was falsch ist"
→ Besser als vage Qualitätsfragen

"Wir haben [PROBLEM]. Kannst du mich kurz fragen was du wissen musst?"
→ Claude klärt Ambiguität bevor er loslegt — spart Iterationen
```

---

*Erstellt nach INNIS — Phase 1 bis Phase 11, ~3 Monate Entwicklung.*
