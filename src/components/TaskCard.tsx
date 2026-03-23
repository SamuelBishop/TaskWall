import { useState, useRef, useEffect } from 'react';
import type { TaskItem, Collaborator } from '../types';
import { formatDate, daysUntil } from '../utils/date';

interface TaskCardProps {
  task: TaskItem;
  variant: 'overdue' | 'today' | 'upcoming';
  collaborators: Collaborator[];
  onReassign: (taskId: string, assigneeId: string | null) => void;
}

const variantStyles = {
  overdue: {
    border: 'border-l-wall-overdue',
    dateBadge: 'text-wall-overdue',
  },
  today: {
    border: 'border-l-wall-today',
    dateBadge: 'text-wall-today',
  },
  upcoming: {
    border: 'border-l-wall-upcoming',
    dateBadge: 'text-wall-muted',
  },
};

function getFirstName(name: string): string {
  return name.split(' ')[0];
}

export default function TaskCard({
  task,
  variant,
  collaborators,
  onReassign,
}: TaskCardProps) {
  const styles = variantStyles[variant];
  const relative = daysUntil(task.due);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popoverOpen]);

  return (
    <div
      className={`border-l-[3px] ${styles.border} bg-wall-surface rounded-r-lg px-4 py-3 mb-2.5 transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-wall-text text-[15px] font-medium leading-snug truncate flex-1">
          {task.title}
        </p>

        <div className="relative flex-shrink-0" ref={popoverRef}>
          <button
            onClick={() => setPopoverOpen((o) => !o)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              task.assigneeName
                ? 'bg-wall-today/10 text-wall-today border-wall-today/20 hover:bg-wall-today/20'
                : 'bg-gray-100 text-wall-muted border-gray-200 hover:bg-gray-200'
            }`}
            title={task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Unassigned — click to assign'}
          >
            {task.assigneeName ? getFirstName(task.assigneeName) : '—'}
          </button>

          {popoverOpen && (
            <div className="absolute right-0 top-7 z-50 bg-white border border-wall-border rounded-lg shadow-lg py-1 min-w-[160px]">
              <button
                onClick={() => {
                  onReassign(task.id, null);
                  setPopoverOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                  !task.assigneeId ? 'text-wall-today font-medium' : 'text-wall-text'
                }`}
              >
                Unassigned
              </button>
              {collaborators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onReassign(task.id, c.id);
                    setPopoverOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                    task.assigneeId === c.id ? 'text-wall-today font-medium' : 'text-wall-text'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className={`text-xs ${styles.dateBadge}`}>
          {formatDate(task.due)}
        </span>
        {relative && variant !== 'today' && (
          <span className="text-xs text-wall-muted">• {relative}</span>
        )}
      </div>
    </div>
  );
}
