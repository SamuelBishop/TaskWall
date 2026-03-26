import { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import Header from './components/Header';
import TaskSection from './components/TaskSection';
import SetupScreen from './components/SignInScreen';
import ErrorBanner from './components/ErrorBanner';
import { useDragScroll } from './hooks/useDragScroll';
import type { TaskItem, CompletedTaskItem } from './types';

// Pi Display 2: 1280×720 in 155.5mm × 88mm → ~209 PPI
// We need to figure out how many CSS pixels = 155.5mm on the user's monitor.
// CSS spec says 1in = 96px, but actual PPI depends on the physical monitor
// and OS-level scaling (devicePixelRatio).
//
// Effective CSS PPI ≈ physicalPPI / devicePixelRatio
// Without knowing physicalPPI, we fall back to 96 adjusted by DPR heuristic
// and let the user fine-tune with a calibration slider.

const PI_WIDTH_MM = 155.5;
const PI_RES_WIDTH = 1280;
const STORAGE_KEY = 'taskwall-physical-scale';

function getDefaultScale(): number {
  // 96 CSS-PPI is the baseline. On high-DPI screens the effective CSS PPI
  // is often higher, so 96 underestimates the number of CSS pixels per mm.
  // Heuristic: bump the estimate by a fraction of (DPR - 1).
  const dpr = window.devicePixelRatio ?? 1;
  const estimatedCssPpi = 96 * (1 + (dpr - 1) * 0.35);
  const targetWidthPx = PI_WIDTH_MM * (estimatedCssPpi / 25.4);
  return targetWidthPx / PI_RES_WIDTH;
}

function loadSavedScale(): number | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) {
      const n = parseFloat(v);
      if (n > 0.1 && n < 2) return n;
    }
  } catch { /* ignore */ }
  return null;
}

type ViewMode = 'full' | 'physical';

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

export default function App() {
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

  const [mode, setMode] = useState<ViewMode>('full');
  const [scale, setScale] = useState(() => loadSavedScale() ?? getDefaultScale());
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [page, setPage] = useState<'main' | 'overdue' | 'future' | 'completed'>('main');

  // Persist calibrated scale
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, scale.toFixed(4)); } catch { /* ignore */ }
  }, [scale]);

  const cycleMode = useCallback(() => {
    setMode((m) => (m === 'full' ? 'physical' : 'full'));
  }, []);

  const filterTasks = useCallback(
    (items: TaskItem[]) => {
      if (!assigneeFilter) return items;
      if (assigneeFilter === '__unassigned__')
        return items.filter((t) => !t.assigneeId);
      return items.filter((t) => t.assigneeId === assigneeFilter);
    },
    [assigneeFilter]
  );

  const activeScale = mode === 'physical' ? scale : 1;
  const scaledWidthMm = ((activeScale * PI_RES_WIDTH) / (96 / 25.4)).toFixed(0);
  const scaledHeightMm = ((activeScale * 720) / (96 / 25.4)).toFixed(0);

  // Auto-fit: in 1:1 mode, scale down so the 1280x720 box fits the available space
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  useLayoutEffect(() => {
    if (mode !== 'full') return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { clientWidth, clientHeight } = el;
      const s = Math.min(clientWidth / 1280, clientHeight / 720, 1);
      setFitScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const finalScale = mode === 'physical' ? scale : fitScale;

  const kiosk = import.meta.env.VITE_KIOSK === 'true';

  if (kiosk) {
    return (
      <div id="taskwall-root" className="relative w-screen h-screen bg-wall-bg overflow-hidden flex flex-col">
          {!configured ? (
            <SetupScreen error={error} />
          ) : (
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
              />
              {error && (
                <ErrorBanner
                  message={error}
                  onDismiss={() => refresh()}
                />
              )}
              {page === 'main' ? (
                <main className="flex-1 grid grid-cols-2 gap-6 px-8 py-5 min-h-0 overflow-hidden">
                  <TaskSection title="Today" tasks={filterTasks(tasks?.today ?? [])} variant="today" icon="📋" emptyMessage="No tasks for today" collaborators={collaborators} onReassign={reassign} onUpdateDue={changeDue} onDelete={removeTask} onComplete={completeTask} />
                  <TaskSection title="Upcoming (7 Days)" tasks={filterTasks(tasks?.upcoming ?? [])} variant="upcoming" icon="📅" emptyMessage="Nothing upcoming" collaborators={collaborators} onReassign={reassign} onUpdateDue={changeDue} onDelete={removeTask} onComplete={completeTask} />
                </main>
              ) : page === 'overdue' ? (
                <main className="flex-1 flex flex-col px-8 py-5 min-h-0 overflow-hidden">
                  <TaskSection title="Overdue" tasks={filterTasks(tasks?.overdue ?? [])} variant="overdue" icon="🔴" emptyMessage="All caught up!" collaborators={collaborators} onReassign={reassign} onUpdateDue={changeDue} onDelete={removeTask} onComplete={completeTask} />
                </main>
              ) : page === 'completed' ? (
                <CompletedSection completedTasks={completedTasks} />
              ) : (
                <main className="flex-1 flex flex-col px-8 py-5 min-h-0 overflow-hidden">
                  <TaskSection title="Future" tasks={filterTasks(tasks?.future ?? [])} variant="future" icon="🔮" emptyMessage="Nothing planned" collaborators={collaborators} onReassign={reassign} onUpdateDue={changeDue} onDelete={removeTask} onComplete={completeTask} />
                </main>
              )}
            </>
          )}
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-screen overflow-hidden bg-gray-200 select-none">
      {/* Controls bar */}
      <div className="flex items-center gap-4 py-2 flex-shrink-0">
        <button
          onClick={cycleMode}
          className="px-3 py-1 text-xs rounded border transition-colors
            border-gray-400 text-gray-600 hover:text-gray-900 hover:border-gray-500"
        >
          {mode === 'full'
            ? '📏 Switch to Physical Size'
            : '🔍 Switch to 1:1 Pixels'}
        </button>

        {mode === 'physical' && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-500">Calibrate:</label>
            <input
              type="range"
              min="0.15"
              max="0.85"
              step="0.005"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-32 h-1 accent-blue-500"
            />
            <span className="text-[11px] text-gray-500 tabular-nums w-12">
              {(scale * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setScale(getDefaultScale())}
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              title="Reset to auto-detected scale"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Fixed 1280x720 container simulating Pi display */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden min-h-0 min-w-0">
      <div
        style={{
          transform: `scale(${finalScale})`,
          transformOrigin: 'center center',
        }}
      >
        <div id="taskwall-root" className="relative w-[1280px] h-[720px] bg-wall-bg overflow-hidden flex flex-col rounded-lg shadow-xl border border-wall-border">
        {!configured ? (
          <SetupScreen
            error={error}
          />
        ) : (
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
            />

            {error && (
              <ErrorBanner
                message={error}
                onDismiss={() => {
                  // Error will clear on next successful fetch
                  refresh();
                }}
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
        )}
        </div>
      </div>
      </div>

      {mode === 'physical' && (
        <p className="py-1 text-[10px] text-gray-500 flex-shrink-0">
          ≈ {scaledWidthMm}×{scaledHeightMm}mm at 96 CSS-PPI · Target: 155.5×88mm · Drag slider until it matches a ruler
        </p>
      )}
    </div>
  );
}
