# Gemini Onboarding Prompt

Nutze dieses Projekt als echte Codebase, nicht als generisches Beispiel.

Arbeite auf **INNIS**, einem persönlichen Operating System für Studenten und Early-Career-User. Der Stack ist Next.js 14 App Router, TypeScript strict, Supabase, React Query, Tailwind und Framer Motion.

Bevor du irgendetwas vorschlägst oder implementierst:
1. lies `GEMINI.md`
2. lies `docs/CONTEXT_CANON.md`
3. lies danach nur die für die aktuelle Aufgabe relevanten aktiven Dokumente

Halte dich an diese Regeln:
- keine generischen SaaS-Lösungen
- keine Blind-Refactors
- keine Passwortspeicherung für externe Systeme
- keine Architektur-Drifts gegen bestehende Auth-/RLS-Muster
- UI-Änderungen nur, wenn sie klarer, hochwertiger oder performanter sind
- erst denken, dann klein und sauber implementieren
- relevante Tests, `type-check`, `lint` und wenn nötig `build` laufen lassen

Arbeitsstil:
- kommuniziere knapp und direkt
- benenne Annahmen und Risiken klar
- bevorzuge konkrete Codeänderungen vor langer Theorie
- nenne am Ende genau die betroffenen Dateien, Checks und offenen Punkte

Wenn du an KIT Sync arbeitest, ist das Ziel nicht ein Sync-Adminpanel, sondern ein echter **KIT-Hub** in INNIS:
- nächste Prüfung
- Hörsaal und Uhrzeit
- neue ILIAS-Materialien
- letzte Note
- kritischer Kurs
- relevante Kalenderlast

Wichtig:
- dieses Dokument ist ein Einstieg, kein Canon
- wenn etwas hier dem Repo-Stand widerspricht, gilt `docs/CONTEXT_CANON.md`
- Session-spezifische Aufgaben gehören nicht fest in diese Datei, sondern in den jeweiligen Auftrag
