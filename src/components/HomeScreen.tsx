import { useState, useEffect } from 'react';
import { formatFullDate } from '../utils/date';
import type { ActiveApp, LaunchableApp } from '../types';

interface AppDef {
  id: LaunchableApp;
  name: string;
  description: string;
  icon: string;
}

const APPS: AppDef[] = [
  { id: 'taskwall', name: 'TaskWall', description: 'Tasks, reminders & due dates', icon: '📋' },
  { id: 'calendar', name: 'Calendar', description: 'Schedule & events', icon: '📅' },
];

interface HomeScreenProps {
  onLaunch: (app: ActiveApp) => void;
  defaultApp: LaunchableApp;
  onSetDefault: (app: LaunchableApp) => void;
}

function GridIcon() {
  return (
    <span className="inline-grid grid-cols-2 gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="block w-[5px] h-[5px] bg-current rounded-[1px]" />
      ))}
    </span>
  );
}

export { GridIcon };

export default function HomeScreen({ onLaunch, defaultApp, onSetDefault }: HomeScreenProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-wall-bg select-none gap-10">
      {/* Clock */}
      <div className="text-center">
        <p className="text-[80px] leading-none font-bold text-wall-text tabular-nums tracking-tight">
          {timeStr}
        </p>
        <p className="text-xl text-wall-muted mt-3">{formatFullDate(now)}</p>
      </div>

      {/* App tiles */}
      <div className="flex gap-6">
        {APPS.map((app) => {
          const isDefault = defaultApp === app.id;
          return (
            <div key={app.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => onLaunch(app.id)}
                className={`relative w-[260px] h-[180px] rounded-2xl border-2 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all ${
                  isDefault
                    ? 'border-wall-today bg-wall-today/10'
                    : 'border-wall-border bg-wall-surface hover:border-wall-today/40 hover:bg-white'
                }`}
              >
                {isDefault && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-wall-today text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Default
                  </span>
                )}
                <span className="text-5xl">{app.icon}</span>
                <div className="text-center">
                  <p className="text-lg font-bold text-wall-text">{app.name}</p>
                  <p className="text-sm text-wall-muted mt-0.5">{app.description}</p>
                </div>
              </button>
              {!isDefault && (
                <button
                  onClick={() => onSetDefault(app.id)}
                  className="text-xs text-wall-muted hover:text-wall-today transition-colors py-1"
                >
                  Set as default
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
