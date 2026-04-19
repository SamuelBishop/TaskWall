import { useState, useEffect, useCallback, useRef } from 'react';
import { isConfigured, getCalendars, fetchAllEvents } from '../api/googleCalendar';
import type { CalendarEvent, CalendarConfig } from '../types';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export interface UseCalendarEventsResult {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  configured: boolean;
  calendars: CalendarConfig[];
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useCalendarEvents(
  rangeStart: Date,
  rangeEnd: Date,
): UseCalendarEventsResult {
  const configured = isConfigured();
  const calendars = getCalendars();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const loadEvents = useCallback(async (showLoading = true) => {
    if (!configured) return;
    if (showLoading) setLoading(true);
    try {
      const data = await fetchAllEvents(rangeStart, rangeEnd);
      setEvents(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [configured, rangeStart.getTime(), rangeEnd.getTime()]);

  // Fetch silently on range change (no "Syncing..." flash)
  useEffect(() => {
    loadEvents(false);
  }, [loadEvents]);

  // Polling shows the loading indicator
  useEffect(() => {
    if (!configured) return;
    intervalRef.current = setInterval(() => loadEvents(true), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [configured, loadEvents]);

  return {
    events,
    loading,
    error,
    configured,
    calendars,
    lastUpdated,
    refresh: () => loadEvents(true),
  };
}
