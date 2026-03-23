import { useState, useCallback } from 'react';
import type { TaskItem, Collaborator } from '../types';
import { formatDate, daysUntil } from '../utils/date';
import Popover from './Popover';
import RecurrencePicker from './RecurrencePicker';

interface TaskCardProps {
  task: TaskItem;
  variant: 'overdue' | 'today' | 'upcoming';
  collaborators: Collaborator[];
  onReassign: (taskId: string, assigneeId: string | null) => void;
  onUpdateDue: (taskId: string, due: { date?: string; string?: string } | null) => void;
  onDelete: (taskId: string) => void;
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

function toDateInputValue(date: Date | null): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function TaskCard({
  task,
  variant,
  collaborators,
  onReassign,
  onUpdateDue,
  onDelete,
}: TaskCardProps) {
  const styles = variantStyles[variant];
  const relative = daysUntil(task.due);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateValue, setDateValue] = useState(() => toDateInputValue(task.due));
  const [recurrence, setRecurrence] = useState(() => task.isRecurring && task.dueString ? task.dueString : '');

  const handleDateSave = useCallback(() => {
    if (recurrence.trim()) {
      // Use natural language string for recurring (e.g., "every friday")
      onUpdateDue(task.id, { string: recurrence.trim() });
    } else if (dateValue) {
      onUpdateDue(task.id, { date: dateValue });
    } else {
      onUpdateDue(task.id, null);
    }
    setDateOpen(false);
  }, [task.id, dateValue, recurrence, onUpdateDue]);

  const handleClearDate = useCallback(() => {
    onUpdateDue(task.id, null);
    setDateValue('');
    setRecurrence('');
    setDateOpen(false);
  }, [task.id, onUpdateDue]);

  return (
    <div
      className={`border-l-[3px] ${styles.border} bg-wall-surface rounded-r-lg px-4 py-3 mb-2.5 transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-wall-text text-[15px] font-medium leading-snug truncate flex-1">
          {task.title}
        </p>

        {/* Assignee badge + delete */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setAssigneeOpen((o) => !o)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                task.assigneeName
                  ? 'bg-wall-today/10 text-wall-today border-wall-today/20 hover:bg-wall-today/20'
                  : 'bg-gray-100 text-wall-muted border-gray-200 hover:bg-gray-200'
              }`}
              title={task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Unassigned — click to assign'}
            >
              {task.assigneeName ? getFirstName(task.assigneeName) : '—'}
            </button>

            <Popover open={assigneeOpen} onClose={() => setAssigneeOpen(false)} className="right-0 top-7 py-1 min-w-[160px]">
              <button
                onClick={() => { onReassign(task.id, null); setAssigneeOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                  !task.assigneeId ? 'text-wall-today font-medium' : 'text-wall-text'
                }`}
              >
                Unassigned
              </button>
              {collaborators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onReassign(task.id, c.id); setAssigneeOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                    task.assigneeId === c.id ? 'text-wall-today font-medium' : 'text-wall-text'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </Popover>
          </div>

          <button
            onClick={() => onDelete(task.id)}
            className="text-[11px] px-1.5 py-0.5 rounded-full border border-gray-200 bg-gray-100 text-wall-muted hover:bg-red-50 hover:text-wall-overdue hover:border-wall-overdue/30 transition-colors"
            title="Delete task"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
        {/* Clickable date badge → opens date picker */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              setDateOpen((o) => !o);
              setDateValue(toDateInputValue(task.due));
              setRecurrence(task.isRecurring && task.dueString ? task.dueString : '');
            }}
            className={`text-xs ${styles.dateBadge} hover:underline whitespace-nowrap`}
          >
            {formatDate(task.due)}
          </button>

          <Popover open={dateOpen} onClose={() => setDateOpen(false)} className="left-0 top-6 p-3 min-w-[260px]">
            <div className="space-y-2">
              <label className="block text-xs text-wall-muted font-medium">Due date</label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => { setDateValue(e.target.value); setRecurrence(''); }}
                className="w-full text-sm border border-wall-border rounded px-2 py-1 text-wall-text bg-white"
              />
              <RecurrencePicker value={recurrence} onChange={setRecurrence} />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDateSave}
                  className="flex-1 text-xs bg-wall-today text-white rounded px-2 py-1 hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleClearDate}
                  className="text-xs text-wall-muted hover:text-wall-overdue px-2 py-1 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </Popover>
        </div>

        {relative && variant !== 'today' && (
          <span className="text-xs text-wall-muted whitespace-nowrap">• {relative}</span>
        )}
        {task.isRecurring && task.dueString && (
          <span className="text-xs text-wall-muted whitespace-nowrap truncate">• ↻ {task.dueString}</span>
        )}
      </div>
    </div>
  );
}
