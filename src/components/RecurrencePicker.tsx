import { useState, useCallback } from 'react';

interface RecurrencePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const FREQUENCIES = [
  { value: '', label: 'Does not repeat' },
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function parseRecurrence(str: string): { freq: string; interval: number; day: string } {
  // Try to parse "every 2 weeks", "every monday", "every day", etc.
  const lower = str.toLowerCase().trim();
  if (!lower || !lower.startsWith('every')) return { freq: '', interval: 1, day: '' };

  for (const d of DAYS) {
    if (lower.includes(d.toLowerCase())) {
      return { freq: 'week', interval: 1, day: d.toLowerCase() };
    }
  }

  const match = lower.match(/every\s+(\d+)?\s*(day|week|month|year)s?/);
  if (match) {
    return { freq: match[2], interval: parseInt(match[1] || '1'), day: '' };
  }

  return { freq: '', interval: 1, day: '' };
}

function buildRecurrence(freq: string, interval: number, day: string): string {
  if (!freq) return '';
  if (freq === 'week' && day) {
    return interval > 1 ? `every ${interval} weeks on ${day}` : `every ${day}`;
  }
  const unit = interval > 1 ? `${freq}s` : freq;
  return interval > 1 ? `every ${interval} ${unit}` : `every ${unit}`;
}

export default function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const parsed = parseRecurrence(value);
  const [freq, setFreq] = useState(parsed.freq);
  const [interval, setInterval] = useState(parsed.interval);
  const [day, setDay] = useState(parsed.day);

  const update = useCallback(
    (f: string, i: number, d: string) => {
      setFreq(f);
      setInterval(i);
      setDay(d);
      onChange(buildRecurrence(f, i, d));
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <label className="block text-xs text-wall-muted font-medium">Repeat</label>
      <select
        value={freq}
        onChange={(e) => update(e.target.value, interval, e.target.value === 'week' ? day : '')}
        className="w-full text-sm border border-wall-border rounded px-2 py-1 text-wall-text bg-white"
      >
        {FREQUENCIES.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      {freq && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-wall-muted whitespace-nowrap">Every</label>
          <select
            value={interval}
            onChange={(e) => update(freq, parseInt(e.target.value), day)}
            className="text-sm border border-wall-border rounded px-2 py-1 text-wall-text bg-white w-16"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-xs text-wall-muted">
            {interval > 1 ? `${freq}s` : freq}
          </span>
        </div>
      )}

      {freq === 'week' && (
        <div>
          <label className="block text-xs text-wall-muted font-medium mb-1">On day</label>
          <select
            value={day}
            onChange={(e) => update(freq, interval, e.target.value)}
            className="w-full text-sm border border-wall-border rounded px-2 py-1 text-wall-text bg-white"
          >
            <option value="">Same day each week</option>
            {DAYS.map((d) => (
              <option key={d} value={d.toLowerCase()}>{d}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
