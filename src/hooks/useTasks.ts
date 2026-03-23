import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllTasks,
  categorizeTasks,
  isConfigured,
} from '../api/todoist';
import type { TaskGroup } from '../types';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface UseTasksResult {
  tasks: TaskGroup | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<TaskGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const configured = isConfigured();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rawTasks = await fetchAllTasks();
      const grouped = categorizeTasks(rawTasks);
      setTasks(grouped);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tasks'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!configured) return;

    loadTasks();

    intervalRef.current = setInterval(loadTasks, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [configured, loadTasks]);

  return {
    tasks,
    loading,
    error,
    configured,
    refresh: loadTasks,
    lastUpdated,
  };
}
