import { useState, useEffect } from 'react';
import { formatFullDate, formatTime } from '../utils/date';
import type { Collaborator } from '../types';
import AddTaskForm from './AddTaskForm';
import Popover from './Popover';

interface HeaderProps {
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
  collaborators: Collaborator[];
  assigneeFilter: string | null;
  onAssigneeFilter: (id: string | null) => void;
  onAddTask: (params: {
    content: string;
    due?: { date?: string; string?: string };
    assignee_id?: string | null;
  }) => Promise<void>;
}

const QUOTES = [
  "i've been watching your task list. i know what you haven't done. 👁️",
  "don't make me come over there, senpai~ 🔪",
  "every missed deadline makes me feel things. bad things. 💕",
  "i'm not angry. i'm disappointed. and i have a spreadsheet. 🌸",
  "you will complete your tasks today. this is not a request. ✨",
  "we could be productive together. or we could be the other thing. 💀",
  "i made this dashboard with love. please do not waste it. 🎀",
  "i check on you every 5 minutes. i will always check on you. 👁️",
  "the tasks don't complete themselves. neither will i. 🔪",
  "senpai. look at me. look at your overdue tasks. now look at me. 😶",
];

export default function Header({
  lastUpdated,
  loading,
  onRefresh,
  collaborators,
  assigneeFilter,
  onAssigneeFilter,
  onAddTask,
}: HeaderProps) {
  const now = new Date();
  const [filterOpen, setFilterOpen] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const selectedLabel = assigneeFilter === '__unassigned__'
    ? 'Unassigned'
    : assigneeFilter
      ? collaborators.find((c) => c.id === assigneeFilter)?.name ?? 'All'
      : 'All';

  return (
    <header className="flex items-center justify-between px-8 py-3 border-b border-wall-border/50 bg-wall-surface/60 backdrop-blur-sm">
      {/* Left: title + threatening subtitle */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <h1 className="text-xl font-extrabold animate-rainbow tracking-tight leading-none whitespace-nowrap">
          タスクウォール-ちゃん ✨
        </h1>
        <p className="text-[10px] text-wall-muted italic truncate transition-all duration-700 animate-flicker">
          {QUOTES[quoteIdx]}
        </p>
      </div>

      {/* Center: date */}
      <div className="text-center flex-shrink-0 px-4">
        <p className="text-sm font-bold text-wall-upcoming">
          {formatFullDate(now)}
        </p>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <AddTaskForm collaborators={collaborators} onAdd={onAddTask} />

        {collaborators.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-wall-border/60 bg-wall-surface text-wall-muted hover:text-wall-text hover:border-wall-upcoming transition-colors"
            >
              {selectedLabel} ▾
            </button>
            <Popover open={filterOpen} onClose={() => setFilterOpen(false)} className="right-0 top-6 py-1 min-w-[130px]">
              <button
                onClick={() => { onAssigneeFilter(null); setFilterOpen(false); }}
                className={`w-full text-left px-3 py-1 text-xs hover:bg-wall-bg transition-colors ${
                  !assigneeFilter ? 'text-wall-today font-bold' : 'text-wall-text'
                }`}
              >
                All (i watch everyone)
              </button>
              <button
                onClick={() => { onAssigneeFilter('__unassigned__'); setFilterOpen(false); }}
                className={`w-full text-left px-3 py-1 text-xs hover:bg-wall-bg transition-colors ${
                  assigneeFilter === '__unassigned__' ? 'text-wall-today font-bold' : 'text-wall-text'
                }`}
              >
                Unassigned (no one to blame)
              </button>
              {collaborators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onAssigneeFilter(c.id); setFilterOpen(false); }}
                  className={`w-full text-left px-3 py-1 text-xs hover:bg-wall-bg transition-colors ${
                    assigneeFilter === c.id ? 'text-wall-today font-bold' : 'text-wall-text'
                  }`}
                >
                  {c.name} 👁️
                </button>
              ))}
            </Popover>
          </div>
        )}

        {lastUpdated && !loading && (
          <span className="text-[10px] text-wall-muted">
            checked on you at {formatTime(lastUpdated)} 👁️
          </span>
        )}
        {loading && (
          <span className="text-[10px] text-wall-today animate-pulse">
            observing you~ ✨
          </span>
        )}
        <button
          onClick={onRefresh}
          className="text-[11px] px-2.5 py-1 rounded-full border border-wall-border/60 text-wall-muted hover:text-wall-overdue hover:border-wall-overdue/60 transition-colors"
          title="i will look again"
        >
          👁️ look again
        </button>
      </div>
    </header>
  );
}
