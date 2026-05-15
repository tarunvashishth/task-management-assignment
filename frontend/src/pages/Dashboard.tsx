import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { tasksApi } from '../api/tasks.api';
import { Header } from '../components/layout/Header';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskModal } from '../components/tasks/TaskModal';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useScrollFadeIn } from '../hooks/useScrollFadeIn';
import { useWebSocket } from '../hooks/useWebSocket';
import { Task, TaskFilters as Filters, User } from '../types';

function getAssigneeId(val: Task['assignee_id']): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.id || (val as unknown as { _id?: string })._id || '';
}

interface EditingUsers {
  [taskId: string]: Array<{ userId: string; userEmail: string }>;
}

export function Dashboard() {
  const { user } = useAuth();
  const {
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
  } = useTasks();

  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);
  const gridRef = useScrollFadeIn<HTMLDivElement>(tasks.length > 0);
  const [users, setUsers] = useState<User[]>([]);
  const [editingUsers, setEditingUsers] = useState<EditingUsers>({});
  const editingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const ws = useWebSocket(!!user);

  useEffect(() => {
    fetchTasks();
    tasksApi.getUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    ws.onTaskCreated((task) => {
      handleTaskCreated(task);
      toast.success(`New task: "${task.title}"`);
    });
    ws.onTaskUpdated(handleTaskUpdated);
    ws.onTaskDeleted((taskId) => {
      handleTaskDeleted(taskId);
      if (modalTask && typeof modalTask === 'object' && modalTask._id === taskId) {
        setModalTask(undefined);
        toast('Task was deleted', { icon: '🗑️' });
      }
    });
    ws.onUserEditing((taskId, editingUser) => {
      setEditingUsers((prev) => {
        const existing = prev[taskId] || [];
        if (existing.find((u) => u.userId === editingUser.userId)) return prev;
        return { ...prev, [taskId]: [...existing, editingUser] };
      });
      const key = `${taskId}:${editingUser.userId}`;
      if (editingTimeouts.current[key]) clearTimeout(editingTimeouts.current[key]);
      editingTimeouts.current[key] = setTimeout(() => {
        setEditingUsers((prev) => ({
          ...prev,
          [taskId]: (prev[taskId] || []).filter((u) => u.userId !== editingUser.userId),
        }));
      }, 3000);
    });
    ws.onUserStoppedEditing((taskId, userId) => {
      setEditingUsers((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter((u) => u.userId !== userId),
      }));
    });
    ws.onEvicted((taskId) => {
      handleTaskDeleted(taskId);
      toast('You were removed from this task', { icon: 'ℹ️' });
    });
  }, [ws, handleTaskCreated, handleTaskUpdated, handleTaskDeleted, modalTask]);

  const handleFilterChange = useCallback((filters: Filters) => {
    fetchTasks(filters);
  }, [fetchTasks]);

  async function handleSave(data: Partial<Task> & { version?: number }): Promise<Task | null> {
    if (modalTask) {
      const { assignee_id, ...patchData } = data as Partial<Task> & { version: number };
      const result = await updateTask(modalTask._id, patchData as Partial<Task> & { version: number });
      if (result === null) return null;
      const prevId = getAssigneeId(modalTask.assignee_id);
      const newId = typeof assignee_id === 'string' ? assignee_id : getAssigneeId(assignee_id);
      if (newId !== prevId) {
        try {
          await tasksApi.assignTask(modalTask._id, newId || null);
        } catch {
          toast.error('Failed to update assignee');
        }
      }
      return result;
    } else {
      return createTask(data);
    }
  }

  async function handleDelete(taskId: string) {
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(taskId);
  }

  function handleEditingChange(isEditing: boolean, taskId?: string) {
    if (!taskId) return;
    if (isEditing) ws.notifyEditing(taskId);
    else ws.notifyStopEditing(taskId);
  }

  const isEmpty = !isLoading && tasks.length === 0;
  const showSkeletons = isLoading && !hasLoadedOnce;
  const showInlineLoading = isLoading && hasLoadedOnce;

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col">
      <Header connectionState={ws.connectionState} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {tasks.length > 0 ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''}` : 'Nothing here yet'}
            </p>
          </div>
          <button
            onClick={() => setModalTask(null)}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <TaskFilters users={users} onChange={handleFilterChange} />
        </div>

        {showInlineLoading && (
          <div className="mb-4 text-sm text-gray-400" aria-live="polite">
            Updating tasks...
          </div>
        )}

        {/* Skeleton loading */}
        {showSkeletons && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            {[1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No tasks yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">Create your first task to start organizing your work and collaborating with your team.</p>
            <button
              onClick={() => setModalTask(null)}
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create your first task
            </button>
          </div>
        )}

        {/* Task grid */}
        <div ref={gridRef} className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              currentUserId={user?.id || ''}
              editingUsers={editingUsers[task._id] || []}
              onEdit={() => setModalTask(task)}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Load more */}
        {nextCursor && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="btn-ghost border border-gray-200 px-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Loading…
                </span>
              ) : 'Load more tasks'}
            </button>
          </div>
        )}
      </main>

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          users={users}
          onClose={() => setModalTask(undefined)}
          onSave={handleSave}
          onEditingChange={handleEditingChange}
        />
      )}
    </div>
  );
}
