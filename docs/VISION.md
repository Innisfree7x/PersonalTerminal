# INNIS — Vision: Das tägliche Betriebssystem

Status: Aktives Referenzdokument (Funktionsvision)
Zuletzt aktualisiert: 2026-06-02
Scope: Wie sich INNIS für **Viet selbst** jeden Tag anfühlt und nutzt.

> **Abgrenzung:** Dieses Dokument beschreibt das *persönliche Daily Operating System*
> (täglicher Loop, Accountability, Risikoampel, Lebensbereiche).
> Die *Markt- und Produktpositionierung* (High-End-Identität, Marketing, „Kollisionen
> im Karriereplan") steht in [`NEXT_LEVEL_VISION.md`](./NEXT_LEVEL_VISION.md).
> Beide ergänzen sich — dieses hier ist nach innen gerichtet, das andere nach außen.

---

## Der Nordstern (ein Satz)

> **Ein Entscheidungssystem, das mich morgens auf Kurs setzt und abends ehrlich
> abrechnet — getragen von Lucian als warmem Accountability-Partner.**

Kein hübsches Dashboard zum Bewundern. Ein Werkzeug, das jeden Tag in 60 Sekunden
vier Fragen beantwortet:

1. **Was ist mein aktueller Stand?**
2. **Was ist heute wichtig?**
3. **Wo verliere ich die Kontrolle?**
4. **Was ist der nächste beste Schritt?**

---

## Das härteste Ziel: Easy to use + jeden Tag draufschauen

Alles andere ordnet sich diesem Ziel unter. Daraus folgen vier nicht verhandelbare
Prinzipien:

1. **Auto zuerst.** Was automatisch kommen kann (Kalender, KIT-Module, Noten,
   Deadlines, Fokus-Minuten), wird *nie* manuell eingegeben.
2. **Max. 1 Tap pro Eingabe.** Risiko = Slider, Clean = Knopf, Gym = Häkchen.
   Kein Formular für das Tägliche.
3. **Output ist eine Entscheidung, kein Report.** Die App sagt
   *„Nächster Schritt: 25 Min OR starten"* — nicht *„hier sind 12 Charts"*.
4. **Nie leer.** Auch ohne Eingabe immer eine Empfehlung.

> **Die zentrale Gefahr:** Viele Module = viele Dinge täglich zu pflegen = nach
> 5 Tagen wird die App nicht mehr geöffnet. Deshalb ist die Vision **ein täglicher
> Loop**, nicht neun gleichwertige Tracker. Die Module sind nur die Datenquellen
> dahinter.

---

## Das Herzstück: Der Daily Loop

Zwei feste Termine mit Lucian pro Tag. Beide < 60 Sekunden.

```text
🌅 MORGEN-BRIEFING (Commitment)        🌙 ABEND-BRIEFING (Abrechnung)
─────────────────────────────         ──────────────────────────────
Lucian zeigt die Lage:                 Lucian rechnet ab:
 • Risikoampel                          „Heute früh wolltest du:
 • Kalender / freie Slots                → OR Übungsblatt, 90 Min"
 • Clean-Streak

Du committest dich:                     Erledigt?  [ Ja ] [ Nein ]
 „Heute: OR 90 Min, Gym 18:30"                 ↓
        ↓                               bei Nein: kurz — warum?
 festgenagelt als Versprechen           Clean? Gym? Risiko? → Bilanz steht
        ↓                                       ↓
 „Nächster Schritt: OR, 25 Min"         Streaks + Erfüllungsrate aktualisiert
```

### Zwei Ebenen pro Check-in

| Ebene | Was | Aufwand | Speist |
|-------|-----|---------|--------|
| **Schnell** (Pflicht) | Slider + Taps: Risiko, Clean, Gym, Energie | 30 Sek | die **Risikoampel** (Zahlen) |
| **Tief** (optional) | Freitext: „Was beschäftigt dich? Was lief gut?" | nach Lust | die **KI-Analyse** (Kontext) |

Wer wenig Zeit hat, tappt 30 Sekunden und ist raus. Wer reflektieren will, schreibt —
und bekommt dafür einen reicheren Wochenreport. **Mehr reinstecken = mehr rausbekommen.
Niemand wird gezwungen.**

### Warum morgens ≠ abends (das ist das Gold)

Das Morgen-Briefing erfasst die **Intention**, das Abend-Briefing die **Realität**.
Ihr Kontrast ist das, was später kein Chart, sondern nur die KI liefern kann:

> *„An 4 von 7 Tagen wolltest du morgens OR machen — an 3 ist es nicht passiert,
> immer nachmittags. An genau diesen Tagen war dein Gambling-Risiko am höchsten.
> Muster: unstrukturierte Nachmittage sind dein Trigger."*

---

## Die Risikoampel

Vier Lebensbereiche, unterschiedlich gespeist — **Studium läuft komplett automatisch.**

| Domain | Wie die Ampel rechnet | Quelle |
|--------|----------------------|--------|
| 🎓 **Studium** | `Tage bis Prüfung × Fortschritt`. Wenig Zeit + wenig Fortschritt = 🔴 | **100 % automatisch** — KIT-Module + Prüfungsdaten + `exercise_progress`. Nutzt die bestehende **Trajectory-Engine** (backward planning + risk thresholds) |
| 💰 **Finance** | Clean-Streak + heutiges Self-Rating. V2: Wochenbudget überschritten? | **Halb manuell** — Clean + Risiko 1–10 aus Check-in |
| 💪 **Körper** | Gym-Einheiten/Woche (Ziel vs. ist) + Schlaf grob | **Manuell, minimal** — Häkchen + Slider |
| 🎯 **Disziplin** | *Meta:* abgeleitet aus den anderen + „heute getan, was geplant?" | abgeleitet, kein eigener Input |

**Der „nächste Schritt" entsteht aus: rötester Ampel + nächstem freien Kalender-Slot.**
Das ist die Verbindung, die aus Tracking ein Entscheidungssystem macht.

---

## Accountability — das verbindende Prinzip

Der Unterschied zwischen einem Journal (schreibst rein, niemand schaut hin) und einem
System, das dich beim Wort nimmt.

**Drei Mechaniken:**

1. **Erfüllungsrate sichtbar** — „diese Woche: 3 von 7 Commitments gehalten." Ehrlich,
   nicht schöngerechnet.
2. **Streaks, die wirklich brechen** — Clean-Streak, Gym-Streak, „Commitment gehalten".
   Nicht-Tun hat eine sichtbare Folge.
3. **Lückenlosigkeit** — ausgelassene Tage sind sichtbar. Das Tool tut nicht so, als
   wäre nichts gewesen.

**Regel: Commitments müssen überprüfbar sein.** „Ich will lernen" ist nicht accountable.
„OR Übungsblatt 1, 90 Min" ist abends mit Ja/Nein beantwortbar. Morgen-Commitments werden
an konkrete Module/Tasks gekoppelt.

### Lucian = der Accountability-Partner

Das gibt der Companion-/Raum-Arbeit endlich einen funktionalen Sinn statt nur Deko:

- **Morgens:** *„Was machst du heute? Worauf committest du dich?"*
- **Abends:** *„Du wolltest OR machen — hast du's getan?"*
- **Sonntags:** der ehrliche Coach, der die Muster benennt.

**Ton: warm-motivierend.** Klar und ehrlich, aber aufbauend — feiert kleine Siege,
holt dich freundlich zurück auf Kurs. Kein Moralisieren, kein kalter Druck.
Accountability durch Beziehung, nicht durch Härte. (Härte vertreibt — und das Ziel
ist, dass man jeden Tag *gern* öffnet.)

---

## Die Krönung: KI-Wochenreport (Sonntag)

> **Kommt drauf, wenn der Kern steht — kein Blocker.** Der tägliche Loop (Ampel,
> Streaks, Briefings) funktioniert vollständig ohne KI. Die KI ist die Verdichtung
> obendrauf, sobald genug Wochen-Daten gesammelt sind.

```text
Wochenreview · KW 23

✅ Was gut lief
   • Gym 4×, Clean-Streak gehalten (12 → 19 Tage)
   • FDS Assignment 2 fertig

⚠️ Was schlecht lief
   • OR seit 5 Tagen nicht angefasst — Prüfung in 9 Tagen 🔴
   • Schlaf 3 Nächte unter 6h

🔍 Muster (KI)
   • Unstrukturierte Nachmittage → höheres Gambling-Risiko
   • Nach Gym-Tagen: bessere Lernfokus-Werte

🎯 Top 3 nächste Woche
   1. OR täglich 1 Block (kritisch)
   2. Nachmittage verplanen (Trigger-Schutz)
   3. …
```

> ⚠️ **Datenschutz-Schwelle:** Das wäre der erste echte LLM-Einsatz im Projekt (bisher
> ist alles regelbasiert, auch die jetzige WeeklyReview). Ein Modell, das Journal-Einträge
> über Gambling, Schlaf und mentale Zustände liest, muss serverseitig und privat laufen,
> und es muss transparent sein, dass Daten an ein Modell gehen. Bewusste, aber richtige
> Entscheidung.

---

## Die Module — drei Tiers

Nicht neun gleichwertige Seiten. Eine Cockpit-Seite (`/today`), alles andere dahinter.

| Tier | Was | Wo | Pflege |
|------|-----|-----|--------|
| **1 — Täglich** | Risikoampel · Top 3 · nächster Block · Clean-Streak · nächster Schritt | `/today` | 30–60 Sek Check-in |
| **2 — Wöchentlich** | KI-Wochenreview → erzeugt Top 3 + Lernblöcke · ECTS-Risiko · Career-Schritt | So abends | 5 Min |
| **3 — Bei Bedarf** | Finance-Budget · Modul-Detail · Körper-Historie · Career-Pipeline · Lernplan | eigene Seiten | nur wenn nötig |

**Ausnahme:** Der **Anti-Gambling-Notfallbutton** ist immer mit 1 Tap erreichbar
(Header/Floating), egal wo. Er moralisiert nicht — er *unterbricht* (Timer, Bewegung,
Kontostand nicht anschauen).

---

## Wie wir rangehen — Build-Roadmap

Reihenfolge nach Prinzip: **so früh wie möglich täglich nutzbar**, dann Daten sammeln,
dann veredeln. Jede Phase ist für sich nützlich und unabhängig revertierbar.

### Phase A — Daily Briefing Kern *(der tägliche Loop, sofort nutzbar)*
Das Herzstück zuerst, weil es ab Tag 1 Wert liefert und die Daten für alles Spätere sammelt.
- **Datenmodell:** `daily_checkins` (date, type morning/evening, energy, journal_text),
  `commitments` (date, title, linked_module/task, status pending/done/missed, reason)
- **Morgen-Briefing:** Lage anzeigen + Commitments festlegen (an Tasks/Module gekoppelt)
- **Abend-Briefing:** Commitments abrechnen (Ja/Nein + optional warum) + Schnell-Check-in
- **Lucian-Integration:** warm-motivierende Briefing-Texte, zwei feste Termine
- **Erfüllungsrate + Streaks** sichtbar
- *Noch ohne KI, noch ohne volle Ampel — nur der Loop.*

### Phase B — Risikoampel
- **Studium-Ampel automatisch** über die bestehende Trajectory-Engine (größter Hebel,
  null Eingabe)
- **Finance- + Körper-Ampel** aus den Check-in-Werten
- **Disziplin** als abgeleiteter Meta-Score
- **„Nächster Schritt"** = röteste Ampel + nächster freier Kalender-Slot

### Phase C — Anti-Gambling-Control *(emotional zentral, klein)*
- Clean-Streak + heutiges Risiko 1–10 (fließt schon in Phase B)
- **Notfallbutton** (Unterbrechungs-Flow: Timer, Bewegung, kein Kontostand)
- Trigger-Log (optional Freitext, speist später die KI)

### Phase D — KI-Wochenreport *(die Krönung, erster LLM-Einsatz)*
- Sonntags-Analyse über die gesammelten Check-ins
- Intention vs. Realität, Muster, Korrelationen, Top 3 nächste Woche
- Serverseitig, privat, transparent

### Phase E+ — Tier-3-Tiefe *(bei Bedarf, eigene Seiten)*
- Finance-Modul (Budget, Notgroschen, ETF, Ausgaben)
- Körper-Modul (Gewicht, Gym-Detail, Golf, Schlaf-Historie)
- Lernplan-Generator (Wochenblöcke aus Prüfungen + freien Slots)
- ECTS-Klausurfähigkeit 1–10 pro Modul

---

## Was schon steht (Fundament)

Die Infra trägt diese Vision bereits — die nächsten Phasen sind v. a. *Verbindung*, nicht
Neubau von Grund auf:

- ✅ Auth + RLS (owner-based isolation)
- ✅ KIT-Sync (Module, Noten, Prüfungen, WebCal) + Google Calendar + `calendar_entries`
- ✅ Trajectory-Engine (backward planning, risk thresholds) → speist Studium-Ampel
- ✅ Focus Timer + `focus_sessions` → liefert „gelernt"-Minuten automatisch
- ✅ Lucian (Companion, Raum, warm-motivierende Copy) → wird Accountability-Partner
- ✅ `/today` als Cockpit-Surface
- ✅ Career-Pipeline, regelbasierte WeeklyReview (wird zu KI-Report erweitert)

---

## Die Vision in einem Satz

> **Studium liefern, Geld schützen, Körper aufbauen, Karriere vorbereiten, keine
> destruktiven Impulse — jeden Tag in 60 Sekunden auf Kurs, mit Lucian an meiner Seite.**
