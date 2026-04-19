import { useEffect, useRef } from 'react';
import { useDragScroll } from '../hooks/useDragScroll';
import type { CalendarEvent } from '../types';

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  allEvents: CalendarEvent[];
}

const HOUR_HEIGHT = 56;
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function formatTime12(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Simple overlap layout: assign columns to overlapping events */
function layoutEvents(events: CalendarEvent[]) {
  const timed = events
    .filter((e) => !e.allDay)
    .sort((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime());

  const columns: CalendarEvent[][] = [];
  for (const event of timed) {
    let placed = false;
    for (const col of columns) {
      const last = col[col.length - 1];
      if (last.end.getTime() <= event.start.getTime()) {
        col.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([event]);
  }

  const totalCols = columns.length || 1;
  const result: Array<{ event: CalendarEvent; left: number; width: number }> = [];
  columns.forEach((col, idx) => {
    for (const event of col) {
      result.push({ event, left: idx / totalCols, width: 1 / totalCols });
    }
  });
  return result;
}

function eventTop(event: CalendarEvent): number {
  const h = event.start.getHours() + event.start.getMinutes() / 60;
  return (Math.max(h, START_HOUR) - START_HOUR) * HOUR_HEIGHT;
}

function eventHeight(event: CalendarEvent): number {
  const startH = Math.max(event.start.getHours() + event.start.getMinutes() / 60, START_HOUR);
  const endH = Math.min(event.end.getHours() + event.end.getMinutes() / 60, END_HOUR);
  return Math.max((endH - startH) * HOUR_HEIGHT, 26);
}

export default function CalendarDayView({ date, events, allEvents }: DayViewProps) {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const nowLineRef = useRef<HTMLDivElement>(null);
  const isToday = isSameDay(date, new Date());

  // Scroll to current time on mount
  useEffect(() => {
    if (isToday && nowLineRef.current) {
      nowLineRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isToday]);

  const dayEvents = events.filter((e) => {
    if (e.allDay) {
      return e.start <= date && e.end > date;
    }
    return isSameDay(e.start, date);
  });

  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);
  const laid = layoutEvents(timedEvents);

  // Current time indicator
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowTop = (nowH - START_HOUR) * HOUR_HEIGHT;
  const showNowLine = isToday && nowH >= START_HOUR && nowH <= END_HOUR;

  // Upcoming days for sidebar (next 3 days)
  const upcomingDays: { date: Date; events: CalendarEvent[] }[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    const dayEvts = allEvents.filter((e) => {
      if (e.allDay) return e.start <= d && e.end > d;
      return isSameDay(e.start, d);
    });
    upcomingDays.push({ date: d, events: dayEvts });
  }

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Main timeline */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="flex-shrink-0 px-8 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-wall-muted mb-2 ml-16">All Day</p>
            <div className="flex gap-2 ml-16">
              {allDayEvents.map((e) => (
                <div
                  key={e.id}
                  className="border-l-[3px] bg-wall-surface rounded-r-lg px-4 py-2 text-base font-medium text-wall-text truncate max-w-[280px]"
                  style={{ borderLeftColor: e.color }}
                >
                  {e.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable time grid */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-8 pb-5 select-none touch-pan-y cursor-grab active:cursor-grabbing">
          <div className="relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
            {/* Hour lines */}
            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
              <div key={i} className="absolute left-0 right-0 flex items-start" style={{ top: i * HOUR_HEIGHT }}>
                <span className="text-xs text-wall-muted w-14 text-right pr-3 -mt-[8px] flex-shrink-0 tabular-nums">
                  {formatHourLabel(START_HOUR + i)}
                </span>
                <div className="flex-1 border-t border-wall-border" />
              </div>
            ))}

            {/* Events */}
            <div className="absolute left-16 right-0 top-0 bottom-0">
              {laid.map(({ event, left, width }) => (
                <div
                  key={event.id}
                  className="absolute border-l-[3px] bg-wall-surface rounded-r-lg px-3 py-2 overflow-hidden hover:shadow-md transition-shadow cursor-default"
                  style={{
                    borderLeftColor: event.color,
                    top: eventTop(event),
                    height: eventHeight(event),
                    left: `${left * 100}%`,
                    width: `calc(${width * 100}% - 4px)`,
                  }}
                >
                  <p className="text-base font-semibold text-wall-text truncate leading-tight">{event.title}</p>
                  <p className="text-xs text-wall-muted truncate">
                    {formatTime12(event.start)} – {formatTime12(event.end)}
                    {event.calendarName && <span className="ml-1.5 opacity-70">· {event.calendarName}</span>}
                  </p>
                  {event.location && eventHeight(event) > 56 && (
                    <p className="text-xs text-wall-muted truncate mt-0.5">{event.location}</p>
                  )}
                </div>
              ))}

              {/* Now indicator */}
              {showNowLine && (
                <div ref={nowLineRef} className="absolute left-0 right-0 z-10 flex items-center pointer-events-none" style={{ top: nowTop }}>
                  <div className="w-3 h-3 rounded-full bg-wall-overdue -ml-[6px] flex-shrink-0" />
                  <div className="flex-1 h-[2px] bg-wall-overdue" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: upcoming days */}
      <div className="w-[300px] flex-shrink-0 border-l border-wall-border overflow-y-auto px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-wall-muted mb-4">Upcoming</p>
        {upcomingDays.map(({ date: d, events: evts }) => (
          <div key={d.toISOString()} className="mb-5">
            <p className={`text-base font-semibold mb-2 ${isSameDay(d, new Date(new Date().setDate(new Date().getDate() + 1))) ? 'text-wall-today' : 'text-wall-text'}`}>
              {formatShortDate(d)}
            </p>
            {evts.length === 0 ? (
              <p className="text-sm text-wall-muted italic">No events</p>
            ) : (
              evts.slice(0, 5).map((e) => (
                <div
                  key={e.id}
                  className="border-l-[3px] bg-wall-surface rounded-r-lg px-3 py-2.5 mb-2 transition-all hover:shadow-sm"
                  style={{ borderLeftColor: e.color }}
                >
                  <p className="text-base font-medium text-wall-text truncate">{e.title}</p>
                  <p className="text-xs text-wall-muted">
                    {e.allDay ? 'All day' : formatTime12(e.start)}
                    {e.calendarName && <span className="ml-1 opacity-70">· {e.calendarName}</span>}
                  </p>
                </div>
              ))
            )}
            {evts.length > 5 && (
              <p className="text-xs text-wall-muted mt-1">+{evts.length - 5} more</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
