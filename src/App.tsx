import { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import TaskWallApp from './components/TaskWallApp';
import CalendarApp from './components/CalendarApp';
import type { ActiveApp, LaunchableApp } from './types';

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
const SCALE_STORAGE_KEY = 'taskwall-physical-scale';
const DEFAULT_APP_KEY = 'taskwall-default-app';

function getDefaultScale(): number {
  const dpr = window.devicePixelRatio ?? 1;
  const estimatedCssPpi = 96 * (1 + (dpr - 1) * 0.35);
  const targetWidthPx = PI_WIDTH_MM * (estimatedCssPpi / 25.4);
  return targetWidthPx / PI_RES_WIDTH;
}

function loadSavedScale(): number | null {
  try {
    const v = localStorage.getItem(SCALE_STORAGE_KEY);
    if (v) {
      const n = parseFloat(v);
      if (n > 0.1 && n < 2) return n;
    }
  } catch { /* ignore */ }
  return null;
}

function loadDefaultApp(): LaunchableApp {
  try {
    const v = localStorage.getItem(DEFAULT_APP_KEY);
    if (v === 'taskwall' || v === 'calendar') return v;
  } catch { /* ignore */ }
  return 'taskwall';
}

type ViewMode = 'full' | 'physical';

export default function App() {
  const [mode, setMode] = useState<ViewMode>('full');
  const [scale, setScale] = useState(() => loadSavedScale() ?? getDefaultScale());

  const [defaultApp, setDefaultApp] = useState<LaunchableApp>(loadDefaultApp);
  const [activeApp, setActiveApp] = useState<ActiveApp>(loadDefaultApp);

  // Persist calibrated scale
  useEffect(() => {
    try { localStorage.setItem(SCALE_STORAGE_KEY, scale.toFixed(4)); } catch { /* ignore */ }
  }, [scale]);

  const cycleMode = useCallback(() => {
    setMode((m) => (m === 'full' ? 'physical' : 'full'));
  }, []);

  const handleSetDefault = useCallback((app: LaunchableApp) => {
    setDefaultApp(app);
    try { localStorage.setItem(DEFAULT_APP_KEY, app); } catch { /* ignore */ }
  }, []);

  const handleNavigateHome = useCallback(() => setActiveApp('home'), []);
  const handleLaunch = useCallback((app: ActiveApp) => setActiveApp(app), []);

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

  function renderApp() {
    switch (activeApp) {
      case 'home':
        return <HomeScreen onLaunch={handleLaunch} defaultApp={defaultApp} onSetDefault={handleSetDefault} />;
      case 'taskwall':
        return <TaskWallApp onNavigateHome={handleNavigateHome} />;
      case 'calendar':
        return <CalendarApp onNavigateHome={handleNavigateHome} />;
    }
  }

  if (kiosk) {
    return (
      <div id="taskwall-root" className="relative w-screen h-screen bg-wall-bg overflow-hidden flex flex-col">
        {renderApp()}
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
          {renderApp()}
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
