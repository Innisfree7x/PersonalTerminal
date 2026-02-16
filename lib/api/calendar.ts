/**
 * Google Calendar API client functions
 * Handles connection status, fetching events, and disconnection
 */

import { CalendarEvent } from '@/lib/data/mockEvents';

/**
 * Check if user is connected to Google Calendar
 * 
 * @returns Promise resolving to true if connected, false otherwise
 * 
 * @example
 * const isConnected = await checkGoogleCalendarConnection();
 * if (isConnected) {
 *   // Fetch events
 * }
 */
export async function checkGoogleCalendarConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/calendar/today');
    return response.status !== 401;
  } catch {
    return false;
  }
}

/**
 * Fetch today's events from Google Calendar
 * Transforms API response into CalendarEvent objects with proper Date instances
 * 
 * @returns Promise resolving to array of calendar events
 * @throws Error if user is unauthorized (401) or fetch fails
 * 
 * @example
 * try {
 *   const events = await fetchTodayCalendarEvents();
 *   console.log(`Found ${events.length} events`);
 * } catch (error) {
 *   if (error.message === 'UNAUTHORIZED') {
 *     // Redirect to auth
 *   }
 * }
 */
export async function fetchTodayCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await fetch('/api/calendar/today');

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('Failed to fetch events');
  }

  const data = await response.json();
  
  // Transform API response to CalendarEvent with proper Date objects
  return data.map((event: any) => ({
    ...event,
    startTime: new Date(event.startTime),
    endTime: new Date(event.endTime),
  }));
}

/**
 * Initiate Google Calendar OAuth flow
 * Redirects user to Google authentication page
 * 
 * @example
 * <button onClick={() => connectGoogleCalendar()}>
 *   Connect Calendar
 * </button>
 */
export function connectGoogleCalendar(): void {
  window.location.href = '/api/auth/google';
}
