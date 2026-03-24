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
    due?: { date?: string; string?: string };
    assignee_id?: string | null;
  }) => Promise<void>;
  page: 'main' | 'overdue' | 'future';
  onPageChange: (page: 'main' | 'overdue' | 'future') => void;
}

export default function Header({
  lastUpdated,
  loading,
  onRefresh,
  collaborators,
  assigneeFilter,
  onAssigneeFilter,
  onAddTask,
  page,
  onPageChange,
}: HeaderProps) {
  const now = new Date();
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedLabel = assigneeFilter === '__unassigned__'
    ? 'Unassigned'
    : assigneeFilter
      ? collaborators.find((c) => c.id === assigneeFilter)?.name ?? 'All'
      : 'All';

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-wall-border">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-wall-text tracking-tight">
          TaskWall
        </h1>
      </div>

      <div className="text-center">
        <p className="text-xl font-medium text-wall-text">
          {formatFullDate(now)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {page === 'main' ? (
          <>
            <button
              onClick={() => onPageChange('overdue')}
              className="min-h-[44px] px-4 rounded-lg border border-wall-border bg-wall-surface text-wall-text text-base font-semibold hover:bg-wall-border/50 hover:scale-105 active:scale-95 transition-all"
              title="View overdue tasks"
            >
              Overdue
            </button>
            <button
              onClick={() => onPageChange('future')}
              className="min-h-[44px] px-4 rounded-lg border border-wall-border bg-wall-surface text-wall-text text-base font-semibold hover:bg-wall-border/50 hover:scale-105 active:scale-95 transition-all"
              title="View future tasks"
            >
              Future
            </button>
          </>
        ) : (
          <button
            onClick={() => onPageChange('main')}
            className="min-h-[44px] px-4 rounded-lg border border-wall-border bg-wall-surface text-wall-text text-base font-semibold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all"
            title="Back to main"
          >
            ← Main
          </button>
        )}

        <AddTaskForm collaborators={collaborators} onAdd={onAddTask} />

        {collaborators.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className="min-h-[44px] text-sm px-4 rounded-lg border border-wall-border bg-wall-surface text-wall-text hover:bg-wall-border/50 hover:scale-105 active:scale-95 transition-all"
            >
              {selectedLabel} ▾
            </button>
            <Popover open={filterOpen} onClose={() => setFilterOpen(false)} className="right-0 top-12 py-2 min-w-[200px]">
              <button
                onClick={() => { onAssigneeFilter(null); setFilterOpen(false); }}
                className={`w-full text-left px-5 py-3.5 text-base hover:bg-wall-surface transition-colors ${
                  !assigneeFilter ? 'text-wall-today font-medium' : 'text-wall-text'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { onAssigneeFilter('__unassigned__'); setFilterOpen(false); }}
                className={`w-full text-left px-5 py-3.5 text-base hover:bg-wall-surface transition-colors ${
                  assigneeFilter === '__unassigned__' ? 'text-wall-today font-medium' : 'text-wall-text'
                }`}
              >
                Unassigned
              </button>
              {collaborators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onAssigneeFilter(c.id); setFilterOpen(false); }}
                  className={`w-full text-left px-5 py-3.5 text-base hover:bg-wall-surface transition-colors ${
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
          <span className="text-sm text-wall-muted">
            Updated {formatTime(lastUpdated)}
          </span>
        )}
        {loading && (
          <span className="text-sm text-wall-today animate-pulse">
            Syncing…
          </span>
        )}
        <button
          onClick={onRefresh}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-wall-muted hover:text-wall-text text-xl hover:rotate-180 transition-all duration-500 rounded-lg hover:bg-wall-surface"
          title="Refresh tasks"
        >
          ↻
        </button>
      </div>
    </header>
  );
}
