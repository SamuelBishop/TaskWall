import type { CalendarEvent } from '../types';

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime12Short(date: Date): string {
  const h = date.getHours();
  const suffix = h >= 12 ? 'p' : 'a';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}${suffix}`;
}

function getCalendarGrid(date: Date): Date[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0=Sun
  const gridStart = new Date(year, month, 1 - startDow);

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((e) => {
      if (e.allDay) return e.start <= day && e.end > day;
      return isSameDay(e.start, day);
    })
    .sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return a.start.getTime() - b.start.getTime();
    });
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE = 3;

export default function CalendarMonthView({ date, events }: MonthViewProps) {
  const today = new Date();
  const currentMonth = date.getMonth();
  const weeks = getCalendarGrid(date);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-6 py-3">
      {/* Day-of-week headers */}
      <div className="flex-shrink-0 grid grid-cols-7 mb-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-semibold uppercase tracking-wider text-wall-muted py-1.5">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-6 min-h-0">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-t border-wall-border min-h-0">
            {week.map((day) => {
              const isToday = isSameDay(day, today);
              const isCurrentMonth = day.getMonth() === currentMonth;
              const dayEvents = getEventsForDay(events, day);

              return (
                <div
                  key={day.toISOString()}
                  className={`flex flex-col border-r border-wall-border last:border-r-0 px-1.5 py-1 min-h-0 overflow-hidden ${
                    isToday ? 'bg-wall-today/[0.06]' : ''
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  {/* Day number */}
                  <div className="flex-shrink-0 flex items-center justify-end">
                    <span
                      className={`text-sm font-semibold leading-none px-2 py-1 rounded-full ${
                        isToday ? 'bg-wall-today text-white' : 'text-wall-text'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Event snippets */}
                  <div className="flex-1 min-h-0 overflow-hidden mt-0.5">
                    {dayEvents.slice(0, MAX_VISIBLE).map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-1 px-1 py-[2px] rounded truncate mb-[2px]"
                        title={`${e.title}${e.allDay ? '' : ` · ${formatTime12Short(e.start)}`} · ${e.calendarName}`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                        <span className="text-[11px] text-wall-text truncate leading-tight font-medium">
                          {!e.allDay && <span className="text-wall-muted mr-0.5">{formatTime12Short(e.start)}</span>}
                          {e.title}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > MAX_VISIBLE && (
                      <p className="text-[11px] text-wall-muted px-1 font-medium">
                        +{dayEvents.length - MAX_VISIBLE} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
