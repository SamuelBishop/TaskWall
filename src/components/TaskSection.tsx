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

const SECTION_LABELS = {
  overdue: {
    title: 'senpai. we need to talk.',
    icon: '🔪',
    sub: 'i have been very patient. that was my mistake.',
  },
  today: {
    title: "complete these. or else.",
    icon: '💕',
    sub: 'i made this list with love. do not waste it, senpai.',
  },
  upcoming: {
    title: 'your future obligations',
    icon: '👁️',
    sub: 'i will remember if you forget. i always remember.',
  },
};

const headerStyles = {
  overdue: 'text-wall-overdue',
  today: 'text-wall-today',
  upcoming: 'text-wall-upcoming',
};

const dividerStyles = {
  overdue: 'border-wall-overdue/40',
  today: 'border-wall-today/40',
  upcoming: 'border-wall-upcoming/40',
};

const countStyles = {
  overdue: 'bg-wall-overdue/20 text-wall-overdue border border-wall-overdue/40 animate-heartbeat',
  today: 'bg-wall-today/20 text-wall-today border border-wall-today/40',
  upcoming: 'bg-wall-upcoming/20 text-wall-upcoming border border-wall-upcoming/40',
};

const subStyles = {
  overdue: 'text-wall-overdue/50 italic',
  today: 'text-wall-today/50 italic',
  upcoming: 'text-wall-upcoming/50 italic',
};

export default function TaskSection({
  tasks,
  variant,
  collaborators,
  onReassign,
  onUpdateDue,
  onDelete,
}: TaskSectionProps) {
  const label = SECTION_LABELS[variant];

  return (
    <div className="flex flex-col min-w-0 min-h-0 overflow-hidden">
      {/* Section header */}
      <div className={`mb-3 pb-2 border-b ${dividerStyles[variant]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${variant === 'overdue' ? 'animate-stare' : ''}`}>{label.icon}</span>
            <h2 className={`text-[11px] font-extrabold uppercase tracking-widest ${headerStyles[variant]}`}>
              {label.title}
            </h2>
          </div>
          {tasks.length > 0 && (
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${countStyles[variant]}`}>
              {tasks.length}
            </span>
          )}
        </div>
        <p className={`text-[9px] mt-0.5 pl-7 ${subStyles[variant]}`}>
          {label.sub}
        </p>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-1.5">
            {variant === 'overdue' && (
              <>
                <span className="text-2xl animate-float">👁️</span>
                <span className="text-[11px] text-wall-overdue/60 italic text-center px-4">
                  nothing overdue. for now. i'm still watching. 👁️
                </span>
              </>
            )}
            {variant === 'today' && (
              <>
                <span className="text-2xl animate-float">💕</span>
                <span className="text-[11px] text-wall-today/60 italic text-center px-4">
                  no tasks. are you resting without permission, senpai~?
                </span>
              </>
            )}
            {variant === 'upcoming' && (
              <>
                <span className="text-2xl animate-float">🌙</span>
                <span className="text-[11px] text-wall-upcoming/60 italic text-center px-4">
                  the future is empty. that won't last. it never does.
                </span>
              </>
            )}
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
