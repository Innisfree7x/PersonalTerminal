export type EventType = 'meeting' | 'task' | 'break';

export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    type: EventType;
    description?: string;
}
