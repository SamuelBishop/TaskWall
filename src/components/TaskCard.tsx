import { useState, useCallback, useRef } from 'react';
import type { TaskItem, Collaborator } from '../types';
import { formatDate, daysUntil } from '../utils/date';
import Popover from './Popover';
import RecurrencePicker from './RecurrencePicker';
import { speak, LINES } from '../hooks/useLive2D';

interface TaskCardProps {
  task: TaskItem;
  variant: 'overdue' | 'today' | 'upcoming';
  collaborators: Collaborator[];
  onReassign: (taskId: string, assigneeId: string | null) => void;
  onUpdateDue: (taskId: string, due: { date?: string; string?: string } | null) => void;
  onDelete: (taskId: string) => void;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const variantStyles = {
  overdue: {
    card: 'border-l-wall-overdue bg-wall-overdue-bg/50 animate-glow',
    dateBadge: 'text-wall-overdue font-bold',
    assignee: 'bg-wall-overdue/10 text-wall-overdue border-wall-overdue/40 hover:bg-wall-overdue/20',
    assigneeEmpty: 'bg-wall-surface/80 text-wall-muted border-wall-border/40 hover:bg-wall-surface',
    wobble: true,
  },
  today: {
    card: 'border-l-wall-today bg-wall-today-bg/30',
    dateBadge: 'text-wall-today',
    assignee: 'bg-wall-today/10 text-wall-today border-wall-today/40 hover:bg-wall-today/20',
    assigneeEmpty: 'bg-wall-surface/80 text-wall-muted border-wall-border/40 hover:bg-wall-surface',
    wobble: false,
  },
  upcoming: {
    card: 'border-l-wall-upcoming bg-wall-upcoming-bg/30',
    dateBadge: 'text-wall-upcoming',
    assignee: 'bg-wall-upcoming/10 text-wall-upcoming border-wall-upcoming/40 hover:bg-wall-upcoming/20',
    assigneeEmpty: 'bg-wall-surface/80 text-wall-muted border-wall-border/40 hover:bg-wall-surface',
    wobble: false,
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
  const [pendingDelete, setPendingDelete] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDateSave = useCallback(() => {
    if (recurrence.trim()) {
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

  // Two-click delete: first click warns, second click deletes
  const handleDeleteClick = useCallback(() => {
    if (!pendingDelete) {
      setPendingDelete(true);
      speak(pick(LINES.taskDeleteWarn), 5000);
      // Auto-cancel after 4s
      deleteTimerRef.current = setTimeout(() => setPendingDelete(false), 4000);
    } else {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setPendingDelete(false);
      onDelete(task.id);
    }
  }, [pendingDelete, task.id, onDelete]);

  return (
    <div
      className={`border-l-[3px] ${styles.card} rounded-r-lg px-3 py-2.5 mb-2 transition-all ${
        styles.wobble ? 'hover:animate-wobble cursor-crosshair' : 'hover:brightness-125'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Title */}
        <p className="text-wall-text text-[13px] font-medium leading-snug flex-1 min-w-0">
          {variant === 'overdue' && (
            <span className="text-wall-overdue mr-1 text-[9px] font-extrabold uppercase tracking-wider">
              failure ·{' '}
            </span>
          )}
          <span className="line-clamp-2">{task.title}</span>
        </p>

        {/* Assignee + delete */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setAssigneeOpen((o) => !o)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                task.assigneeName ? styles.assignee : styles.assigneeEmpty
              }`}
              title={task.assigneeName ? `i'm watching ${task.assigneeName}` : 'no one to blame. yet.'}
            >
              {task.assigneeName ? getFirstName(task.assigneeName) : '—'}
            </button>

            <Popover open={assigneeOpen} onClose={() => setAssigneeOpen(false)} className="right-0 top-7 py-1 min-w-[190px]">
              <p className="px-3 py-1 text-[9px] text-wall-muted italic border-b border-wall-border/30 mb-1">
                who do we blame~
              </p>
              <button
                onClick={() => { onReassign(task.id, null); setAssigneeOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-wall-bg transition-colors ${
                  !task.assigneeId ? 'text-wall-today font-bold' : 'text-wall-text'
                }`}
              >
                no one (coward)
              </button>
              {collaborators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onReassign(task.id, c.id); setAssigneeOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-wall-bg transition-colors ${
                    task.assigneeId === c.id ? 'text-wall-today font-bold' : 'text-wall-text'
                  }`}
                >
                  {c.name} {task.assigneeId === c.id ? '← (i see you)' : '👁️'}
                </button>
              ))}
            </Popover>
          </div>

          {/* Two-click delete */}
          <button
            onClick={handleDeleteClick}
            className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${
              pendingDelete
                ? 'bg-wall-overdue/30 text-wall-overdue border-wall-overdue/60 animate-heartbeat font-bold'
                : 'bg-wall-surface/80 text-wall-muted border-wall-border/40 hover:bg-wall-overdue/20 hover:text-wall-overdue hover:border-wall-overdue/50'
            }`}
            title={pendingDelete ? 'confirm — click again' : 'make it disappear. like my patience.'}
          >
            {pendingDelete ? '⚠ sure?' : '🔪'}
          </button>
        </div>
      </div>

      {/* Date + meta */}
      <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              setDateOpen((o) => !o);
              setDateValue(toDateInputValue(task.due));
              setRecurrence(task.isRecurring && task.dueString ? task.dueString : '');
            }}
            className={`text-[11px] ${styles.dateBadge} hover:underline whitespace-nowrap`}
          >
            {formatDate(task.due)}
          </button>

          <Popover open={dateOpen} onClose={() => setDateOpen(false)} className="left-0 top-6 p-3 min-w-[260px]">
            <div className="space-y-2">
              <label className="block text-xs text-wall-muted font-bold">
                pick a new deadline. i dare you.
              </label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => { setDateValue(e.target.value); setRecurrence(''); }}
                className="w-full text-sm border border-wall-border/60 rounded px-2 py-1 text-wall-text bg-wall-bg"
              />
              <RecurrencePicker value={recurrence} onChange={setRecurrence} />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDateSave}
                  className="flex-1 text-xs bg-wall-today/80 text-white rounded px-2 py-1 hover:bg-wall-today transition-colors font-bold"
                >
                  noted. i'll remember. 📝
                </button>
                <button
                  onClick={handleClearDate}
                  className="text-xs text-wall-muted hover:text-wall-overdue px-2 py-1 transition-colors"
                >
                  no date (bold)
                </button>
              </div>
            </div>
          </Popover>
        </div>

        {relative && variant !== 'today' && (
          <span className={`text-[10px] whitespace-nowrap truncate ${variant === 'overdue' ? 'text-wall-overdue font-bold' : 'text-wall-muted'}`}>
            {variant === 'overdue' ? `• ${relative} late. i noticed immediately.` : `• ${relative}`}
          </span>
        )}
        {task.isRecurring && task.dueString && (
          <span className="text-[10px] text-wall-muted whitespace-nowrap truncate">↻ {task.dueString}</span>
        )}
      </div>
    </div>
  );
}
