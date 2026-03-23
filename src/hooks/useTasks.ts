import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllTasks,
  fetchCollaborators,
  categorizeTasks,
  updateTaskAssignee,
  isConfigured,
} from '../api/todoist';
import type { TaskGroup, Collaborator } from '../types';

const REFRESH_INTERVAL = 5 * 60 * 1000;

interface UseTasksResult {
  tasks: TaskGroup | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
  collaborators: Collaborator[];
  reassign: (taskId: string, assigneeId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<TaskGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const collabRef = useRef<Collaborator[]>([]);

  const configured = isConfigured();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (collabRef.current.length === 0) {
        const collabs = await fetchCollaborators();
        collabRef.current = collabs;
        setCollaborators(collabs);
      }
      const rawTasks = await fetchAllTasks();
      const grouped = categorizeTasks(rawTasks, collabRef.current);
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

  useEffect(() => {
    if (!configured) return;
    loadTasks();
    intervalRef.current = setInterval(loadTasks, REFRESH_INTERVAL);
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

  return {
    tasks,
    loading,
    error,
    configured,
    collaborators,
    reassign,
    refresh: loadTasks,
    lastUpdated,
  };
}
