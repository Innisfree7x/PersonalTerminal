export type EventType = 'meeting' | 'task' | 'break';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: EventType;
  description?: string;
}

// Helper to create today's date at specific time
function todayAtTime(hours: number, minutes: number = 0): Date {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export const mockEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Morning Standup',
    startTime: todayAtTime(9, 0),
    endTime: todayAtTime(9, 30),
    type: 'meeting',
    description: 'Daily team standup',
  },
  {
    id: 'event-2',
    title: 'Code Review - Feature PR',
    startTime: todayAtTime(10, 0),
    endTime: todayAtTime(10, 45),
    type: 'task',
    description: 'Review PR #234',
  },
  {
    id: 'event-3',
    title: '1:1 with Manager',
    startTime: todayAtTime(11, 0),
    endTime: todayAtTime(11, 30),
    type: 'meeting',
    description: 'Weekly 1:1',
  },
  {
    id: 'event-4',
    title: 'Lunch Break',
    startTime: todayAtTime(12, 0),
    endTime: todayAtTime(13, 0),
    type: 'break',
    description: 'Lunch break',
  },
  {
    id: 'event-5',
    title: 'Sprint Planning',
    startTime: todayAtTime(14, 0),
    endTime: todayAtTime(15, 30),
    type: 'meeting',
    description: 'Sprint planning session',
  },
  {
    id: 'event-6',
    title: 'Implement New Feature',
    startTime: todayAtTime(15, 45),
    endTime: todayAtTime(17, 0),
    type: 'task',
    description: 'Work on new dashboard feature',
  },
  {
    id: 'event-7',
    title: 'Gym Session',
    startTime: todayAtTime(17, 30),
    endTime: todayAtTime(18, 30),
    type: 'break',
    description: 'Workout session',
  },
  {
    id: 'event-8',
    title: 'Client Call - Q&A',
    startTime: todayAtTime(16, 0),
    endTime: todayAtTime(16, 30),
    type: 'meeting',
    description: 'Client consultation call',
  },
];
