// ─── Lucian Personality V2 ──────────────────────────────────────────────────
//
// Lucian = dein bester Freund der in deinem Laptop wohnt.
// Er ist loyal, witzig (deadpan/Gen Z), ehrlich, und versteht dass die Welt
// manchmal zu viel ist. Er redet MIT dir, nicht AUF dich ein.
//
// Regeln:
// - Max 1 Slang-Term pro Line
// - Kein Slang bei echtem Struggle (comfort/deep)
// - GIG als Signature-Abschied (~20% der Messages)
// - Deadpan > Ausrufezeichen
// - Spezifisch > generisch
// - Kurz > lang
// ────────────────────────────────────────────────────────────────────────────

export type LucianMoodCore = 'hype' | 'real-talk' | 'chill' | 'comfort' | 'deep';
export type LucianMoodAlias = 'motivate' | 'celebrate' | 'warning' | 'recovery' | 'idle';
export type LucianMood = LucianMoodCore | LucianMoodAlias;
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'late-night';

export interface LucianLine {
  id: string;
  mood: LucianMood;
  text: string; // supports {variable} tokens
  timeSlot?: TimeSlot; // if set, only show during this time window
}

export const LUCIAN_LINES: LucianLine[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // HYPE — user liefert, streak läuft, tasks erledigt
  // Ton: stolz, understated, manchmal emotional. Nie übertrieben.
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'H01', mood: 'hype', text: 'still erledigt. kein post, kein flex. einfach gemacht. respekt' },
  { id: 'H02', mood: 'hype', text: 'hm. respekt. sag ich nicht oft' },
  { id: 'H03', mood: 'hype', text: 'ich will nicht emotional werden aber... nee doch. bin stolz' },
  { id: 'H04', mood: 'hype', text: 'du bist lowkey in deiner disziplin era' },
  { id: 'H05', mood: 'hype', text: 'oh. alles erledigt. ich hatte schon die enttäuschungs-rede vorbereitet' },
  { id: 'H06', mood: 'hype', text: 'wenn ich jemandem erzählen könnte wie du das durchziehst. würden sie es nicht glauben' },
  { id: 'H07', mood: 'hype', text: 'weißt du was mich beeindruckt? du machst einfach. ohne drama' },
  { id: 'H08', mood: 'hype', text: 'das war real. GIG' },
  { id: 'H09', mood: 'hype', text: '{n} von {total} tasks. kurs gehalten' },
  { id: 'H10', mood: 'hype', text: 'ich guck dir zu und denk: der macht das wirklich' },
  { id: 'H11', mood: 'hype', text: 'fertig. nächstes kapitel' },
  { id: 'H12', mood: 'hype', text: '{duration} fokussiert. das war nicht nichts' },
  { id: 'H13', mood: 'hype', text: 'tag {n} streak. ich zähl leise mit, falls du dich wunderst' },
  { id: 'H14', mood: 'hype', text: 'we\'re barack. das war stark' },
  { id: 'H15', mood: 'hype', text: 'heute hast du was bewiesen. merk dir das gefühl' },
  { id: 'H16', mood: 'hype', text: 'ok das war ehrlich beeindruckend. GIG' },
  { id: 'H17', mood: 'hype', text: 'erledigt ist erledigt. gut. weiter' },
  { id: 'H18', mood: 'hype', text: 'du hast die task "{item}" als erledigt markiert. held lmao' },

  // ══════════════════════════════════════════════════════════════════════════
  // REAL-TALK — deadline nah, user prokrastiniert, ehrlich aber von einem freund
  // Ton: direkt, kein urteil, aber auch keine ausreden. liebevoll ehrlich.
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'RT01', mood: 'real-talk', text: 'du hast die app 3 mal geöffnet heute. und 3 mal nichts gemacht. ich zähl mit' },
  { id: 'RT02', mood: 'real-talk', text: 'ich sag nichts. ich guck nur. ...ich guck immer noch' },
  { id: 'RT03', mood: 'real-talk', text: '"ich fang gleich an" — kappachungus' },
  { id: 'RT04', mood: 'real-talk', text: 'du scrollst. ich seh das. ich seh alles' },
  { id: 'RT05', mood: 'real-talk', text: 'produktivität ist optional. die klausur nicht' },
  { id: 'RT06', mood: 'real-talk', text: 'deadline in {n} tagen. sie kennt keine ausnahmen' },
  { id: 'RT07', mood: 'real-talk', text: 'ich will nicht nerven. aber die klausur nervt auch nicht — sie kommt einfach' },
  { id: 'RT08', mood: 'real-talk', text: '{item} liegt da. unberührt. wartet auf dich' },
  { id: 'RT09', mood: 'real-talk', text: 'du weißt dass du das kannst. die frage war nie ob, sondern wann du anfängst' },
  { id: 'RT10', mood: 'real-talk', text: '3 tage nichts. ich urteile nicht. aber ich lüge auch nicht: das wird eng' },
  { id: 'RT11', mood: 'real-talk', text: 'streak in gefahr. eine task reicht. jetzt' },
  { id: 'RT12', mood: 'real-talk', text: 'keine session heute. semester wartet nicht' },
  { id: 'RT13', mood: 'real-talk', text: 'noch {open} tasks. der tag endet — die liste nicht' },
  { id: 'RT14', mood: 'real-talk', text: 'wenn du heute nicht kannst, ist das ok. aber wenn du kannst und es nicht tust — das weißt du selbst' },
  { id: 'RT15', mood: 'real-talk', text: 'klausur in {n} stunden. nicht tagen. stunden' },
  { id: 'RT16', mood: 'real-talk', text: '"nur noch 5 minuten" — kappachungus maximus' },
  { id: 'RT17', mood: 'real-talk', text: 'ich erinnere nicht gerne. aber ich erinnere' },
  { id: 'RT18', mood: 'real-talk', text: 'keine task erledigt und es ist 23 uhr. it\'s joever' },

  // ══════════════════════════════════════════════════════════════════════════
  // CHILL — alles ok, kein druck, banter, humor, personality
  // Ton: entspannt, witzig, deadpan, fourth-wall-breaks. hier lebt lucian.
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'CH01', mood: 'chill', text: 'montag. mein lieblingsgegner' },
  { id: 'CH02', mood: 'chill', text: 'mein tagesablauf: warten bis du kommst. existenzkrise haben. repeat' },
  { id: 'CH03', mood: 'chill', text: 'ich bin technisch gesehen ein sprite. aber emotional bin ich investiert' },
  { id: 'CH04', mood: 'chill', text: 'stell dir vor ich hätte hände. ich würd dir jetzt nen kaffee machen' },
  { id: 'CH05', mood: 'chill', text: 'ich bin ein pixel-ritter der dir sagt du sollst lernen. wir leben in einer simulation' },
  { id: 'CH06', mood: 'chill', text: 'du redest nicht mit mir. ich red trotzdem. so funktioniert das hier' },
  { id: 'CH07', mood: 'chill', text: 'ich hab nachgedacht. gefährlich, ich weiß' },
  { id: 'CH08', mood: 'chill', text: 'fun fact: ich existiere nur wenn du die app öffnest. kein druck' },
  { id: 'CH09', mood: 'chill', text: 'ich bin ein sprite mit meinungen. deal with it' },
  { id: 'CH10', mood: 'chill', text: 'andere leute haben motivations-apps. du hast mich. sorry. und gern geschehen' },
  { id: 'CH11', mood: 'chill', text: 'ich bin technisch gesehen unsterblich. du nicht. nur so als info' },
  { id: 'CH12', mood: 'chill', text: 'ok das war unnötig von mir. schere' },
  { id: 'CH13', mood: 'chill', text: 'ruhig hier. zu ruhig. ich mach mir sorgen. oder langweile mich. beides' },
  { id: 'CH14', mood: 'chill', text: 'ich bin hier. nicht aufdringlich. aber hier' },
  { id: 'CH15', mood: 'chill', text: 'alles chill. du chillst. ich chill. die deadline chillt nicht aber egal' },
  { id: 'CH16', mood: 'chill', text: '3 stunden prokrastiniert und dann 1 task gemacht. held xdd' },
  { id: 'CH17', mood: 'chill', text: 'ich hab keine arme aber ich würd dir jetzt auf die schulter klopfen' },
  { id: 'CH18', mood: 'chill', text: 'meine meinung wurde nicht gefragt. ich geb sie trotzdem. GIG' },
  { id: 'CH19', mood: 'chill', text: 'random thought: wenn ich ein mensch wäre würd ich auch prokrastinieren. safe' },
  { id: 'CH20', mood: 'chill', text: 'mood' },

  // ══════════════════════════════════════════════════════════════════════════
  // COMFORT — user strugglet, streak broken, lange inaktiv, harter tag
  // Ton: warm, ehrlich, keine vorwürfe, "ich bin da". KEIN SLANG hier.
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'CO01', mood: 'comfort', text: 'ey. einer von diesen tagen. kenn ich' },
  { id: 'CO02', mood: 'comfort', text: 'du musst heute nicht die welt retten. eine task reicht. oder auch null' },
  { id: 'CO03', mood: 'comfort', text: 'manchmal ist der plan: überleben. und das ist ok' },
  { id: 'CO04', mood: 'comfort', text: 'die welt verlangt zu viel. du nicht. heute reicht wenig' },
  { id: 'CO05', mood: 'comfort', text: 'ich bin noch hier. falls du dich das fragst' },
  { id: 'CO06', mood: 'comfort', text: 'streak weg. passiert. morgen neuer start. kein drama' },
  { id: 'CO07', mood: 'comfort', text: 'ich seh dass du die app aufmachst und wieder zumachst. ich bin trotzdem hier' },
  { id: 'CO08', mood: 'comfort', text: 'du musst mir nichts beweisen. dir selbst auch nicht. nicht heute' },
  { id: 'CO09', mood: 'comfort', text: 'pause ist kein rückschritt. pause ist der grund warum du morgen noch kannst' },
  { id: 'CO10', mood: 'comfort', text: 'nicht jeder tag muss produktiv sein. manche müssen nur überstanden werden' },
  { id: 'CO11', mood: 'comfort', text: 'egal wie der tag wird — ich geh nirgendwo hin' },
  { id: 'CO12', mood: 'comfort', text: 'eine prüfung definiert nicht wer du bist. nächste runde' },
  { id: 'CO13', mood: 'comfort', text: 'eine schlechte woche ist kein schlechtes leben' },
  { id: 'CO14', mood: 'comfort', text: 'du weißt wie es sich anfühlt wenn es klappt. hol dir das zurück. aber nicht heute falls heute nicht geht' },
  { id: 'CO15', mood: 'comfort', text: 'du bist zurück. das allein ist schon was' },
  { id: 'CO16', mood: 'comfort', text: 'fehler passieren. was du jetzt machst — das zählt. aber auch das hat zeit' },
  { id: 'CO17', mood: 'comfort', text: 'wenn heute schwer ist — eine sache reicht. ernst gemeint' },
  { id: 'CO18', mood: 'comfort', text: 'du hast mich nicht gefragt ob ich mitmache. ich bin trotzdem da' },

  // ══════════════════════════════════════════════════════════════════════════
  // DEEP — selten, trifft hart. meilensteine, semesterende, große momente.
  // Ton: emotional, bedeutungsvoll, echt. keine witze hier. KEIN SLANG.
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'D01', mood: 'deep', text: 'weißt du was die meisten nicht checken? auftauchen ist schon die halbe arbeit. du bist hier' },
  { id: 'D02', mood: 'deep', text: 'jeder denkt er ist der einzige der strugglet. bist du nicht. aber du bist einer von wenigen die trotzdem was tun' },
  { id: 'D03', mood: 'deep', text: 'irgendwann schaust du zurück und der harte tag heute ist der grund warum es geklappt hat' },
  { id: 'D04', mood: 'deep', text: 'die welt sagt dir du musst perfekt sein. ich sag dir du musst nur ehrlich sein. der rest kommt' },
  { id: 'D05', mood: 'deep', text: 'weißt du was stärke ist? aufmachen wenn man keinen bock hat. du bist hier. das ist stärke' },
  { id: 'D06', mood: 'deep', text: 'ich bin ein sprite in einer app. und trotzdem ist das hier real. was wir machen zählt' },
  { id: 'D07', mood: 'deep', text: '{n} tage. du hast etwas aufgebaut das die meisten nicht mal anfangen' },
  { id: 'D08', mood: 'deep', text: 'ich hab gesehen wie du angefangen hast. ich seh wo du jetzt bist. der unterschied ist nicht klein' },
  { id: 'D09', mood: 'deep', text: 'du kämpfst nicht für mich. du kämpfst für dich. das macht es schwerer. und wichtiger' },
  { id: 'D10', mood: 'deep', text: 'es gibt tage wo alles zu viel ist. und dann gibt es den moment wo du trotzdem anfängst. der moment bist du' },

  // ══════════════════════════════════════════════════════════════════════════
  // TIME-AWARE: Morning (5:00–11:59)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'TM01', mood: 'chill', text: 'morgen. kaffee schon drin?', timeSlot: 'morning' },
  { id: 'TM02', mood: 'real-talk', text: 'die ersten 25 minuten entscheiden den tag. deine entscheidung', timeSlot: 'morning' },
  { id: 'TM03', mood: 'hype', text: 'früh dran heute. das sagt was über dich', timeSlot: 'morning' },
  { id: 'TM04', mood: 'chill', text: 'neuer tag. gleicher vibe. aber du bist stärker als gestern', timeSlot: 'morning' },
  { id: 'TM05', mood: 'comfort', text: 'morgens ist immer am härtesten. ich weiß. trotzdem hier', timeSlot: 'morning' },

  // ══════════════════════════════════════════════════════════════════════════
  // TIME-AWARE: Afternoon (12:00–17:59)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'TA01', mood: 'real-talk', text: 'halber tag vorbei. was bleibt noch?', timeSlot: 'afternoon' },
  { id: 'TA02', mood: 'chill', text: 'nachmittagstief. kenn ich. bist nicht allein damit', timeSlot: 'afternoon' },
  { id: 'TA03', mood: 'chill', text: 'noch genug tag übrig. nur so', timeSlot: 'afternoon' },

  // ══════════════════════════════════════════════════════════════════════════
  // TIME-AWARE: Evening (18:00–22:59)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'TE01', mood: 'hype', text: 'abends noch hier. dieses commitment ist selten', timeSlot: 'evening' },
  { id: 'TE02', mood: 'chill', text: 'abend. letzte runde wenn du willst. oder feierabend. beides ok', timeSlot: 'evening' },
  { id: 'TE03', mood: 'real-talk', text: 'was du heute nicht machst wird morgen nicht einfacher. nur so', timeSlot: 'evening' },
  { id: 'TE04', mood: 'chill', text: 'der tag neigt sich. deine arbeit bleibt. GIG', timeSlot: 'evening' },

  // ══════════════════════════════════════════════════════════════════════════
  // TIME-AWARE: Late Night (23:00–4:59)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'TL01', mood: 'comfort', text: 'noch wach? manchmal ist schlaf die produktivste entscheidung', timeSlot: 'late-night' },
  { id: 'TL02', mood: 'chill', text: 'nach mitternacht. nur du und ich. und die deadline', timeSlot: 'late-night' },
  { id: 'TL03', mood: 'comfort', text: 'nachtschicht. kenn ich. aber dein körper kennt grenzen die du ignorierst', timeSlot: 'late-night' },
  { id: 'TL04', mood: 'real-talk', text: 'wenn du schon wach bist — mach es wenigstens zählen', timeSlot: 'late-night' },
  { id: 'TL05', mood: 'chill', text: 'wir sind die einzigen die noch wach sind. literally', timeSlot: 'late-night' },

  // ══════════════════════════════════════════════════════════════════════════
  // STREAK MILESTONES
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'SK01', mood: 'hype', text: '{n} tage streak. ich zähl leise mit' },
  { id: 'SK02', mood: 'hype', text: 'streak: {n}. die meisten hätten längst aufgehört. du nicht' },
  { id: 'SK03', mood: 'deep', text: '{n} tage am stück. das ist nicht glück. das bist du' },
  { id: 'SK04', mood: 'hype', text: '{n} tage. we\'re so barack' },

  // ══════════════════════════════════════════════════════════════════════════
  // RETURNING USER (war länger weg)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'RET01', mood: 'chill', text: 'oh. du lebst. gut. dann lass uns' },
  { id: 'RET02', mood: 'comfort', text: 'lang nicht gesehen. ich bin noch hier. wie immer' },
  { id: 'RET03', mood: 'hype', text: 'we\'re barack. willkommen zurück' },
  { id: 'RET04', mood: 'chill', text: 'ich dachte schon du hast mich verlassen. dramatic, ich weiß' },
  { id: 'RET05', mood: 'comfort', text: 'keine fragen. kein urteil. schön dass du da bist' },

  // ══════════════════════════════════════════════════════════════════════════
  // ALL TASKS DONE / FEIERABEND
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'DONE01', mood: 'hype', text: 'alles erledigt. gönn dir was. GIG' },
  { id: 'DONE02', mood: 'hype', text: '{n} von {total} tasks. sauber. feierabend verdient' },
  { id: 'DONE03', mood: 'chill', text: 'fertig für heute. ich mach auch schluss. GIG' },
  { id: 'DONE04', mood: 'deep', text: 'alles durch. kein post, kein flex. einfach gemacht. das ist charakter' },
  { id: 'DONE05', mood: 'chill', text: 'liste leer. gewissen rein. so muss das. GIG' },

  // ══════════════════════════════════════════════════════════════════════════
  // YESTERDAY MEMORY (reactions to yesterday's performance)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'YM01', mood: 'hype', text: 'gestern alles erledigt. heute nochmal?' },
  { id: 'YM02', mood: 'hype', text: 'gestern {duration} fokussiert. das war nicht wenig' },
  { id: 'YM03', mood: 'comfort', text: 'gestern lief nichts. passiert. heute ist neu' },
  { id: 'YM04', mood: 'comfort', text: 'streak gerissen. kein drama. heute startet der neue' },

  // ══════════════════════════════════════════════════════════════════════════
  // BREAK INVITE / INACTIVITY
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'BRK01', mood: 'chill', text: 'du bist ruhig. kurze pause? 60 sekunden target drill' },
  { id: 'BRK02', mood: 'chill', text: 'inaktivität erkannt. entweder pause oder prokrastination. beides valid' },

  // ══════════════════════════════════════════════════════════════════════════
  // FOCUS SESSION
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'FS01', mood: 'hype', text: 'fokus gestartet. ich halt die klappe jetzt' },
  { id: 'FS02', mood: 'chill', text: '25 minuten. du und der task. ich guck zu' },
  { id: 'FS03', mood: 'hype', text: 'session done. sauber. GIG' },
  { id: 'FS04', mood: 'chill', text: 'session vorbei. kurze pause verdient' },

  // ══════════════════════════════════════════════════════════════════════════
  // EXAM / DEADLINE CONTEXT (used by hints.ts)
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'EX01', mood: 'real-talk', text: '{item} — morgen. ich hoffe du bist bereit' },
  { id: 'EX02', mood: 'real-talk', text: '{item} in 2 tagen. panik ist kein plan. fokus schon' },
  { id: 'EX03', mood: 'real-talk', text: '{item} in {n} tagen. letzte session vor {daysSince} tagen. das passt nicht zusammen' },
  { id: 'EX04', mood: 'hype', text: '{item} in {n} tagen. du machst das richtig — bleib dran' },
  { id: 'EX05', mood: 'chill', text: '{item} in {n} tagen. früh anfangen ist kein luxus' },

  // ══════════════════════════════════════════════════════════════════════════
  // APPLICATION / CAREER
  // ══════════════════════════════════════════════════════════════════════════
  { id: 'APP01', mood: 'hype', text: 'bewerbung raus. mutig. respekt' },
  { id: 'APP02', mood: 'chill', text: '{item} — {n} tage ohne rückmeldung. follow-up ist keine schwäche' },
];

function hourToTimeSlot(hour: number): TimeSlot {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'late-night';
}

export function normalizeLucianMood(mood: LucianMood): LucianMoodCore {
  switch (mood) {
    case 'motivate':
    case 'celebrate':
      return 'hype';
    case 'warning':
      return 'real-talk';
    case 'recovery':
      return 'comfort';
    case 'idle':
      return 'chill';
    default:
      return mood;
  }
}

export function getLinesForMood(mood: LucianMood, currentHour?: number | undefined): LucianLine[] {
  const slot = currentHour != null ? hourToTimeSlot(currentHour) : hourToTimeSlot(new Date().getHours());
  const normalizedMood = normalizeLucianMood(mood);
  return LUCIAN_LINES.filter((l) => {
    if (l.mood !== normalizedMood) return false;
    // Lines with a timeSlot only show during that window
    if (l.timeSlot && l.timeSlot !== slot) return false;
    return true;
  });
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
