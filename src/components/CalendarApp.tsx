import { useState, useCallback, useMemo } from 'react';
import { GridIcon } from './HomeScreen';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { formatTime } from '../utils/date';
import CalendarDayView from './CalendarDayView';
import CalendarWeekView from './CalendarWeekView';
import CalendarMonthView from './CalendarMonthView';
import type { CalendarView } from '../types';

interface CalendarAppProps {
  onNavigateHome: () => void;
}

// ── Date helpers ─────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date): Date {
  const day = new Date(d);
  day.setDate(day.getDate() - day.getDay()); // Sunday start
  return startOfDay(day);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Date range for fetching based on view ────────────────────

function getDateRange(view: CalendarView, focus: Date): [Date, Date] {
  switch (view) {
    case 'day': {
      // Fetch a 5-day window so the sidebar has upcoming data
      const start = startOfDay(focus);
      return [start, addDays(start, 5)];
    }
    case 'week': {
      const ws = startOfWeek(focus);
      return [ws, addDays(ws, 7)];
    }
    case 'month': {
      // Fetch full calendar grid range (can include prev/next month days)
      const first = startOfMonth(focus);
      const gridStart = addDays(first, -first.getDay());
      return [gridStart, addDays(gridStart, 42)];
    }
  }
}

// ── Header date display ──────────────────────────────────────

function getHeaderDateLabel(view: CalendarView, focus: Date): string {
  switch (view) {
    case 'day':
      return focus.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'week': {
      const ws = startOfWeek(focus);
      const we = addDays(ws, 6);
      const sameMonth = ws.getMonth() === we.getMonth();
      if (sameMonth) {
        return `${ws.toLocaleDateString(undefined, { month: 'short' })} ${ws.getDate()} – ${we.getDate()}, ${we.getFullYear()}`;
      }
      return `${ws.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${we.getFullYear()}`;
    }
    case 'month':
      return focus.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
}

// ── Setup screen ─────────────────────────────────────────────

function CalendarSetupScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-12 gap-4">
      <span className="text-5xl">📅</span>
      <h2 className="text-2xl font-bold text-wall-text">Set up Google Calendar</h2>
      <div className="text-base text-wall-muted text-center max-w-lg space-y-2">
        <p>Run the setup script to authorize, then add credentials to your <code className="bg-wall-surface px-1.5 py-0.5 rounded text-sm">.env</code> file:</p>
        <div className="bg-wall-surface rounded-lg p-4 text-left text-sm font-mono space-y-1">
          <p className="text-wall-muted"># Run once per user to get refresh tokens:</p>
          <p>node scripts/google-auth.mjs &lt;client-id&gt; &lt;secret&gt;</p>
          <p className="mt-2"><span className="text-wall-today">VITE_GOOGLE_CLIENT_ID</span>=...</p>
          <p><span className="text-wall-today">VITE_GOOGLE_CLIENT_SECRET</span>=...</p>
          <p><span className="text-wall-today">VITE_GOOGLE_REFRESH_TOKEN</span>=...</p>
          <p><span className="text-wall-today">VITE_GOOGLE_REFRESH_TOKEN_SECONDARY</span>=...</p>
          <p><span className="text-wall-today">VITE_GOOGLE_CALENDARS</span>=email:Name:#color:primary,...</p>
        </div>
      </div>
    </div>
  );
}

// ── Main CalendarApp ─────────────────────────────────────────

