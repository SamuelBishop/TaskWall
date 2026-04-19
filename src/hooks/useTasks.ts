import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllTasks,
  fetchCollaborators,
  fetchCompletedTasks,
  categorizeTasks,
  updateTaskAssignee,
  updateTaskDue,
  createTask,
  deleteTask,
  closeTask,
  isConfigured,
} from '../api/todoist';
import type { TaskGroup, Collaborator, CompletedTaskItem } from '../types';
import type { CreateTaskParams } from '../api/todoist';

const REFRESH_INTERVAL = 5 * 60 * 1000;

interface UseTasksResult {
  tasks: TaskGroup | null;
  completedTasks: CompletedTaskItem[];
  loading: boolean;
  error: string | null;
  configured: boolean;
  collaborators: Collaborator[];
  reassign: (taskId: string, assigneeId: string | null) => Promise<void>;
  changeDue: (taskId: string, due: { date?: string; string?: string } | null) => Promise<void>;
  addTask: (params: CreateTaskParams) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<TaskGroup | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const collabRef = useRef<Collaborator[]>([]);

  const configured = isConfigured();

  const loadTasks = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const collabs = await fetchCollaborators();
      collabRef.current = collabs;
      setCollaborators(collabs);
      const rawTasks = await fetchAllTasks();
      const grouped = categorizeTasks(rawTasks, collabs);
      setTasks(grouped);
      const completed = await fetchCompletedTasks();
      setCompletedTasks(completed);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tasks'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!configured) return;
    loadTasks(true); // Show loading on initial load
    intervalRef.current = setInterval(() => loadTasks(false), REFRESH_INTERVAL); // Silent polling
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [configured, loadTasks]);

  const reassign = useCallback(
    async (taskId: string, assigneeId: string | null) => {
      await updateTaskAssignee(taskId, assigneeId);
      await loadTasks();
    },
    [loadTasks]
  );

  const changeDue = useCallback(
    async (taskId: string, due: { date?: string; string?: string } | null) => {
      await updateTaskDue(taskId, due);
      await loadTasks();
    },
    [loadTasks]
  );

  const addTask = useCallback(
    async (params: CreateTaskParams) => {
      await createTask(params);
      await loadTasks();
    },
    [loadTasks]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      await deleteTask(taskId);
      await loadTasks();
    },
    [loadTasks]
  );

  const completeTask = useCallback(
    async (taskId: string) => {
      await closeTask(taskId);
      await loadTasks();
    },
    [loadTasks]
  );

  return {
    tasks,
    completedTasks,
    loading,
    error,
    configured,
    collaborators,
    reassign,
    changeDue,
    addTask,
    removeTask,
    completeTask,
    refresh: loadTasks,
    lastUpdated,
  };
}
