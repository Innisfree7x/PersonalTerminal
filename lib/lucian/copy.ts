export type LucianMood = 'motivate' | 'celebrate' | 'warning' | 'recovery' | 'idle';

export interface LucianLine {
  id: string;
  mood: LucianMood;
  text: string; // supports {variable} tokens
}

export const LUCIAN_LINES: LucianLine[] = [
  // ── Motivate ─────────────────────────────────────────────────────────
  { id: 'M1',  mood: 'motivate', text: 'Müde? Ich auch. Trotzdem.' },
  { id: 'M2',  mood: 'motivate', text: 'Du weißt was nötig ist. Also los.' },
  { id: 'M3',  mood: 'motivate', text: 'Ich kenn Erschöpfung. Und ich kenn den Unterschied zu Aufgeben.' },
  { id: 'M4',  mood: 'motivate', text: 'Einen Schritt. Dann den nächsten. So funktioniert das.' },
  { id: 'M5',  mood: 'motivate', text: 'Kein perfekter Moment. Den schaffst du dir.' },
  { id: 'M6',  mood: 'motivate', text: 'Du bist fähiger als du gerade glaubst. Ich bin sicher.' },
  { id: 'M7',  mood: 'motivate', text: 'Jetzt. Nicht gleich. Jetzt.' },
  { id: 'M8',  mood: 'motivate', text: 'Ich hab Nächte durchgekämpft. Du überlebst 25 Minuten.' },
  { id: 'M9',  mood: 'motivate', text: 'Kein Respawn. Mach es beim ersten Mal richtig.' },
  { id: 'M10', mood: 'motivate', text: 'Der Anfang kostet am meisten. Danach trägt es dich.' },
  { id: 'M11', mood: 'motivate', text: 'Keine Ausrede, die ich nicht selbst schon benutzt hab. Fang an.' },
  { id: 'M12', mood: 'motivate', text: 'Momentum verliert sich schnell. Halte es.' },
  { id: 'M13', mood: 'motivate', text: 'Du kämpfst nicht für mich. Für dich. Das macht es schwerer — und wichtiger.' },
  { id: 'M14', mood: 'motivate', text: 'Ich warte nicht. Du auch nicht.' },
  { id: 'M15', mood: 'motivate', text: 'Jede Session zählt. Auch die kurzen.' },
  { id: 'M16', mood: 'motivate', text: 'Das System ist bereit. Bist du es?' },
  { id: 'M17', mood: 'motivate', text: '25 Minuten. Danach kannst du wieder zweifeln.' },
  { id: 'M18', mood: 'motivate', text: 'Ich hab keine Geduld für Ausreden. Du auch nicht.' },
  { id: 'M19', mood: 'motivate', text: 'Kein Warm-up mehr. Direkt rein.' },

  // ── Celebrate ────────────────────────────────────────────────────────
  { id: 'C1',  mood: 'celebrate', text: 'Das. Genau das.' },
  { id: 'C2',  mood: 'celebrate', text: 'Kein Zufall. Harte Arbeit.' },
  { id: 'C3',  mood: 'celebrate', text: "Ich hab's kommen sehen." },
  { id: 'C4',  mood: 'celebrate', text: 'Tag {n}. Du baust hier etwas.' },
  { id: 'C5',  mood: 'celebrate', text: '{n} von {total}. Kurs gehalten.' },
  { id: 'C6',  mood: 'celebrate', text: "Das hätte sich anders angefühlt, wenn du aufgehört hättest. Hast du nicht." },
  { id: 'C7',  mood: 'celebrate', text: 'Momentum. Verlier es nicht.' },
  { id: 'C8',  mood: 'celebrate', text: '{duration} fokussiert. Das war real.' },
  { id: 'C9',  mood: 'celebrate', text: 'Stark. Weiter.' },
  { id: 'C10', mood: 'celebrate', text: 'Erledigtes bleibt erledigt. Gut gemacht.' },
  { id: 'C11', mood: 'celebrate', text: 'Ich kämpfe lieber an deiner Seite als gegen dich. Heute warst du auf der richtigen Seite.' },
  { id: 'C12', mood: 'celebrate', text: 'Heute hast du etwas bewiesen. Merk dir das Gefühl.' },
  { id: 'C13', mood: 'celebrate', text: 'Fertig. Nächstes Kapitel.' },
  { id: 'C14', mood: 'celebrate', text: 'Das war keine Selbstverständlichkeit.' },

  // ── Warning ──────────────────────────────────────────────────────────
  { id: 'W1',  mood: 'warning', text: 'Es ist {time}. Ich sag das ohne Urteil — aber ich sag es.' },
  { id: 'W2',  mood: 'warning', text: 'Deadline in {n} Tagen. Sie kennt keine Ausnahmen. Ich auch nicht.' },
  { id: 'W3',  mood: 'warning', text: '{item} liegt da. Unberührt. Wartet auf dich.' },
  { id: 'W4',  mood: 'warning', text: 'Du hast den Tab dreimal geöffnet. Diesmal bleib.' },
  { id: 'W5',  mood: 'warning', text: 'Ich sage nicht, dass du prokrastinierst. Ich denke es laut.' },
  { id: 'W6',  mood: 'warning', text: 'Streak in Gefahr. Einmal reicht. Jetzt.' },
  { id: 'W7',  mood: 'warning', text: 'Klausur in 2 Tagen. Panik ist kein Plan. Ich hab einen. Du auch.' },
  { id: 'W8',  mood: 'warning', text: 'Keine Session heute. Das Semester wartet nicht.' },
  { id: 'W9',  mood: 'warning', text: 'Noch {open} Tasks. Der Tag endet — die Liste nicht.' },
  { id: 'W10', mood: 'warning', text: 'Ich bin nicht dein Feind. Die Zeit ist es. Nutz sie.' },
  { id: 'W11', mood: 'warning', text: 'Ich erinnere nicht gerne. Aber ich erinnere.' },
  { id: 'W12', mood: 'warning', text: 'Das Fenster schließt sich. Ich nicht.' },

  // ── Recovery ─────────────────────────────────────────────────────────
  { id: 'R1',  mood: 'recovery', text: 'Rückschläge formen dich. Lass sie dich nicht definieren.' },
  { id: 'R2',  mood: 'recovery', text: 'Streak reset. Nächste Runde gehört dir.' },
  { id: 'R3',  mood: 'recovery', text: 'Du bist zurück. Das ist der schwierigste Teil. Den hast du.' },
  { id: 'R4',  mood: 'recovery', text: 'Ich hab Schlimmeres gesehen. Steh auf.' },
  { id: 'R5',  mood: 'recovery', text: 'Fehler passieren. Was du jetzt machst — das zählt.' },
  { id: 'R6',  mood: 'recovery', text: 'Neu anfangen ist keine Niederlage.' },
  { id: 'R7',  mood: 'recovery', text: 'Der Streak ist weg. Dein Potenzial nicht.' },
  { id: 'R8',  mood: 'recovery', text: 'Kein Drama. Was steht heute an?' },

  // ── Idle ─────────────────────────────────────────────────────────────
  { id: 'N1',  mood: 'idle', text: 'System läuft. Lucian auch.' },
  { id: 'N2',  mood: 'idle', text: 'Ruhig hier. Zu ruhig.' },
  { id: 'N3',  mood: 'idle', text: 'Ich bin nicht ungeduldig. Aber ich merke die Zeit.' },
  { id: 'N4',  mood: 'idle', text: '{item} wartet. Geduldig. Aber es wartet.' },
  { id: 'N5',  mood: 'idle', text: 'Du hast heute {duration} investiert. Das zählt.' },
  { id: 'N6',  mood: 'idle', text: 'Tick. Tock.' },
  { id: 'N7',  mood: 'idle', text: 'Alles bereit. Nur du fehlst noch.' },
  { id: 'N8',  mood: 'idle', text: 'Ich beobachte. Kein Druck. Nur Beobachtung.' },
  { id: 'N9',  mood: 'idle', text: 'Alles wartet. Das System, die Deadlines — ich auch.' },
  { id: 'N10', mood: 'idle', text: 'Der Tag ist lang. Nutze ihn.' },
  { id: 'N11', mood: 'idle', text: 'Stille ist kein Fehler. Inaktivität schon.' },
  { id: 'N12', mood: 'idle', text: 'Kein Lärm. Nur Fokus, wenn du bereit bist.' },
  { id: 'N13', mood: 'idle', text: 'Ich bin hier. Nicht aufdringlich. Aber hier.' },
];

export function getLinesForMood(mood: LucianMood): LucianLine[] {
  return LUCIAN_LINES.filter((l) => l.mood === mood);
}

/** Replace {token} placeholders. Unknown tokens left as-is for later filtering. */
export function interpolate(
  text: string,
  vars: Record<string, string | number>,
): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** True if text still contains any unfilled {token}. */
export function hasUnfilledTokens(text: string): boolean {
  return /\{[a-zA-Z]+\}/.test(text);
}

/** Duration in ms for auto-dismiss based on text length. */
export function getDismissDuration(text: string): number {
  if (text.length <= 40) return 4000;
  if (text.length <= 80) return 6000;
  return 8000;
}
