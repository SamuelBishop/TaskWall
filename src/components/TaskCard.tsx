import type { TaskItem } from '../types';
import { formatDate, daysUntil } from '../utils/date';

interface TaskCardProps {
  task: TaskItem;
  variant: 'overdue' | 'today' | 'upcoming';
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

export default function TaskCard({ task, variant }: TaskCardProps) {
  const styles = variantStyles[variant];
  const relative = daysUntil(task.due);

  return (
    <div
      className={`border-l-[3px] ${styles.border} bg-wall-surface rounded-r-lg px-4 py-3 mb-2.5 transition-colors`}
    >
      <p className="text-wall-text text-[15px] font-medium leading-snug truncate">
        {task.title}
      </p>
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
