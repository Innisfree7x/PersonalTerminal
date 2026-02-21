import { format } from 'date-fns';

interface DeadlineReminderInput {
  fullName?: string | null;
  courseName: string;
  examDate: string;
  daysUntil: number;
  dashboardUrl: string;
  settingsUrl: string;
}

interface WeeklyReportInput {
  fullName?: string | null;
  weekLabel: string;
  focusMinutes: number;
  focusDeltaMinutes?: number | null;
  sessionsCount: number;
  completedTasks: number;
  openTasks: number;
  upcomingDeadlines: Array<{ title: string; dueDate: string; daysUntil: number }>;
  dashboardUrl: string;
  settingsUrl: string;
}

interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

function greeting(fullName?: string | null): string {
  if (!fullName) return 'Hallo,';
  return `Hallo ${fullName},`;
}

function formatDateLabel(dateIso: string): string {
  return format(new Date(dateIso), 'dd.MM.yyyy');
}

function deadlineSubject(daysUntil: number, courseName: string): string {
  if (daysUntil === 14) return `📅 Prüfung in 2 Wochen — ${courseName}`;
  if (daysUntil === 7) return `⚠️ Noch 7 Tage bis zur Prüfung — ${courseName}`;
  if (daysUntil === 3) return `🔴 Prüfung übermorgen — ${courseName}`;
  return `Prüfung in ${daysUntil} Tagen — ${courseName}`;
}

export function buildDeadlineReminderEmail(input: DeadlineReminderInput): EmailTemplate {
  const subject = deadlineSubject(input.daysUntil, input.courseName);
  const greet = greeting(input.fullName);
  const formattedDate = formatDateLabel(input.examDate);

  const text = `${greet}

Deine Prüfung in ${input.courseName} ist am ${formattedDate} — also in ${input.daysUntil} Tagen.

Zum Dashboard: ${input.dashboardUrl}

Viel Erfolg,
INNIS

---
Du erhältst diese E-Mail, weil du Kurse in INNIS angelegt hast.
Einstellungen: ${input.settingsUrl}`;

  const html = `
    <p>${greet}</p>
    <p>deine Prüfung in <strong>${input.courseName}</strong> ist am <strong>${formattedDate}</strong> — also in <strong>${input.daysUntil} Tagen</strong>.</p>
    <p><a href="${input.dashboardUrl}">→ Zum Dashboard</a></p>
    <p>Viel Erfolg,<br/>INNIS</p>
    <hr />
    <p style="font-size:12px;color:#6b7280;">Du erhältst diese E-Mail, weil du Kurse in INNIS angelegt hast.<br/>Einstellungen: <a href="${input.settingsUrl}">${input.settingsUrl}</a></p>
  `;

  return { subject, text, html };
}

export function buildWeeklyReportEmail(input: WeeklyReportInput): EmailTemplate {
  const greet = greeting(input.fullName);
  const delta =
    typeof input.focusDeltaMinutes === 'number'
      ? ` (${input.focusDeltaMinutes >= 0 ? '↑' : '↓'} ${Math.abs(input.focusDeltaMinutes)} min vs. Vorwoche)`
      : '';
  const deadlinesText =
    input.upcomingDeadlines.length === 0
      ? 'Keine kritischen Deadlines in den nächsten 14 Tagen.'
      : input.upcomingDeadlines
          .map((d) => `• ${d.title} — in ${d.daysUntil} Tagen (${formatDateLabel(d.dueDate)})`)
          .join('\n');

  const subject = `Dein Wochenreport (${input.weekLabel})`;
  const text = `${greet}

Deine Woche (${input.weekLabel})
────────────────────────
Fokus-Zeit gesamt: ${input.focusMinutes} min${delta}
Sessions: ${input.sessionsCount}
Aufgaben: ${input.completedTasks} erledigt, ${input.openTasks} offen

Kommende Deadlines:
${deadlinesText}
────────────────────────
Zum Dashboard: ${input.dashboardUrl}

---
Benachrichtigungen verwalten: ${input.settingsUrl}`;

  const htmlDeadlines =
    input.upcomingDeadlines.length === 0
      ? '<li>Keine kritischen Deadlines in den nächsten 14 Tagen.</li>'
      : input.upcomingDeadlines
          .map(
            (d) =>
              `<li><strong>${d.title}</strong> — in ${d.daysUntil} Tagen (${formatDateLabel(d.dueDate)})</li>`
          )
          .join('');

  const html = `
    <p>${greet}</p>
    <p><strong>Deine Woche (${input.weekLabel})</strong></p>
    <p>Fokus-Zeit gesamt: <strong>${input.focusMinutes} min</strong>${delta}<br/>Sessions: <strong>${input.sessionsCount}</strong><br/>Aufgaben: <strong>${input.completedTasks}</strong> erledigt, <strong>${input.openTasks}</strong> offen</p>
    <p><strong>Kommende Deadlines:</strong></p>
    <ul>${htmlDeadlines}</ul>
    <p><a href="${input.dashboardUrl}">→ Zum Dashboard öffnen</a></p>
    <hr />
    <p style="font-size:12px;color:#6b7280;">Benachrichtigungen verwalten: <a href="${input.settingsUrl}">${input.settingsUrl}</a></p>
  `;

  return { subject, text, html };
}
