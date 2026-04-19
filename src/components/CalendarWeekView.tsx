import { useDragScroll } from '../hooks/useDragScroll';
import type { CalendarEvent } from '../types';

interface WeekViewProps {
  weekStart: Date;
  events: CalendarEvent[];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime12(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function getDayNumber(date: Date): number {
  return date.getDate();
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

export default function CalendarWeekView({ weekStart, events }: WeekViewProps) {
  const today = new Date();

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const dayEvents = getEventsForDay(events, day);
        return <DayColumn key={day.toISOString()} day={day} isToday={isToday} events={dayEvents} />;
      })}
    </div>
  );
}

function DayColumn({ day, isToday, events }: { day: Date; isToday: boolean; events: CalendarEvent[] }) {
  const scrollRef = useDragScroll<HTMLDivElement>();

  return (
    <div className={`flex-1 flex flex-col min-h-0 border-r border-wall-border last:border-r-0 ${isToday ? 'bg-wall-today/[0.03]' : ''}`}>
      {/* Day header */}
      <div className={`flex-shrink-0 text-center py-3 border-b border-wall-border ${isToday ? 'bg-wall-today/10' : ''}`}>
        <p className={`text-sm font-semibold uppercase tracking-wider ${isToday ? 'text-wall-today' : 'text-wall-muted'}`}>
          {getDayName(day)}
        </p>
        <p className={`text-xl font-bold leading-tight ${isToday ? 'text-wall-today' : 'text-wall-text'}`}>
          {getDayNumber(day)}
        </p>
      </div>

      {/* Events */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-2 py-2.5 select-none touch-pan-y cursor-grab active:cursor-grabbing">
        {events.length === 0 ? (
          <p className="text-sm text-wall-muted text-center mt-6 italic">No events</p>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="border-l-[3px] bg-wall-surface rounded-r-lg px-3 py-2.5 mb-2 transition-all hover:shadow-md animate-slide-in"
              style={{ borderLeftColor: e.color }}
            >
              <p className="text-base font-semibold text-wall-text truncate leading-tight">{e.title}</p>
              <p className="text-xs text-wall-muted truncate">
                {e.allDay ? 'All day' : formatTime12(e.start)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
