import { useState } from 'react';
import { formatFullDate, formatTime } from '../utils/date';
import type { Collaborator } from '../types';
import AddTaskForm from './AddTaskForm';
import Popover from './Popover';

interface HeaderProps {
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
  collaborators: Collaborator[];
  assigneeFilter: string | null;
  onAssigneeFilter: (id: string | null) => void;
  onAddTask: (params: {
    content: string;
    due?: { date: string; is_recurring?: boolean };
    assignee_id?: string | null;
  }) => Promise<void>;
}

export default function Header({
  lastUpdated,
  loading,
  onRefresh,
  collaborators,
  assigneeFilter,
  onAssigneeFilter,
  onAddTask,
}: HeaderProps) {
  const now = new Date();
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedLabel = assigneeFilter === '__unassigned__'
    ? 'Unassigned'
    : assigneeFilter
      ? collaborators.find((c) => c.id === assigneeFilter)?.name ?? 'All'
      : 'All';

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

      <div className="flex items-center gap-3">
        <AddTaskForm collaborators={collaborators} onAdd={onAddTask} />

        {collaborators.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className="text-[11px] px-2 py-0.5 rounded border border-wall-border bg-wall-surface text-wall-text hover:bg-gray-100 transition-colors"
            >
              {selectedLabel} ▾
            </button>
            <Popover open={filterOpen} onClose={() => setFilterOpen(false)} className="right-0 top-6 py-1 min-w-[120px]">
              <button
                onClick={() => { onAssigneeFilter(null); setFilterOpen(false); }}
                className={`w-full text-left px-3 py-1 text-xs hover:bg-gray-50 transition-colors ${
                  !assigneeFilter ? 'text-wall-today font-medium' : 'text-wall-text'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { onAssigneeFilter('__unassigned__'); setFilterOpen(false); }}
                className={`w-full text-left px-3 py-1 text-xs hover:bg-gray-50 transition-colors ${
                  assigneeFilter === '__unassigned__' ? 'text-wall-today font-medium' : 'text-wall-text'
                }`}
              >
                Unassigned
              </button>
              {collaborators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onAssigneeFilter(c.id); setFilterOpen(false); }}
                  className={`w-full text-left px-3 py-1 text-xs hover:bg-gray-50 transition-colors ${
                    assigneeFilter === c.id ? 'text-wall-today font-medium' : 'text-wall-text'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </Popover>
          </div>
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
