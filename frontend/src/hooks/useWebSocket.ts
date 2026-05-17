import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { authApi } from '../api/auth.api';
import { ConnectionState, Task } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '';

interface EditingUser {
  userId: string;
  userEmail: string;
}

export interface UseWebSocketOptions {
  enabled: boolean;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  onUserEditing?: (taskId: string, user: EditingUser) => void;
  onUserStoppedEditing?: (taskId: string, userId: string) => void;
  onEvicted?: (taskId: string) => void;
}

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  joinTaskRoom: (taskId: string) => void;
  leaveTaskRoom: (taskId: string) => void;
  notifyEditing: (taskId: string) => void;
  notifyStopEditing: (taskId: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { enabled } = options;

  // Latest callbacks always available without re-registering socket listeners.
  const optsRef = useRef(options);
  optsRef.current = options;

  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  useEffect(() => {
    if (!enabled) return;

    let isCancelled = false;
    setConnectionState('connecting');

    if (!SOCKET_URL) {
      console.error('Socket.IO URL is missing. Set VITE_SOCKET_URL to your Render backend origin.');
      setConnectionState('disconnected');
      return;
    }

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
        socket.on('connect_error', (err) => {
          console.error('Socket.IO connection failed:', err.message);
          setConnectionState('disconnected');
        });
        socket.io.on('reconnect_attempt', () => setConnectionState('connecting'));

        socket.on('task:created', ({ task }: { task: Task }) => {
          optsRef.current.onTaskCreated?.(task);
        });
        socket.on('task:updated', ({ task }: { task: Task }) => {
          optsRef.current.onTaskUpdated?.(task);
        });
        socket.on('task:deleted', ({ taskId }: { taskId: string }) => {
          optsRef.current.onTaskDeleted?.(taskId);
        });
        socket.on('task:editing', ({ taskId, userId, userEmail }: { taskId: string; userId: string; userEmail: string }) => {
          optsRef.current.onUserEditing?.(taskId, { userId, userEmail });
        });
        socket.on('task:stop-editing', ({ taskId, userId }: { taskId: string; userId: string }) => {
          optsRef.current.onUserStoppedEditing?.(taskId, userId);
        });
        socket.on('task:evicted', ({ taskId }: { taskId: string }) => {
          optsRef.current.onEvicted?.(taskId);
        });
      })
      .catch((err) => {
        console.error('Could not get Socket.IO auth token:', err.response?.status || err.message);
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

  return {
    connectionState,
    joinTaskRoom,
    leaveTaskRoom,
    notifyEditing,
    notifyStopEditing,
  };
}
