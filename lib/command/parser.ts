// ── Types ──────────────────────────────────────────────────────────────────────

export type ParsedIntent =
  | { kind: 'create-task'; title: string; deadline: string | null; deadlineLabel: string | null }
  | { kind: 'plan-focus'; durationMin: number }
  | { kind: 'create-goal'; title: string }
  | { kind: 'open-page'; page: string; path: string };

export interface ParseSuccess {
  ok: true;
  intent: ParsedIntent;
  /** Human-readable one-liner shown in the preview card */
  preview: string;
}

export interface ParseError {
  ok: false;
  error: string;
}

export type ParseResult = ParseSuccess | ParseError;

// ── Page registry ──────────────────────────────────────────────────────────────

const PAGE_MAP: Array<{ aliases: string[]; label: string; path: string }> = [
  { aliases: ['today', 'heute', 'dashboard', 'home', 'übersicht'], label: 'Dashboard', path: '/today' },
  { aliases: ['goals', 'ziele', 'goal', 'ziel'], label: 'Goals', path: '/goals' },
  { aliases: ['career', 'karriere', 'jobs', 'bewerbungen', 'bewerbung'], label: 'Career', path: '/career' },
  { aliases: ['university', 'uni', 'kurse', 'universität', 'studium', 'vorlesungen'], label: 'University', path: '/university' },
  { aliases: ['calendar', 'kalender', 'termine', 'schedule'], label: 'Calendar', path: '/calendar' },
  { aliases: ['analytics', 'statistiken', 'statistik', 'stats', 'analyse'], label: 'Analytics', path: '/analytics' },
  { aliases: ['settings', 'einstellungen', 'konto', 'preferences'], label: 'Settings', path: '/settings' },
];

function resolvePage(raw: string): { label: string; path: string } | null {
  const lower = raw.toLowerCase().trim();
  for (const page of PAGE_MAP) {
    if (page.aliases.some((alias) => lower === alias || lower.startsWith(alias))) {
      return { label: page.label, path: page.path };
    }
  }
  return null;
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toGermanLabel(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function parseDeadline(raw: string): { iso: string; label: string } | null {
  const lower = raw.toLowerCase().trim();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lower === 'heute' || lower === 'today') {
    return { iso: toIsoDate(today), label: `heute, ${toGermanLabel(today)}` };
  }
  if (lower === 'morgen' || lower === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { iso: toIsoDate(d), label: `morgen, ${toGermanLabel(d)}` };
  }
  if (lower === 'übermorgen') {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return { iso: toIsoDate(d), label: `übermorgen, ${toGermanLabel(d)}` };
  }
  if (lower === 'nächste woche' || lower === 'next week') {
    const d = new Date(today);
    const dow = d.getDay(); // 0=Sun
    const daysUntilMonday = dow === 0 ? 1 : 8 - dow;
    d.setDate(d.getDate() + daysUntilMonday);
    return { iso: toIsoDate(d), label: `nächste Woche, ${toGermanLabel(d)}` };
  }

  // "in X tagen" / "in X days"
  const inDaysMatch = lower.match(/^in\s+(\d+)\s+(tag(?:en)?|day(?:s)?)$/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]!, 10);
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return { iso: toIsoDate(d), label: `in ${days} Tagen, ${toGermanLabel(d)}` };
  }

  // DD.MM. or DD.MM.YYYY
  const dateMatch = lower.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})?$/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]!, 10);
    const month = parseInt(dateMatch[2]!, 10) - 1;
    const explicitYear = dateMatch[3] ? parseInt(dateMatch[3], 10) : null;
    const year = explicitYear ?? today.getFullYear();
    const d = new Date(year, month, day);
    if (!explicitYear && d < today) d.setFullYear(d.getFullYear() + 1);
    if (isNaN(d.getTime())) return null;
    if (d.getDate() !== day || d.getMonth() !== month) return null;
    return { iso: toIsoDate(d), label: toGermanLabel(d) };
  }

  return null;
}

// ── Verb sets ──────────────────────────────────────────────────────────────────

const TASK_VERBS  = ['create task', 'erstelle task', 'neuer task', 'add task', 'new task'];
const GOAL_VERBS  = ['create goal', 'erstelle goal', 'neues goal', 'add goal', 'new goal', 'erstelle ziel', 'neues ziel'];
const FOCUS_VERBS = ['plan focus', 'start focus', 'fokus', 'focus'];
const OPEN_VERBS  = ['navigate to', 'gehe zu', 'go to', 'öffne', 'open'];

/** True if `lower` starts with `verb` followed by whitespace or a quote */
function startsWithVerb(lower: string, verb: string): boolean {
  if (!lower.startsWith(verb)) return false;
  if (lower.length === verb.length) return true;
  const charAfter = lower[verb.length]!;
  return charAfter === ' ' || charAfter === '"' || charAfter === '\u201c';
}

function isCommandLike(lower: string): boolean {
  return [...TASK_VERBS, ...GOAL_VERBS, ...FOCUS_VERBS, ...OPEN_VERBS].some((v) =>
    startsWithVerb(lower, v),
  );
}

