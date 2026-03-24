import { useState, useCallback } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  placeholder?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseYMD(s: string): { year: number; month: number; day: number } | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

export default function DatePicker({ value, onChange, placeholder = 'Pick a date' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseYMD(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? now.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const selectDay = useCallback((day: number) => {
    onChange(toYMD(viewYear, viewMonth, day));
    setOpen(false);
  }, [viewYear, viewMonth, onChange]);

  const handleToday = useCallback(() => {
    const t = new Date();
    onChange(toYMD(t.getFullYear(), t.getMonth(), t.getDate()));
    setOpen(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setOpen(false);
  }, [onChange]);

  const displayText = parsed
    ? new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : placeholder;

  const todayYMD = toYMD(now.getFullYear(), now.getMonth(), now.getDate());

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) {
            // Reset view to selected date or today
            const p = parseYMD(value);
            setViewYear(p?.year ?? now.getFullYear());
            setViewMonth(p?.month ?? now.getMonth());
          }
          setOpen((o) => !o);
        }}
        className={`w-full text-left text-base border border-wall-border rounded-lg px-3 py-2.5 bg-white cursor-pointer transition-colors hover:bg-wall-surface ${
          parsed ? 'text-wall-text' : 'text-wall-muted'
        }`}
      >
        {displayText}
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-12 bg-white border border-wall-border rounded-xl shadow-lg p-5 w-[420px]">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center text-2xl text-wall-muted hover:text-wall-text rounded-lg hover:bg-wall-surface transition-colors"
            >
              ‹
            </button>
            <span className="text-lg font-semibold text-wall-text">
              {formatMonthYear(viewYear, viewMonth)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center text-2xl text-wall-muted hover:text-wall-text rounded-lg hover:bg-wall-surface transition-colors"
            >
              ›
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-sm font-semibold text-wall-muted py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e${i}`} />;
              }
              const ymd = toYMD(viewYear, viewMonth, day);
              const isSelected = value === ymd;
              const isToday = todayYMD === ymd;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`min-h-[48px] rounded-lg text-base font-medium transition-colors ${
                    isSelected
                      ? 'bg-wall-today text-white'
                      : isToday
                        ? 'bg-wall-today/15 text-wall-today font-bold'
                        : 'text-wall-text hover:bg-wall-surface'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-4 pt-3 border-t border-wall-border">
            <button
              type="button"
              onClick={handleClear}
              className="min-h-[44px] px-5 text-base text-wall-muted hover:text-wall-overdue transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="min-h-[44px] px-5 text-base font-medium text-wall-today hover:text-wall-today/70 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
