import { useState, useCallback } from 'react';
import type { TaskGroup, TaskItem, Collaborator } from '../types';
import type { CreateTaskParams } from '../api/todoist';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function daysAgo(n: number): Date {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d;
}

export const FAKE_COLLABORATORS: Collaborator[] = [
  { id: '1', name: 'Sam Bishop', email: 'sam@example.com' },
  { id: '2', name: 'Alex Chaos', email: 'alex@example.com' },
];

const INITIAL_TASKS: TaskGroup = {
  overdue: [
    {
      id: 'o1',
      title: 'Reply to that email from three weeks ago',
      due: daysAgo(21),
      priority: 4,
      category: 'overdue',
      assigneeId: '1',
      assigneeName: 'Sam Bishop',
      isRecurring: false,
      dueString: null,
    },
    {
      id: 'o2',
      title: 'Fix the thing that broke in prod',
      due: daysAgo(5),
      priority: 4,
      category: 'overdue',
      assigneeId: null,
      assigneeName: null,
      isRecurring: false,
      dueString: null,
    },
    {
      id: 'o3',
      title: 'Do your taxes (you said "tomorrow" in February)',
      due: daysAgo(14),
      priority: 3,
      category: 'overdue',
      assigneeId: '2',
      assigneeName: 'Alex Chaos',
      isRecurring: false,
      dueString: null,
    },
    {
      id: 'o4',
      title: 'Update npm deps before they become CVEs',
      due: daysAgo(3),
      priority: 2,
      category: 'overdue',
      assigneeId: '1',
      assigneeName: 'Sam Bishop',
      isRecurring: false,
      dueString: null,
    },
  ],
  today: [
    {
      id: 't1',
      title: 'Stand-up at 9am (you will be late)',
      due: new Date(TODAY),
      priority: 3,
      category: 'today',
      assigneeId: '1',
      assigneeName: 'Sam Bishop',
      isRecurring: true,
      dueString: 'every weekday',
    },
    {
      id: 't2',
      title: 'Write tests for the thing you shipped last month',
      due: new Date(TODAY),
      priority: 2,
      category: 'today',
      assigneeId: null,
      assigneeName: null,
      isRecurring: false,
      dueString: null,
    },
    {
      id: 't3',
      title: 'Refactor the component you called "temporary" in 2023',
      due: new Date(TODAY),
      priority: 2,
      category: 'today',
      assigneeId: '2',
      assigneeName: 'Alex Chaos',
      isRecurring: false,
      dueString: null,
    },
  ],
  upcoming: [
    {
      id: 'u1',
      title: 'Performance review prep (lol good luck)',
      due: daysFromNow(2),
      priority: 3,
      category: 'upcoming',
      assigneeId: '1',
      assigneeName: 'Sam Bishop',
      isRecurring: false,
      dueString: null,
    },
    {
      id: 'u2',
      title: 'Ship the feature you promised two sprints ago',
      due: daysFromNow(4),
      priority: 4,
      category: 'upcoming',
      assigneeId: null,
      assigneeName: null,
      isRecurring: false,
      dueString: null,
    },
    {
      id: 'u3',
      title: 'Read the 47 unread Slack messages',
      due: daysFromNow(7),
      priority: 1,
      category: 'upcoming',
      assigneeId: '2',
      assigneeName: 'Alex Chaos',
      isRecurring: true,
      dueString: 'every monday',
    },
    {
      id: 'u4',
      title: 'Actually document your API this time',
      due: daysFromNow(10),
      priority: 2,
      category: 'upcoming',
      assigneeId: '1',
      assigneeName: 'Sam Bishop',
      isRecurring: false,
      dueString: null,
    },
  ],
};

let idCounter = 100;

export function useFakeTasks() {
  const [tasks, setTasks] = useState<TaskGroup>(INITIAL_TASKS);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  const reassign = useCallback(async (taskId: string, assigneeId: string | null) => {
    const collab = FAKE_COLLABORATORS.find((c) => c.id === assigneeId) ?? null;
    setTasks((prev) => {
      const update = (items: TaskItem[]) =>
        items.map((t) =>
          t.id === taskId
            ? { ...t, assigneeId, assigneeName: collab?.name ?? null }
            : t
        );
      return { overdue: update(prev.overdue), today: update(prev.today), upcoming: update(prev.upcoming) };
    });
  }, []);

  const changeDue = useCallback(async (taskId: string, _due: { date?: string; string?: string } | null) => {
    // no-op for fake data, just refresh UI feel
    await refresh();
    void taskId;
  }, [refresh]);

  const addTask = useCallback(async (params: CreateTaskParams) => {
    const newTask: TaskItem = {
      id: String(idCounter++),
      title: params.content,
      due: new Date(TODAY),
      priority: 1,
      category: 'today',
      assigneeId: params.assignee_id ?? null,
      assigneeName: FAKE_COLLABORATORS.find((c) => c.id === params.assignee_id)?.name ?? null,
      isRecurring: false,
      dueString: null,
    };
    setTasks((prev) => ({ ...prev, today: [newTask, ...prev.today] }));
  }, []);

  const removeTask = useCallback(async (taskId: string) => {
    setTasks((prev) => ({
      overdue: prev.overdue.filter((t) => t.id !== taskId),
      today: prev.today.filter((t) => t.id !== taskId),
      upcoming: prev.upcoming.filter((t) => t.id !== taskId),
    }));
  }, []);

  return {
    tasks,
    loading,
    error: null,
    configured: true,
    collaborators: FAKE_COLLABORATORS,
    reassign,
    changeDue,
    addTask,
    removeTask,
    refresh,
    lastUpdated,
  };
}
