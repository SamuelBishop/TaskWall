export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  checked: boolean;
  priority: number; // 1 (normal) to 4 (urgent)
  due: {
    date: string;       // YYYY-MM-DD
    string: string;     // Human-readable
    timezone: string | null;
    lang: string;
    is_recurring: boolean;
  } | null;
  project_id: string;
  labels: string[];
  added_at: string;
  updated_at: string;
}

export interface TodoistResponse {
  results: TodoistTask[];
  next_cursor: string | null;
}

export interface TaskItem {
  id: string;
  title: string;
  due: Date | null;
  priority: number;
  category: 'overdue' | 'today' | 'upcoming' | 'no-date';
}

export interface TaskGroup {
  overdue: TaskItem[];
  today: TaskItem[];
  upcoming: TaskItem[];
}
