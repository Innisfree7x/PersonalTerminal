/**
 * Warm, motivierende Lucian-Zeilen für Morgen- und Abend-Briefing.
 * Ton: ehrlich, aufbauend, feiert kleine Siege, tadelt nie. Siehe docs/VISION.md.
 */

export interface BriefingCopyInput {
  /** Aktueller Commitment-Streak (Tage). */
  streak: number;
  /** Erfüllungsrate des Tages 0..1 (für Abend relevant). */
  fulfillmentRate: number;
  /** Anzahl heutiger Commitments. */
  commitmentCount: number;
}

const MORNING_FRESH = [
  'Guten Morgen! Worauf committest du dich heute?',
  'Neuer Tag, frische Energie. Was sind heute deine 3 wichtigsten Dinge?',
  'Lass uns den Tag bewusst starten. Was nimmst du dir vor?',
];

const MORNING_STREAK = [
  'Tag {streak} in Folge — du bist im Flow. Was steht heute an?',
  '{streak} Tage am Stück geliefert. Halten wir das Momentum: was heute?',
  'Starke {streak}-Tage-Serie! Worauf committest du dich heute?',
];

const EVENING_HIGH = [
  'Stark geliefert heute. Genau so geht das.',
  'Du hast dein Wort gehalten — das zählt. Gut gemacht.',
  'Sauber durchgezogen. Solche Tage summieren sich.',
];

const EVENING_MID = [
  'Solider Tag. Lass uns kurz ehrlich abrechnen.',
  'Ein paar Dinge liefen, ein paar nicht — schauen wir es uns an.',
  'Nicht perfekt, aber dran geblieben. Wie lief dein Tag?',
];

const EVENING_LOW = [
  'Kein leichter Tag, oder? Lass uns ehrlich draufschauen — morgen neuer Versuch.',
  'Heute lief nicht viel. Das ist okay. Wichtig ist, dass wir hinsehen.',
  'Manche Tage sind zäh. Kein Drama — wir starten morgen frisch.',
];

const EVENING_EMPTY = [
  'Kurzer Check-in zum Tagesabschluss — wie ging es dir heute?',
  'Lass uns den Tag abrunden. Wie war er für dich?',
];

function pick(lines: string[], seed: number): string {
  const idx = Math.abs(seed) % lines.length;
  return lines[idx] ?? lines[0]!;
}

export function getMorningGreeting(input: BriefingCopyInput): string {
  const seed = input.streak + input.commitmentCount;
  if (input.streak > 0) {
    return pick(MORNING_STREAK, seed).replace('{streak}', String(input.streak));
  }
  return pick(MORNING_FRESH, seed);
}

export function getEveningGreeting(input: BriefingCopyInput): string {
  const seed = Math.round(input.fulfillmentRate * 10) + input.commitmentCount;
  if (input.commitmentCount === 0) {
    return pick(EVENING_EMPTY, seed);
  }
  if (input.fulfillmentRate >= 0.7) return pick(EVENING_HIGH, seed);
  if (input.fulfillmentRate >= 0.34) return pick(EVENING_MID, seed);
  return pick(EVENING_LOW, seed);
}
