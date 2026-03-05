import { AI_COMMAND_MAX_CHARS } from '@/lib/ai/contracts';

export interface GuardrailResult {
  ok: boolean;
  value?: string;
  error?: string;
}

/**
 * Removes non-printable control chars and normalizes whitespace.
 * Keeps command semantics intact while reducing parser edge cases from copy/paste input.
 */
export function normalizeCommandInput(raw: string): string {
  return raw.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function guardCommandInput(raw: string): GuardrailResult {
  const normalized = normalizeCommandInput(raw);
  if (!normalized) {
    return { ok: true, value: '' };
  }

  if (normalized.length > AI_COMMAND_MAX_CHARS) {
    return {
      ok: false,
      error: `Befehl ist zu lang (max ${AI_COMMAND_MAX_CHARS} Zeichen).`,
    };
  }

  return { ok: true, value: normalized };
}

