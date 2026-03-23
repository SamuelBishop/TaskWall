import { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { useFakeTasks as useTasks } from './hooks/useFakeTasks';
import { useLive2D, speak, LINES } from './hooks/useLive2D';
import SpeechBubble from './components/SpeechBubble';
import Header from './components/Header';
import TaskSection from './components/TaskSection';
import SetupScreen from './components/SignInScreen';
import ErrorBanner from './components/ErrorBanner';
import type { TaskItem } from './types';

const PI_WIDTH_MM = 155.5;
const PI_RES_WIDTH = 1280;
const STORAGE_KEY = 'taskwall-physical-scale';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDefaultScale(): number {
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

export default function App() {
  useLive2D();

  const {
    tasks,
    loading,
    error,
    configured,
    collaborators,
    reassign,
    changeDue,
    addTask,
    removeTask,
    refresh,
    lastUpdated,
  } = useTasks();

  const [mode, setMode] = useState<ViewMode>('full');
  const [scale, setScale] = useState(() => loadSavedScale() ?? getDefaultScale());
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

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

  // ── Speak-wrapped action handlers ──────────────────────────────────────────

  const handleAddTask = useCallback(async (params: Parameters<typeof addTask>[0]) => {
    await addTask(params);
    speak(pick(LINES.taskAdded));
  }, [addTask]);

  const handleRemoveTask = useCallback(async (taskId: string) => {
    await removeTask(taskId);
    speak(pick(LINES.taskDeleted));
  }, [removeTask]);

  const handleReassign = useCallback(async (taskId: string, assigneeId: string | null) => {
    const collab = collaborators.find((c) => c.id === assigneeId);
    await reassign(taskId, assigneeId);
    if (!assigneeId) {
      speak(pick(LINES.reassignFromSam));
    } else if (collab?.name?.toLowerCase().includes('sam')) {
      speak(pick(LINES.reassignToSam));
    } else {
      speak(pick(LINES.reassignToOther));
    }
  }, [reassign, collaborators]);

  const handleChangeDue = useCallback(async (taskId: string, due: Parameters<typeof changeDue>[1]) => {
    await changeDue(taskId, due);
    speak(pick(LINES.dueDateChanged));
  }, [changeDue]);

  const handleRefresh = useCallback(async () => {
    await refresh();
    speak(pick(LINES.refresh));
  }, [refresh]);

  const handleAssigneeFilter = useCallback((id: string | null) => {
    setAssigneeFilter(id);
    speak(pick(LINES.filterChange));
  }, []);

  // ── Layout ─────────────────────────────────────────────────────────────────

  const activeScale = mode === 'physical' ? scale : 1;
  const scaledWidthMm = ((activeScale * PI_RES_WIDTH) / (96 / 25.4)).toFixed(0);
  const scaledHeightMm = ((activeScale * 720) / (96 / 25.4)).toFixed(0);

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

  const taskSections = (
    <main className="flex-1 grid grid-cols-[1fr_1.4fr_1fr] grid-rows-[1fr] gap-6 px-8 py-5 min-h-0 overflow-hidden">
      <TaskSection title="Overdue" tasks={filterTasks(tasks?.overdue ?? [])} variant="overdue" icon="🔴" emptyMessage="" collaborators={collaborators} onReassign={handleReassign} onUpdateDue={handleChangeDue} onDelete={handleRemoveTask} />
      <TaskSection title="Today"   tasks={filterTasks(tasks?.today   ?? [])} variant="today"  icon="📋" emptyMessage="" collaborators={collaborators} onReassign={handleReassign} onUpdateDue={handleChangeDue} onDelete={handleRemoveTask} />
      <TaskSection title="Upcoming" tasks={filterTasks(tasks?.upcoming ?? [])} variant="upcoming" icon="📅" emptyMessage="" collaborators={collaborators} onReassign={handleReassign} onUpdateDue={handleChangeDue} onDelete={handleRemoveTask} />
    </main>
  );

  const headerEl = (
    <Header
      lastUpdated={lastUpdated}
      loading={loading}
      onRefresh={handleRefresh}
      collaborators={collaborators}
      assigneeFilter={assigneeFilter}
      onAssigneeFilter={handleAssigneeFilter}
      onAddTask={handleAddTask}
    />
  );

  if (kiosk) {
    return (
      <>
        <SpeechBubble />
        <div id="taskwall-root" className="relative w-screen h-screen bg-wall-bg overflow-hidden flex flex-col">
          {!configured ? <SetupScreen error={error} /> : (
            <>
              {headerEl}
              {error && <ErrorBanner message={error} onDismiss={handleRefresh} />}
              {taskSections}
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center h-screen overflow-hidden bg-[#06000f] select-none">
      {/* Controls bar */}
      <div className="flex items-center gap-4 py-2 flex-shrink-0">
        <button
          onClick={cycleMode}
          className="px-3 py-1 text-xs rounded border border-wall-border/50 text-wall-muted hover:text-wall-text hover:border-wall-upcoming transition-colors"
        >
          {mode === 'full' ? '📏 Physical Size' : '🔍 1:1 Pixels'}
        </button>

        {mode === 'physical' && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-wall-muted">Calibrate:</label>
            <input
              type="range" min="0.15" max="0.85" step="0.005"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-32 h-1 accent-pink-500"
            />
            <span className="text-[11px] text-wall-muted tabular-nums w-12">
              {(scale * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setScale(getDefaultScale())}
              className="text-[10px] text-wall-muted hover:text-wall-text transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <SpeechBubble />

      {/* 1280×720 Pi display */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden min-h-0 min-w-0">
        <div style={{ transform: `scale(${finalScale})`, transformOrigin: 'center center' }}>
          <div id="taskwall-root" className="relative w-[1280px] h-[720px] bg-wall-bg overflow-hidden flex flex-col rounded-lg shadow-xl border border-wall-border/50">
            {!configured ? <SetupScreen error={error} /> : (
              <>
                {headerEl}
                {error && <ErrorBanner message={error} onDismiss={handleRefresh} />}
                {taskSections}
              </>
            )}
          </div>
        </div>
      </div>

      {mode === 'physical' && (
        <p className="py-1 text-[10px] text-wall-muted flex-shrink-0">
          ≈ {scaledWidthMm}×{scaledHeightMm}mm · Target: 155.5×88mm
        </p>
      )}
    </div>
  );
}
