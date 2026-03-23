import type {
  TodoistTask,
  TodoistResponse,
  Collaborator,
  CollaboratorsResponse,
  TaskItem,
  TaskGroup,
} from '../types';

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

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('Todoist API token not configured');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid Todoist API token');
    if (res.status === 403) throw new Error('Todoist API access forbidden');
    throw new Error(`Todoist API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function getDisplayNameMap(): Map<string, string> {
  const raw = import.meta.env.VITE_DISPLAY_NAMES || '';
  const map = new Map<string, string>();
  if (!raw) return map;
  for (const entry of raw.split(',')) {
    const [from, to] = entry.split(':').map((s) => s.trim());
    if (from && to) map.set(from.toLowerCase(), to);
  }
  return map;
}

export async function fetchCollaborators(): Promise<Collaborator[]> {
  const projectId = import.meta.env.VITE_TODOIST_PROJECT_ID;
  if (!projectId) return [];

  const data = await apiRequest<CollaboratorsResponse>(
    `/projects/${projectId}/collaborators`
  );
  const nameMap = getDisplayNameMap();
  return (data.results ?? []).map((c) => ({
    ...c,
    name: nameMap.get(c.name.toLowerCase()) ?? c.name,
  }));
}

export async function fetchAllTasks(): Promise<TodoistTask[]> {
  const projectId = import.meta.env.VITE_TODOIST_PROJECT_ID || null;

  const allTasks: TodoistTask[] = [];
  let cursor: string | null = null;

  for (;;) {
    const params = new URLSearchParams();
    if (projectId) params.set('project_id', projectId);
    if (cursor) params.set('cursor', cursor);
    const qs = params.toString();
    const url = `/tasks${qs ? `?${qs}` : ''}`;
    const data: TodoistResponse = await apiRequest<TodoistResponse>(url);
    allTasks.push(...data.results);
    cursor = data.next_cursor;
    if (!cursor) break;
  }

  return allTasks;
}

export async function updateTaskAssignee(
  taskId: string,
  assigneeId: string | null
): Promise<void> {
  await apiRequest(`/tasks/${taskId}`, {
    method: 'POST',
    body: JSON.stringify({ assignee_id: assigneeId }),
  });
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function categorizeTasks(
  tasks: TodoistTask[],
  collaborators: Collaborator[]
): TaskGroup {
  const collabMap = new Map(collaborators.map((c) => [c.id, c.name]));

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 8);

  const result: TaskGroup = {
    overdue: [],
    today: [],
    upcoming: [],
  };

  for (const task of tasks) {
    if (task.checked || !task.content?.trim()) continue;

    const dueStr = task.due?.date ?? null;
    const due = dueStr ? new Date(dueStr) : null;
    const dueDay = due ? startOfDay(due) : null;

    const item: TaskItem = {
      id: task.id,
      title: task.content,
      due,
      priority: task.priority,
      category: 'no-date',
      assigneeId: task.responsible_uid,
      assigneeName: task.responsible_uid
        ? collabMap.get(task.responsible_uid) ?? 'Unknown'
        : null,
    };

    if (!dueDay) {
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
  }

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
