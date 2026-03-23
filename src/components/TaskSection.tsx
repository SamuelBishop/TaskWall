import type { TaskItem, Collaborator } from '../types';
import TaskCard from './TaskCard';

interface TaskSectionProps {
  title: string;
  tasks: TaskItem[];
  variant: 'overdue' | 'today' | 'upcoming';
  icon: string;
  emptyMessage: string;
  collaborators: Collaborator[];
  onReassign: (taskId: string, assigneeId: string | null) => void;
  onUpdateDue: (taskId: string, due: { date?: string; string?: string } | null) => void;
  onDelete: (taskId: string) => void;
}

const headerStyles = {
  overdue: 'text-wall-overdue',
  today: 'text-wall-today',
  upcoming: 'text-wall-muted',
};

const countStyles = {
  overdue: 'bg-wall-overdue/20 text-wall-overdue',
  today: 'bg-wall-today/20 text-wall-today',
  upcoming: 'bg-wall-upcoming/20 text-wall-muted',
};

export default function TaskSection({
  title,
  tasks,
  variant,
  icon,
  emptyMessage,
  collaborators,
  onReassign,
  onUpdateDue,
  onDelete,
}: TaskSectionProps) {
  return (
    <div className="flex flex-col min-w-0 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h2
            className={`text-base font-semibold uppercase tracking-wider ${headerStyles[variant]}`}
          >
            {title}
          </h2>
        </div>
        {tasks.length > 0 && (
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${countStyles[variant]}`}
          >
            {tasks.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-wall-muted text-sm">
            {emptyMessage}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              variant={variant}
              collaborators={collaborators}
              onReassign={onReassign}
              onUpdateDue={onUpdateDue}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
