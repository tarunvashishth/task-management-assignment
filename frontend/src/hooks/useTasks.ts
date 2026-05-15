import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { tasksApi } from '../api/tasks.api';
import { Task, TaskFilters } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const filtersRef = useRef<TaskFilters>({});
  const requestIdRef = useRef(0);

  const fetchTasks = useCallback(async (newFilters?: TaskFilters, cursor?: string) => {
    if (newFilters !== undefined) filtersRef.current = newFilters;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const result = await tasksApi.getTasks({ ...filtersRef.current, cursor });
      if (requestId !== requestIdRef.current) return;

      if (cursor) {
        setTasks((prev) => [...prev, ...result.tasks]);
      } else {
        setTasks(result.tasks);
      }
      setNextCursor(result.nextCursor);
      setHasLoadedOnce(true);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (nextCursor) fetchTasks(undefined, nextCursor);
  }, [fetchTasks, nextCursor]);

  const createTask = useCallback(async (data: Partial<Task>): Promise<Task | null> => {
    try {
      const task = await tasksApi.createTask(data);
      setTasks((prev) => [task, ...prev]);
      toast.success('Task created');
      return task;
    } catch {
      toast.error('Failed to create task');
      return null;
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task> & { version: number }): Promise<Task | null> => {
    const prev = tasks.find((t) => t._id === id);

    // Optimistic update
    setTasks((ts) => ts.map((t) => (t._id === id ? { ...t, ...updates } : t)));

    try {
      const updated = await tasksApi.updateTask(id, updates);
      setTasks((ts) => ts.map((t) => (t._id === id ? updated : t)));
      return updated;
    } catch (err: unknown) {
      // Rollback on conflict or error
      if (prev) setTasks((ts) => ts.map((t) => (t._id === id ? prev : t)));

      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error('Task was updated by another user. Refreshing...');
        fetchTasks();
      } else {
        toast.error('Failed to update task');
      }
      return null;
    }
  }, [fetchTasks, tasks]);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t._id !== id));

    try {
      await tasksApi.deleteTask(id);
      toast.success('Task deleted');
      return true;
    } catch {
      setTasks(prev);
      toast.error('Failed to delete task');
      return false;
    }
  }, [tasks]);

  // Real-time event handlers
  const handleTaskCreated = useCallback((task: Task) => {
    setTasks((prev) => {
      if (prev.find((t) => t._id === task._id)) return prev;
      return [task, ...prev];
    });
  }, []);

  const handleTaskUpdated = useCallback((task: Task) => {
    setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }, []);

  return {
    tasks,
    isLoading,
    hasLoadedOnce,
    nextCursor,
    fetchTasks,
    loadMore,
    createTask,
    updateTask,
    deleteTask,
    handleTaskCreated,
    handleTaskUpdated,
    handleTaskDeleted,
  };
}
