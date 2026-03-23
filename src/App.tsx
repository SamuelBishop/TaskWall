import { useState, useCallback, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import Header from './components/Header';
import TaskSection from './components/TaskSection';
import SetupScreen from './components/SignInScreen';
import ErrorBanner from './components/ErrorBanner';
import type { TaskItem } from './types';

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

export default function App() {
  const {
    tasks,
    loading,
    error,
    configured,
    collaborators,
    reassign,
    changeDue,
    addTask,
    refresh,
    lastUpdated,
  } = useTasks();

  const [mode, setMode] = useState<ViewMode>('full');
  const [scale, setScale] = useState(() => loadSavedScale() ?? getDefaultScale());
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 select-none">
      {/* Controls bar */}
      <div className="flex items-center gap-4 mb-3">
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
      <div
        style={{
          transform: `scale(${activeScale})`,
          transformOrigin: 'center center',
        }}
      >
        <div className="w-[1280px] h-[720px] bg-wall-bg overflow-hidden flex flex-col rounded-lg shadow-xl border border-wall-border">
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

            <main className="flex-1 grid grid-cols-[1fr_1.4fr_1fr] gap-6 px-8 py-5 min-h-0">
              <TaskSection
                title="Overdue"
                tasks={filterTasks(tasks?.overdue ?? [])}
                variant="overdue"
                icon="🔴"
                emptyMessage="All caught up!"
                collaborators={collaborators}
                onReassign={reassign}
                onUpdateDue={changeDue}
              />
              <TaskSection
                title="Today"
                tasks={filterTasks(tasks?.today ?? [])}
                variant="today"
                icon="📋"
                emptyMessage="No tasks for today"
                collaborators={collaborators}
                onReassign={reassign}
                onUpdateDue={changeDue}
              />
              <TaskSection
                title="Upcoming"
                tasks={filterTasks(tasks?.upcoming ?? [])}
                variant="upcoming"
                icon="📅"
                emptyMessage="Nothing upcoming"
                collaborators={collaborators}
                onReassign={reassign}
                onUpdateDue={changeDue}
              />
            </main>
          </>
        )}
        </div>
      </div>

      {mode === 'physical' && (
        <p className="mt-3 text-[10px] text-gray-500">
          ≈ {scaledWidthMm}×{scaledHeightMm}mm at 96 CSS-PPI · Target: 155.5×88mm · Drag slider until it matches a ruler
        </p>
      )}
    </div>
  );
}
