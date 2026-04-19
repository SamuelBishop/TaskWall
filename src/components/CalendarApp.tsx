import { useState, useEffect } from 'react';
import { formatFullDate } from '../utils/date';
import { GridIcon } from './HomeScreen';

interface CalendarAppProps {
  onNavigateHome: () => void;
}

export default function CalendarApp({ onNavigateHome }: CalendarAppProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <header className="flex items-center justify-between px-8 py-5 border-b border-wall-border">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-wall-muted hover:text-wall-text rounded-lg hover:bg-wall-surface transition-all"
            title="Home"
          >
            <GridIcon />
          </button>
          <h1 className="text-3xl font-bold text-wall-text tracking-tight">
            Calendar
          </h1>
        </div>

        <div className="text-center">
          <p className="text-xl font-medium text-wall-text">
            {formatFullDate(now)}
          </p>
        </div>

        <div className="w-[44px]" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <span className="text-7xl mb-6">📅</span>
        <p className="text-2xl font-bold text-wall-text mb-2">Calendar</p>
        <p className="text-lg text-wall-muted">Coming Soon</p>
      </main>
    </>
  );
}
