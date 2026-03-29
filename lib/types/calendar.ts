export type EventType = 'meeting' | 'task' | 'break';
export type CalendarEventSource = 'google' | 'kit';
export type CalendarEventKind = 'lecture' | 'exercise' | 'exam' | 'deadline' | 'other';

export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    type: EventType;
    description?: string;
    location?: string;
    source?: CalendarEventSource;
    kind?: CalendarEventKind;
}
