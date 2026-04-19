import { useState, useCallback } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useDragScroll } from '../hooks/useDragScroll';
import Header from './Header';
import TaskSection from './TaskSection';
import SetupScreen from './SignInScreen';
import ErrorBanner from './ErrorBanner';
import type { TaskItem, CompletedTaskItem } from '../types';

function formatCompletedDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function CompletedSection({ completedTasks }: { completedTasks: CompletedTaskItem[] }) {
  const scrollRef = useDragScroll<HTMLDivElement>();

  return (
    <main className="flex-1 flex flex-col px-8 py-5 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-float">✅</span>
          <h2 className="text-lg font-semibold uppercase tracking-wider text-wall-today">
            Completed (Last 7 Days)
          </h2>
        </div>
        {completedTasks.length > 0 && (
          <span className="text-sm font-bold px-3 py-1 rounded-full animate-pop-in bg-wall-today/20 text-wall-today border border-wall-today/40">
            {completedTasks.length}
          </span>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 pr-1 select-none touch-pan-y cursor-grab active:cursor-grabbing">
        {completedTasks.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-wall-muted text-sm">
            No completed tasks this week
          </div>
        ) : (
          completedTasks.map((task) => (
            <div
              key={task.id}
              className="border-l-[3px] border-l-wall-today bg-wall-surface rounded-r-lg px-4 py-3.5 mb-2.5 animate-slide-in transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-wall-muted text-base font-medium leading-snug truncate flex-1 line-through">
                  {task.title}
                </p>
                <span className="text-sm text-wall-muted whitespace-nowrap flex-shrink-0">
                  {formatCompletedDate(task.completedAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

interface TaskWallAppProps {
  onNavigateHome: () => void;
}

export default function TaskWallApp({ onNavigateHome }: TaskWallAppProps) {
  const {
    tasks,
    completedTasks,
    loading,
    error,
    configured,
    collaborators,
    reassign,
    changeDue,
    addTask,
    removeTask,
    completeTask,
    refresh,
    lastUpdated,
  } = useTasks();

  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [page, setPage] = useState<'main' | 'overdue' | 'future' | 'completed'>('main');

  const filterTasks = useCallback(
    (items: TaskItem[]) => {
      if (!assigneeFilter) return items;
      if (assigneeFilter === '__unassigned__')
        return items.filter((t) => !t.assigneeId);
      return items.filter((t) => t.assigneeId === assigneeFilter);
    },
    [assigneeFilter]
  );

  if (!configured) {
    return <SetupScreen error={error} />;
  }

  return (
    <>
      <Header
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={refresh}
        collaborators={collaborators}
        assigneeFilter={assigneeFilter}
        onAssigneeFilter={setAssigneeFilter}
        onAddTask={addTask}
        page={page}
        onPageChange={setPage}
        onNavigateHome={onNavigateHome}
      />

      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => refresh()}
        />
      )}

      {page === 'main' ? (
        <main className="flex-1 grid grid-cols-2 gap-6 px-8 py-5 min-h-0 overflow-hidden">
          <TaskSection
            title="Today"
            tasks={filterTasks(tasks?.today ?? [])}
            variant="today"
            icon="📋"
            emptyMessage="No tasks for today"
            collaborators={collaborators}
            onReassign={reassign}
            onUpdateDue={changeDue}
            onDelete={removeTask}
            onComplete={completeTask}
          />
          <TaskSection
            title="Upcoming (7 Days)"
            tasks={filterTasks(tasks?.upcoming ?? [])}
            variant="upcoming"
            icon="📅"
            emptyMessage="Nothing upcoming"
            collaborators={collaborators}
            onReassign={reassign}
            onUpdateDue={changeDue}
            onDelete={removeTask}
            onComplete={completeTask}
          />
        </main>
      ) : page === 'overdue' ? (
        <main className="flex-1 flex flex-col px-8 py-5 min-h-0 overflow-hidden">
          <TaskSection
            title="Overdue"
            tasks={filterTasks(tasks?.overdue ?? [])}
            variant="overdue"
            icon="🔴"
            emptyMessage="All caught up!"
            collaborators={collaborators}
            onReassign={reassign}
            onUpdateDue={changeDue}
            onDelete={removeTask}
            onComplete={completeTask}
          />
        </main>
      ) : page === 'completed' ? (
        <CompletedSection completedTasks={completedTasks} />
      ) : (
        <main className="flex-1 flex flex-col px-8 py-5 min-h-0 overflow-hidden">
          <TaskSection
            title="Future"
            tasks={filterTasks(tasks?.future ?? [])}
            variant="future"
            icon="🔮"
            emptyMessage="Nothing planned"
            collaborators={collaborators}
            onReassign={reassign}
            onUpdateDue={changeDue}
            onDelete={removeTask}
            onComplete={completeTask}
          />
        </main>
      )}
    </>
  );
}
