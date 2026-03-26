import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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

  const btnRef = useRef<HTMLButtonElement>(null);
  const calRef = useRef<HTMLDivElement>(null);
  const [calPos, setCalPos] = useState({ top: 0, left: 0 });
  const [calReady, setCalReady] = useState(false);

  const updateCalPos = useCallback(() => {
    if (!btnRef.current || !calRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const calRect = calRef.current.getBoundingClientRect();
    let top = rect.bottom + 4;
    let left = rect.left;
    if (top + calRect.height > window.innerHeight - 8) {
      top = Math.max(8, rect.top - calRect.height - 4);
    }
    if (left + calRect.width > window.innerWidth - 8) {
      left = window.innerWidth - calRect.width - 8;
    }
    if (left < 8) left = 8;
    setCalPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) { setCalReady(false); return; }
    const rafId = requestAnimationFrame(() => {
      updateCalPos();
      setCalReady(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, [open, updateCalPos, viewMonth, viewYear]);

  // Close calendar on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (calRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div>
      <button
        ref={btnRef}
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

      {open && createPortal(
        <div
          ref={calRef}
          style={{ top: calPos.top, left: calPos.left, visibility: calReady ? 'visible' : 'hidden' }}
          className="fixed z-[60] bg-white border border-wall-border rounded-xl shadow-lg p-3 w-[300px]"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="min-h-[32px] min-w-[32px] flex items-center justify-center text-xl text-wall-muted hover:text-wall-text rounded-lg hover:bg-wall-surface transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-wall-text">
              {formatMonthYear(viewYear, viewMonth)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="min-h-[32px] min-w-[32px] flex items-center justify-center text-xl text-wall-muted hover:text-wall-text rounded-lg hover:bg-wall-surface transition-colors"
            >
              ›
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-wall-muted py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
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
                  className={`min-h-[32px] rounded-lg text-sm font-medium transition-colors ${
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
          <div className="flex justify-between mt-2 pt-2 border-t border-wall-border">
            <button
              type="button"
              onClick={handleClear}
              className="min-h-[32px] px-3 text-sm text-wall-muted hover:text-wall-overdue transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="min-h-[32px] px-3 text-sm font-medium text-wall-today hover:text-wall-today/70 transition-colors"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
