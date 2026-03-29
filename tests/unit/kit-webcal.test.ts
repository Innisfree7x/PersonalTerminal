import { describe, expect, it } from 'vitest';
import {
  extractCalendarName,
  maskCampusWebcalUrl,
  normalizeCampusWebcalUrl,
  parseCampusWebcalEvents,
} from '@/lib/kit-sync/webcal';

describe('kit webcal helpers', () => {
  const sampleIcs = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'X-WR-CALNAME:KIT Vorlesungen',
    'BEGIN:VEVENT',
    'UID:event-1@example',
    'DTSTAMP:20260329T100000Z',
    'DTSTART:20260401T081500Z',
    'DTEND:20260401T094500Z',
    'SUMMARY:Vorlesung Operations Research',
    'DESCRIPTION:Wöchentliche Vorlesung',
    'LOCATION:Geb. 50.34 Raum 101',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:event-2@example',
    'DTSTART;VALUE=DATE:20260410',
    'SUMMARY:Klausur Makroökonomie',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  it('normalizes webcal urls to https', () => {
    expect(normalizeCampusWebcalUrl('webcal://campus.studium.kit.edu/feed.ics')).toBe(
      'https://campus.studium.kit.edu/feed.ics'
    );
  });

  it('masks sensitive token-like parts in webcal urls', () => {
    expect(maskCampusWebcalUrl('https://campus.studium.kit.edu/events/feed.ics?token=abcdef123456')).toContain(
      'campus.studium.kit.edu'
    );
    expect(maskCampusWebcalUrl('https://campus.studium.kit.edu/events/feed.ics?token=abcdef123456')).toContain(
      'token='
    );
  });

  it('extracts calendar metadata and parses events', () => {
    expect(extractCalendarName(sampleIcs)).toBe('KIT Vorlesungen');

    const events = parseCampusWebcalEvents(sampleIcs);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      externalId: 'event-1@example',
      title: 'Vorlesung Operations Research',
      kind: 'lecture',
      allDay: false,
    });
    expect(events[1]).toMatchObject({
      externalId: 'event-2@example',
      title: 'Klausur Makroökonomie',
      kind: 'exam',
      allDay: true,
    });
  });

  it('parses local Europe/Berlin timestamps from tzid-based events into utc safely', () => {
    const tzidIcs = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:event-berlin@example',
      'DTSTART;TZID=Europe/Berlin:20260401T101500',
      'DTEND;TZID=Europe/Berlin:20260401T114500',
      'SUMMARY:Vorlesung Financial Data Science',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const [event] = parseCampusWebcalEvents(tzidIcs);
    expect(event?.startsAt).toBe('2026-04-01T08:15:00.000Z');
    expect(event?.endsAt).toBe('2026-04-01T09:45:00.000Z');
  });
});
