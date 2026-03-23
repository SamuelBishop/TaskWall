import type { TodoistTask, TodoistResponse, TaskItem, TaskGroup } from '../types';

// In dev, requests go through Vite's proxy to avoid CORS.
// In production, they go directly to the Todoist API.
const API_BASE = import.meta.env.DEV
  ? '/api/todoist'
  : 'https://api.todoist.com/api/v1';

function getToken(): string | null {
  return import.meta.env.VITE_TODOIST_API_TOKEN || null;
}

export function isConfigured(): boolean {
  const token = getToken();
  return !!token && token !== 'your-todoist-api-token-here';
}

async function apiGet<T>(path: string): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('Todoist API token not configured');

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid Todoist API token');
    if (res.status === 403) throw new Error('Todoist API access forbidden');
    throw new Error(`Todoist API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchAllTasks(): Promise<TodoistTask[]> {
  // API v1 uses cursor-based pagination with results wrapper
  const allTasks: TodoistTask[] = [];
  let cursor: string | null = null;

  for (;;) {
    const url = cursor ? `/tasks?cursor=${cursor}` : '/tasks';
    const data: TodoistResponse = await apiGet<TodoistResponse>(url);
    allTasks.push(...data.results);
    cursor = data.next_cursor;
    if (!cursor) break;
  }

  return allTasks;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function categorizeTasks(tasks: TodoistTask[]): TaskGroup {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 8); // 7 days from tomorrow

  const result: TaskGroup = {
    overdue: [],
    today: [],
    upcoming: [],
  };

  for (const task of tasks) {
    if (task.checked || !task.content?.trim()) continue;

    // Todoist due can have a date string (YYYY-MM-DD) or a datetime string
    const dueStr = task.due?.date ?? null;
    const due = dueStr ? new Date(dueStr) : null;
    const dueDay = due ? startOfDay(due) : null;

    const item: TaskItem = {
      id: task.id,
      title: task.content,
      due,
      priority: task.priority,
      category: 'no-date',
    };

    if (!dueDay) {
      // Tasks with no due date go to upcoming
      item.category = 'upcoming';
      result.upcoming.push(item);
    } else if (dueDay < todayStart) {
      item.category = 'overdue';
      result.overdue.push(item);
    } else if (dueDay >= todayStart && dueDay < todayEnd) {
      item.category = 'today';
      result.today.push(item);
    } else if (dueDay < weekEnd) {
      item.category = 'upcoming';
      result.upcoming.push(item);
    }
    // Tasks beyond 7 days are not shown
  }

  // Sort each group by due date, then by priority (higher priority first)
  const sortByDue = (a: TaskItem, b: TaskItem) => {
    if (!a.due && !b.due) return b.priority - a.priority;
    if (!a.due) return 1;
    if (!b.due) return -1;
    const timeDiff = a.due.getTime() - b.due.getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.priority - a.priority;
  };

  result.overdue.sort(sortByDue);
  result.today.sort(sortByDue);
  result.upcoming.sort(sortByDue);

  return result;
}
