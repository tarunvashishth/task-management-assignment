import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { tasksApi } from '../api/tasks.api';
import { Header } from '../components/layout/Header';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskModal } from '../components/tasks/TaskModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useWebSocket } from '../hooks/useWebSocket';
import { Task, TaskFilters as Filters, User } from '../types';

interface EditingUsers {
  [taskId: string]: Array<{ userId: string; userEmail: string }>;
}

export function Dashboard() {
  const { user } = useAuth();
  const {
    tasks,
    isLoading,
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

  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined); // undefined = closed, null = create, Task = edit
  const [users, setUsers] = useState<User[]>([]);
  const [editingUsers, setEditingUsers] = useState<EditingUsers>({});
  const editingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const ws = useWebSocket(!!user);

  useEffect(() => {
    fetchTasks();
    tasksApi.getUsers().then(setUsers).catch(() => {});
  }, []);

  // Wire up real-time events
  useEffect(() => {
    ws.onTaskCreated((task) => {
      handleTaskCreated(task);
      toast.success(`New task: "${task.title}"`);
    });
    ws.onTaskUpdated(handleTaskUpdated);
    ws.onTaskDeleted((taskId) => {
      handleTaskDeleted(taskId);
      // If modal is open for this task, close it
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

      // Auto-clear after 3 seconds of no editing signal
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
      // Editing
      return updateTask(modalTask._id, data as Partial<Task> & { version: number });
    } else {
      // Creating
      return createTask(data);
    }
  }

  async function handleDelete(taskId: string) {
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(taskId);
  }

  function handleEditingChange(isEditing: boolean, taskId?: string) {
    if (!taskId) return;
    if (isEditing) {
      ws.notifyEditing(taskId);
    } else {
      ws.notifyStopEditing(taskId);
    }
  }

  const isEmpty = !isLoading && tasks.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header connectionState={ws.connectionState} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-gray-800">My Tasks</h2>
          <button
            onClick={() => setModalTask(null)}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors min-h-[44px]"
          >
            + Create Task
          </button>
        </div>

        <div className="mb-4">
          <TaskFilters users={users} onChange={handleFilterChange} />
        </div>

        {isLoading && tasks.length === 0 && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {isEmpty && (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium text-gray-400">No tasks yet</p>
            <p className="text-sm mt-1">Create your first task to get started</p>
            <button
              onClick={() => setModalTask(null)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors min-h-[44px]"
            >
              Create your first task
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
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

        {nextCursor && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="text-sm text-blue-500 hover:text-blue-700 border border-blue-200 px-4 py-2 rounded-lg min-h-[44px] disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load more'}
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
