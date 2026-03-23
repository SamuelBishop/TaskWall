import { useState, useCallback } from 'react';
import type { Collaborator } from '../types';
import Popover from './Popover';
import RecurrencePicker from './RecurrencePicker';

interface AddTaskFormProps {
  collaborators: Collaborator[];
  onAdd: (params: {
    content: string;
    due?: { date?: string; string?: string };
    assignee_id?: string | null;
  }) => Promise<void>;
}

export default function AddTaskForm({ collaborators, onAdd }: AddTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [assignee, setAssignee] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setContent('');
    setDate('');
    setRecurrence('');
    setAssignee('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const due = recurrence.trim()
        ? { string: recurrence.trim() }
        : date
          ? { date }
          : undefined;
      await onAdd({
        content: content.trim(),
        due,
        assignee_id: assignee || null,
      });
      reset();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [content, date, recurrence, assignee, onAdd, reset]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-medium text-wall-today hover:text-blue-700 transition-colors"
        title="Add a new task"
      >
        + Task
      </button>

      <Popover open={open} onClose={() => setOpen(false)} className="right-0 top-7 p-4 w-[280px]">
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-wall-muted font-medium mb-1">Task</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-sm border border-wall-border rounded px-2 py-1.5 text-wall-text bg-white placeholder:text-gray-300"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-wall-muted font-medium mb-1">Due date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setRecurrence(''); }}
              className="w-full text-sm border border-wall-border rounded px-2 py-1 text-wall-text bg-white"
            />
          </div>

          <RecurrencePicker value={recurrence} onChange={setRecurrence} />

          {collaborators.length > 0 && (
            <div>
              <label className="block text-xs text-wall-muted font-medium mb-1">Assign to</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full text-sm border border-wall-border rounded px-2 py-1 text-wall-text bg-white"
              >
                <option value="">Unassigned</option>
                {collaborators.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="w-full text-sm bg-wall-today text-white rounded px-2 py-1.5 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      </Popover>
    </div>
  );
}
