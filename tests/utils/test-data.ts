/**
 * Mock data factories for testing
 * Provides realistic test data for components
 * 
 * @module tests/utils/test-data
 */

/**
 * Create mock activity item for ActivityFeed tests
 */
export function createMockActivity(overrides?: Partial<{
  id: string;
  type: 'task' | 'goal' | 'exercise' | 'application' | 'note';
  action: string;
  timestamp: Date;
}>) {
  return {
    id: '1',
    type: 'task' as const,
    action: 'Completed task: Review PRs',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

/**
 * Create mock calendar event
 */
export function createMockEvent(overrides?: Partial<{
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
}>) {
  return {
    id: '1',
    title: 'Team Meeting',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    description: 'Weekly sync',
    ...overrides,
  };
}

/**
 * Create mock stats data for QuickStatsBar
 */
export function createMockStats(overrides?: Partial<{
  eventsToday: number;
  productivity: number;
  focusTime: number;
  streak: number;
  goalsThisWeek: { completed: number; total: number };
  exercisesThisWeek: number;
}>) {
  return {
    eventsToday: 5,
    productivity: 85,
    focusTime: 6,
    streak: 7,
    goalsThisWeek: { completed: 2, total: 5 },
    exercisesThisWeek: 12,
    ...overrides,
  };
}

/**
 * Create mock day event for WeekOverview
 */
export function createMockDayEvent(overrides?: Partial<{
  date: Date;
  count: number;
  type: 'none' | 'low' | 'medium' | 'high';
}>) {
  return {
    date: new Date('2024-01-15'),
    count: 0,
    type: 'none' as const,
    ...overrides,
  };
}
