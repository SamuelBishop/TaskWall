import { useState, useCallback } from 'react';
import type { Collaborator } from '../types';
import Popover from './Popover';
import RecurrencePicker from './RecurrencePicker';
import OnScreenKeyboard from './OnScreenKeyboard';
import DatePicker from './DatePicker';

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
  const [kbOpen, setKbOpen] = useState(false);
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
        className="min-h-[44px] px-4 text-base font-medium text-wall-today hover:text-blue-700 hover:scale-105 active:scale-95 transition-all rounded-lg hover:bg-wall-surface"
        title="Add a new task"
      >
        + Task
      </button>

      <Popover open={open} onClose={() => setOpen(false)} className="right-0 top-12 p-5 w-[400px]">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-wall-muted font-medium mb-1.5">Task</label>
            <input
              type="text"
              value={content}
              onClick={() => setKbOpen(true)}
              placeholder="Tap to type task name…"
              className="w-full text-base border border-wall-border rounded-lg px-3 py-2.5 text-wall-text bg-white placeholder:text-gray-300 cursor-pointer"
              readOnly
            />
          </div>

          {kbOpen && (
            <OnScreenKeyboard
              value={content}
              onChange={setContent}
              onClose={() => setKbOpen(false)}
            />
          )}

          <div>
            <label className="block text-sm text-wall-muted font-medium mb-1.5">Due date</label>
            <DatePicker
              value={date}
              onChange={(v) => { setDate(v); setRecurrence(''); }}
              placeholder="Pick a date"
            />
          </div>

          <RecurrencePicker value={recurrence} onChange={setRecurrence} />

          {collaborators.length > 0 && (
            <div>
              <label className="block text-sm text-wall-muted font-medium mb-1.5">Assign to</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full text-base border border-wall-border rounded-lg px-3 py-2.5 text-wall-text bg-white"
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
            className="w-full text-base bg-wall-today text-white rounded-lg px-3 py-3 hover:bg-wall-today/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      </Popover>
    </div>
  );
}