/** Extract the quoted or unquoted title from a string, returns { title, rest } */
function extractTitle(raw: string): { title: string; rest: string } {
  const quotedMatch = raw.match(/^[""\u201c](.+?)[""\u201d](?:\s+(.*))?$/);
  if (quotedMatch) {
    return {
      title: quotedMatch[1]!.trim(),
      rest: (quotedMatch[2] ?? '').trim(),
    };
  }
  // Split at "deadline / fällig / bis" keyword
  const split = raw.split(/\s+(?:deadline|fällig|bis)\s+/i);
  return {
    title: split[0]!.trim(),
    rest: split.slice(1).join(' ').trim(),
  };
}

// ── Main parse function ────────────────────────────────────────────────────────

/**
 * Attempt to parse a natural-language command string.
 *
 * Returns:
 * - `null`  → input doesn't look like a command (use normal search)
 * - `{ ok: false }` → looks like a command but is malformed (show inline error)
 * - `{ ok: true  }` → valid intent + preview string ready for confirmation
 *
 * Input may optionally start with `>` to force command mode.
 */
export function parseCommand(raw: string): ParseResult | null {
  const forced = raw.startsWith('>');
  const input = forced ? raw.slice(1).trim() : raw.trim();
  const lower = input.toLowerCase();

  if (!forced && !isCommandLike(lower)) return null;
  if (input.length < 2) return null;

  // ── create task ──────────────────────────────────────────────────────────────
  for (const verb of TASK_VERBS) {
    if (!startsWithVerb(lower, verb)) continue;

    const rest = input.slice(verb.length).trim();
    if (!rest) {
      return { ok: false, error: 'Task-Titel fehlt. Beispiel: erstelle task "VWL Blatt 3"' };
    }

    const { title, rest: afterTitle } = extractTitle(rest);
    if (!title) return { ok: false, error: 'Task-Titel fehlt.' };

    let deadline: string | null = null;
    let deadlineLabel: string | null = null;

    if (afterTitle) {
      const deadlineRaw = afterTitle.replace(/^(deadline|fällig|bis)\s+/i, '');
      const parsed = parseDeadline(deadlineRaw);
      if (parsed) {
        deadline = parsed.iso;
        deadlineLabel = parsed.label;
      } else {
        return {
          ok: false,
          error: `Datum "${deadlineRaw}" nicht erkannt. Versuche: morgen, heute, 25.03., nächste Woche`,
        };
      }
    }

    const preview = deadline
      ? `Task "${title}" · fällig ${deadlineLabel}`
      : `Task "${title}" erstellen`;

    return { ok: true, intent: { kind: 'create-task', title, deadline, deadlineLabel }, preview };
  }

  // ── create goal ──────────────────────────────────────────────────────────────
  for (const verb of GOAL_VERBS) {
    if (!startsWithVerb(lower, verb)) continue;

    const rest = input.slice(verb.length).trim();
    if (!rest) {
      return { ok: false, error: 'Goal-Titel fehlt. Beispiel: erstelle goal "Fitness"' };
    }

    const title = rest.replace(/^[""\u201c]|[""\u201d]$/g, '').trim();
    if (!title) return { ok: false, error: 'Goal-Titel fehlt.' };

    return {
      ok: true,
      intent: { kind: 'create-goal', title },
      preview: `Goal "${title}" erstellen`,
    };
  }

  // ── plan focus ───────────────────────────────────────────────────────────────
  for (const verb of FOCUS_VERBS) {
    if (!startsWithVerb(lower, verb)) continue;

    const rest = input.slice(verb.length).trim();
    const numMatch = rest.match(/^(\d+)\s*(?:min(?:uten?)?|m)?$/i);
    if (!numMatch) {
      return { ok: false, error: 'Dauer fehlt. Beispiel: fokus 25 oder focus 50min' };
    }

    const durationMin = parseInt(numMatch[1]!, 10);
    if (durationMin < 1 || durationMin > 180) {
      return { ok: false, error: 'Dauer muss zwischen 1 und 180 Minuten liegen.' };
    }

    return {
      ok: true,
      intent: { kind: 'plan-focus', durationMin },
      preview: `Focus-Session starten · ${durationMin} Minuten`,
    };
  }

  // ── open page ────────────────────────────────────────────────────────────────
  for (const verb of OPEN_VERBS) {
    if (!startsWithVerb(lower, verb)) continue;

    const rest = input.slice(verb.length).trim();
    if (!rest) {
      return { ok: false, error: 'Seite angeben. Beispiel: open goals' };
    }

    const page = resolvePage(rest);
    if (!page) {
      return {
        ok: false,
        error: `"${rest}" nicht gefunden. Verfügbar: Dashboard, Goals, Career, University, Calendar, Analytics, Settings`,
      };
    }

    return {
      ok: true,
      intent: { kind: 'open-page', page: page.label, path: page.path },
      preview: `Öffne ${page.label}`,
    };
  }

  // Input starts with ">" but no verb matched
  if (forced) {
    return {
      ok: false,
      error: 'Befehl nicht erkannt. Versuche: erstelle task, focus 25, open goals, erstelle goal',
    };
  }

  return null;
}
