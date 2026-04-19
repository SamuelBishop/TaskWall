import type { CalendarEvent, CalendarConfig } from '../types';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET ?? '';
const calendarsRaw = import.meta.env.VITE_GOOGLE_CALENDARS ?? '';

const REFRESH_TOKENS: Record<string, string> = {
  primary: import.meta.env.VITE_GOOGLE_REFRESH_TOKEN ?? '',
  secondary: import.meta.env.VITE_GOOGLE_REFRESH_TOKEN_SECONDARY ?? '',
};

const GCAL_BASE = import.meta.env.DEV
  ? '/api/gcal'
  : 'https://www.googleapis.com/calendar/v3';

const TOKEN_URL = import.meta.env.DEV
  ? '/api/google-token'
  : 'https://oauth2.googleapis.com/token';

// ── Per-user token management ────────────────────────────────

const tokenCache: Record<string, { accessToken: string; expiresAt: number }> = {};

async function getAccessToken(tokenKey: 'primary' | 'secondary'): Promise<string> {
  const cached = tokenCache[tokenKey];
  if (cached && Date.now() < cached.expiresAt - 60_000) {
    return cached.accessToken;
  }

  const refreshToken = REFRESH_TOKENS[tokenKey];
  if (!refreshToken) {
    throw new Error(`No refresh token configured for "${tokenKey}"`);
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed for "${tokenKey}" (${res.status}): ${text}`);
  }

  const data: { access_token: string; expires_in: number } = await res.json();
  tokenCache[tokenKey] = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

// ── Configuration ────────────────────────────────────────────

export function isConfigured(): boolean {
  return (
    clientId.length > 0 &&
    clientSecret.length > 0 &&
    (REFRESH_TOKENS.primary.length > 0 || REFRESH_TOKENS.secondary.length > 0) &&
    calendarsRaw.length > 0
  );
}

export function getCalendars(): CalendarConfig[] {
  if (!calendarsRaw) return [];
  return calendarsRaw.split(',').map((entry: string) => {
    const parts = entry.trim().split(':');
    const id = parts[0].trim();
    const name = parts[1]?.trim() ?? id;
    const color = parts[2]?.trim() ?? '#2a8f82';
    const tokenKey = (parts[3]?.trim() === 'secondary' ? 'secondary' : 'primary') as 'primary' | 'secondary';
    return { id, name, color, tokenKey };
  });
}

// ── API types ────────────────────────────────────────────────

interface GCalEvent {
  id: string;
  summary?: string;
  location?: string;
  status?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface GCalEventsResponse {
  items?: GCalEvent[];
  nextPageToken?: string;
}

// ── Fetch events ─────────────────────────────────────────────

async function fetchCalendarEvents(
  calendarId: string,
  tokenKey: 'primary' | 'secondary',
  timeMin: string,
  timeMax: string,
): Promise<GCalEvent[]> {
  const token = await getAccessToken(tokenKey);
  const allEvents: GCalEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const url = `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 404) return [];
      if (res.status === 401) {
        delete tokenCache[tokenKey];
        throw new Error(`Access token expired for "${tokenKey}". Will retry on next refresh.`);
      }
      const text = await res.text();
      throw new Error(`Google Calendar API error (${res.status}): ${text}`);
    }

    const data: GCalEventsResponse = await res.json();
    if (data.items) {
      allEvents.push(...data.items.filter((e) => e.status !== 'cancelled'));
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allEvents;
}

// ── Parse events ─────────────────────────────────────────────

function parseEvent(raw: GCalEvent, cal: CalendarConfig): CalendarEvent {
  const allDay = !raw.start.dateTime;

  let start: Date;
  let end: Date;

  if (allDay) {
    const [sy, sm, sd] = raw.start.date!.split('-').map(Number);
    start = new Date(sy, sm - 1, sd);
    const [ey, em, ed] = raw.end.date!.split('-').map(Number);
    end = new Date(ey, em - 1, ed);
  } else {
    start = new Date(raw.start.dateTime!);
    end = new Date(raw.end.dateTime!);
  }

  return {
    id: `${cal.id}::${raw.id}`,
    title: raw.summary ?? '(No title)',
    start,
    end,
    allDay,
    calendarId: cal.id,
    calendarName: cal.name,
    color: cal.color,
    location: raw.location ?? undefined,
  };
}

// ── Public API ────────────────────────────────────────────────

export async function fetchAllEvents(
  timeMin: Date,
  timeMax: Date,
): Promise<CalendarEvent[]> {
  const calendars = getCalendars();
  const minISO = timeMin.toISOString();
  const maxISO = timeMax.toISOString();

  const settled = await Promise.allSettled(
    calendars.map(async (cal) => {
      const raw = await fetchCalendarEvents(cal.id, cal.tokenKey, minISO, maxISO);
      return raw.map((e) => parseEvent(e, cal));
    }),
  );

  const allEvents: CalendarEvent[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value);
    } else {
      console.warn('Calendar fetch failed:', result.reason);
    }
  }

  return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
}
