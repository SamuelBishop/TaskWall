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
      className={`border-l-[3px] ${styles.border} bg-wall-surface rounded-r-lg px-4 py-3.5 mb-2.5 transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-wall-text text-base font-medium leading-snug truncate flex-1">
          {task.title}
        </p>

        {/* Assignee badge + delete */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setAssigneeOpen((o) => !o)}
              className={`min-h-[40px] min-w-[40px] text-sm px-3 py-1.5 rounded-full border transition-colors ${
                task.assigneeName
                  ? 'bg-wall-today/10 text-wall-today border-wall-today/20 hover:bg-wall-today/20'
                  : 'bg-gray-100 text-wall-muted border-gray-200 hover:bg-gray-200'
              }`}
              title={task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Unassigned — click to assign'}
            >
              {task.assigneeName ? getFirstName(task.assigneeName) : '—'}
            </button>

            <Popover open={assigneeOpen} onClose={() => setAssigneeOpen(false)} className="right-0 top-11 py-2 min-w-[200px]">
              <button
                onClick={() => { onReassign(task.id, null); setAssigneeOpen(false); }}
                className={`w-full text-left px-5 py-3.5 text-base hover:bg-gray-50 transition-colors ${
                  !task.assigneeId ? 'text-wall-today font-medium' : 'text-wall-text'
                }`}
              >
                Unassigned
              </button>
              {collaborators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onReassign(task.id, c.id); setAssigneeOpen(false); }}
                  className={`w-full text-left px-5 py-3.5 text-base hover:bg-gray-50 transition-colors ${
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
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-sm rounded-full border border-gray-200 bg-gray-100 text-wall-muted hover:bg-red-50 hover:text-wall-overdue hover:border-wall-overdue/30 transition-colors"
            title="Delete task"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-1">
        {/* Clickable date badge → opens date picker */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              setDateOpen((o) => !o);
              setDateValue(toDateInputValue(task.due));
              setRecurrence(task.isRecurring && task.dueString ? task.dueString : '');
            }}
            className={`text-sm min-h-[36px] px-2 ${styles.dateBadge} hover:underline whitespace-nowrap`}
          >
            {formatDate(task.due)}
          </button>

          <Popover open={dateOpen} onClose={() => setDateOpen(false)} className="left-0 top-10 p-4 min-w-[320px]">
            <div className="space-y-3">
              <label className="block text-sm text-wall-muted font-medium">Due date</label>
              <input
                type="date"
                value={dateValue}
                onClick={(e) => e.currentTarget.showPicker()}
                onChange={(e) => { setDateValue(e.target.value); setRecurrence(''); }}
                className="w-full text-base border border-wall-border rounded-lg px-3 py-2.5 text-wall-text bg-white cursor-pointer"
              />
              <RecurrencePicker value={recurrence} onChange={setRecurrence} />
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleDateSave}
                  className="flex-1 text-base bg-wall-today text-white rounded-lg px-3 py-2.5 hover:bg-blue-700 transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  onClick={handleClearDate}
                  className="text-base text-wall-muted hover:text-wall-overdue px-3 py-2.5 transition-colors"
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