export default function CalendarApp({ onNavigateHome }: CalendarAppProps) {
  const [view, setView] = useState<CalendarView>('week');
  const [focusDate, setFocusDate] = useState(() => startOfDay(new Date()));
  const [rangeStart, rangeEnd] = useMemo(() => getDateRange(view, focusDate), [view, focusDate]);

  const { events, loading, error, configured, calendars, lastUpdated, refresh } = useCalendarEvents(rangeStart, rangeEnd);

  // Navigation
  const goToday = useCallback(() => setFocusDate(startOfDay(new Date())), []);

  const goPrev = useCallback(() => {
    setFocusDate((d) => {
      switch (view) {
        case 'day': return addDays(d, -1);
        case 'week': return addDays(d, -7);
        case 'month': return addMonths(d, -1);
      }
    });
  }, [view]);

  const goNext = useCallback(() => {
    setFocusDate((d) => {
      switch (view) {
        case 'day': return addDays(d, 1);
        case 'week': return addDays(d, 7);
        case 'month': return addMonths(d, 1);
      }
    });
  }, [view]);

  const isToday = isSameDay(focusDate, new Date());

  if (!configured) {
    return (
      <>
        <Header
          onNavigateHome={onNavigateHome}
          dateLabel=""
          view={view}
          onViewChange={setView}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
          isToday={isToday}
          loading={loading}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          calendars={[]}
        />
        <CalendarSetupScreen />
      </>
    );
  }

  return (
    <>
      <Header
        onNavigateHome={onNavigateHome}
        dateLabel={getHeaderDateLabel(view, focusDate)}
        view={view}
        onViewChange={setView}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        isToday={isToday}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        calendars={calendars}
      />

      {error && (
        <div className="flex-shrink-0 bg-wall-overdue/10 border-b border-wall-overdue/20 px-8 py-2 text-sm text-wall-overdue">
          {error}
        </div>
      )}

      {view === 'day' && (
        <CalendarDayView date={focusDate} events={events} allEvents={events} />
      )}
      {view === 'week' && (
        <CalendarWeekView weekStart={startOfWeek(focusDate)} events={events} />
      )}
      {view === 'month' && (
        <CalendarMonthView date={focusDate} events={events} />
      )}
    </>
  );
}

// ── Header sub-component ─────────────────────────────────────

interface HeaderProps {
  onNavigateHome: () => void;
  dateLabel: string;
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isToday: boolean;
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  calendars: { id: string; name: string; color: string }[];
}

const VIEW_LABELS: { key: CalendarView; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

function Header({
  onNavigateHome, dateLabel, view, onViewChange,
  onPrev, onNext, onToday, isToday,
  loading, lastUpdated, onRefresh,
  calendars,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-wall-border flex-shrink-0">
      {/* Left: home + title */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <button
          onClick={onNavigateHome}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-wall-muted hover:text-wall-text rounded-lg hover:bg-wall-surface transition-all"
          title="Home"
        >
          <GridIcon />
        </button>
        <h1 className="text-2xl font-bold text-wall-text tracking-tight">Calendar</h1>
      </div>

      {/* Center: navigation + date */}
      <div className="flex items-center gap-3">
        {!isToday && (
          <button
            onClick={onToday}
            className="min-h-[36px] px-3 rounded-lg border border-wall-border bg-wall-surface text-sm font-semibold text-wall-text hover:bg-wall-border/50 hover:scale-105 active:scale-95 transition-all"
          >
            Today
          </button>
        )}
        <button
          onClick={onPrev}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-wall-border bg-wall-surface text-wall-muted hover:text-wall-text hover:bg-wall-border/50 active:scale-95 transition-all text-lg"
        >
          ‹
        </button>
        <p className="text-lg font-medium text-wall-text min-w-[240px] text-center">{dateLabel}</p>
        <button
          onClick={onNext}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-wall-border bg-wall-surface text-wall-muted hover:text-wall-text hover:bg-wall-border/50 active:scale-95 transition-all text-lg"
        >
          ›
        </button>
      </div>

      {/* Right: view toggle + filter + refresh */}
      <div className="flex items-center gap-2.5 min-w-[180px] justify-end">
        {/* View toggle */}
        <div className="flex rounded-lg border border-wall-border overflow-hidden">
          {VIEW_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
                view === key
                  ? 'bg-wall-today text-white'
                  : 'bg-wall-surface text-wall-muted hover:text-wall-text hover:bg-wall-border/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Calendar color legend */}
        {calendars.length > 0 && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-wall-border bg-wall-surface">
            {calendars.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-sm font-medium text-wall-text">{c.name}</span>
              </div>
            ))}
          </div>
        )}

        {lastUpdated && (
          <span className="text-xs text-wall-muted hidden xl:inline">
            {formatTime(lastUpdated)}
          </span>
        )}
        {loading && (
          <span className="text-xs text-wall-today animate-pulse">Syncing…</span>
        )}
        <button
          onClick={onRefresh}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-wall-muted hover:text-wall-text text-lg hover:rotate-180 transition-all duration-500 rounded-lg hover:bg-wall-surface"
          title="Refresh"
        >
          ↻
        </button>
      </div>
    </header>
  );
}
