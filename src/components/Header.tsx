import { formatFullDate, formatTime } from '../utils/date';

interface HeaderProps {
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function Header({
  lastUpdated,
  loading,
  onRefresh,
}: HeaderProps) {
  const now = new Date();

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-wall-border">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-wall-text tracking-tight">
          TaskWall
        </h1>
      </div>

      {/* Center: Date */}
      <div className="text-center">
        <p className="text-lg font-medium text-wall-text">
          {formatFullDate(now)}
        </p>
      </div>

      {/* Right: Status */}
      <div className="flex items-center gap-4">
        {lastUpdated && (
          <span className="text-xs text-wall-muted">
            Updated {formatTime(lastUpdated)}
          </span>
        )}
        {loading && (
          <span className="text-xs text-wall-today animate-pulse">
            Syncing…
          </span>
        )}
        <button
          onClick={onRefresh}
          className="text-wall-muted hover:text-wall-text text-sm transition-colors"
          title="Refresh tasks"
        >
          ↻
        </button>
      </div>
    </header>
  );
}
