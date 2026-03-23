import { formatFullDate, formatTime } from '../utils/date';
import type { Collaborator } from '../types';

interface HeaderProps {
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
  collaborators: Collaborator[];
  assigneeFilter: string | null;
  onAssigneeFilter: (id: string | null) => void;
}

export default function Header({
  lastUpdated,
  loading,
  onRefresh,
  collaborators,
  assigneeFilter,
  onAssigneeFilter,
}: HeaderProps) {
  const now = new Date();

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-wall-border">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-wall-text tracking-tight">
          TaskWall
        </h1>
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-wall-text">
          {formatFullDate(now)}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {collaborators.length > 0 && (
          <select
            value={assigneeFilter ?? ''}
            onChange={(e) => onAssigneeFilter(e.target.value || null)}
            className="text-xs bg-wall-surface border border-wall-border rounded px-2 py-1 text-wall-text"
          >
            <option value="">All people</option>
            <option value="__unassigned__">Unassigned</option>
            {collaborators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

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
