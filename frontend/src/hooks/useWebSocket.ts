import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { authApi } from '../api/auth.api';
import { ConnectionState, Task } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

interface EditingUser {
  userId: string;
  userEmail: string;
}

interface UseWebSocketReturn {
  connectionState: ConnectionState;
  joinTaskRoom: (taskId: string) => void;
  leaveTaskRoom: (taskId: string) => void;
  notifyEditing: (taskId: string) => void;
  notifyStopEditing: (taskId: string) => void;
  onTaskCreated: (cb: (task: Task) => void) => void;
  onTaskUpdated: (cb: (task: Task) => void) => void;
  onTaskDeleted: (cb: (taskId: string) => void) => void;
  onUserEditing: (cb: (taskId: string, user: EditingUser) => void) => void;
  onUserStoppedEditing: (cb: (taskId: string, userId: string) => void) => void;
  onEvicted: (cb: (taskId: string) => void) => void;
}

export function useWebSocket(enabled: boolean): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  useEffect(() => {
    if (!enabled) return;

    let isCancelled = false;
    setConnectionState('connecting');

    authApi.getSocketToken()
      .then((token) => {
        if (isCancelled) return;

        const socket = io(SOCKET_URL, {
          auth: { token },
          withCredentials: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => setConnectionState('connected'));
        socket.on('disconnect', () => setConnectionState('disconnected'));
        socket.on('connect_error', () => setConnectionState('disconnected'));
        socket.io.on('reconnect_attempt', () => setConnectionState('connecting'));
      })
      .catch(() => {
        if (!isCancelled) setConnectionState('disconnected');
      });

    return () => {
      isCancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  const joinTaskRoom = useCallback((taskId: string) => {
    socketRef.current?.emit('task:join', { taskId });
  }, []);

  const leaveTaskRoom = useCallback((taskId: string) => {
    socketRef.current?.emit('task:leave', { taskId });
  }, []);

  const notifyEditing = useCallback((taskId: string) => {
    socketRef.current?.emit('task:editing', { taskId });
  }, []);

  const notifyStopEditing = useCallback((taskId: string) => {
    socketRef.current?.emit('task:stop-editing', { taskId });
  }, []);

  const onTaskCreated = useCallback((cb: (task: Task) => void) => {
    socketRef.current?.on('task:created', ({ task }: { task: Task }) => cb(task));
    return () => { socketRef.current?.off('task:created'); };
  }, []);

  const onTaskUpdated = useCallback((cb: (task: Task) => void) => {
    socketRef.current?.on('task:updated', ({ task }: { task: Task }) => cb(task));
    return () => { socketRef.current?.off('task:updated'); };
  }, []);

  const onTaskDeleted = useCallback((cb: (taskId: string) => void) => {
    socketRef.current?.on('task:deleted', ({ taskId }: { taskId: string }) => cb(taskId));
    return () => { socketRef.current?.off('task:deleted'); };
  }, []);

  const onUserEditing = useCallback((cb: (taskId: string, user: EditingUser) => void) => {
    socketRef.current?.on('task:editing', ({ taskId, userId, userEmail }: { taskId: string; userId: string; userEmail: string }) => {
      cb(taskId, { userId, userEmail });
    });
  }, []);

  const onUserStoppedEditing = useCallback((cb: (taskId: string, userId: string) => void) => {
    socketRef.current?.on('task:stop-editing', ({ taskId, userId }: { taskId: string; userId: string }) => {
      cb(taskId, userId);
    });
  }, []);

  const onEvicted = useCallback((cb: (taskId: string) => void) => {
    socketRef.current?.on('task:evicted', ({ taskId }: { taskId: string }) => cb(taskId));
  }, []);

  return {
    connectionState,
    joinTaskRoom,
    leaveTaskRoom,
    notifyEditing,
    notifyStopEditing,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onUserEditing,
    onUserStoppedEditing,
    onEvicted,
  };
}
