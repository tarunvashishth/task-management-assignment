import { Server, Socket } from 'socket.io';
import { ITask } from '../types';

// Maps userId -> Set of socketIds
const userSocketMap = new Map<string, Set<string>>();

class SocketService {
  private io!: Server;

  initialize(io: Server): void {
    this.io = io;
  }

  trackConnection(socketId: string, userId: string): void {
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId)!.add(socketId);
  }

  onDisconnect(socketId: string, userId: string): void {
    const sockets = userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) userSocketMap.delete(userId);
    }
  }

  joinTaskRoom(socket: Socket, taskId: string): void {
    socket.join(`task:${taskId}`);
  }

  leaveTaskRoom(socket: Socket, taskId: string): void {
    socket.leave(`task:${taskId}`);
  }

  // Force all sockets of a user out of a task room (called on unassign)
  evictUserFromRoom(userId: string, taskId: string): void {
    const socketIds = userSocketMap.get(userId);
    if (!socketIds || !this.io) return;

    const room = `task:${taskId}`;
    for (const socketId of socketIds) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(room);
        socket.emit('task:evicted', { taskId });
      }
    }
  }

  emitTaskCreated(task: ITask): void {
    if (!this.io) return;
    const creatorId = task.creator_id.toString();
    const assigneeId = task.assignee_id?.toString();

    // Emit to all sockets of creator
    this.emitToUser(creatorId, 'task:created', { task });

    // Emit to all sockets of assignee if different from creator
    if (assigneeId && assigneeId !== creatorId) {
      this.emitToUser(assigneeId, 'task:created', { task });
    }
  }

  emitTaskUpdated(task: ITask): void {
    if (!this.io) return;
    const room = `task:${task._id.toString()}`;
    this.io.to(room).emit('task:updated', { task });

    // Also emit directly to creator/assignee only if they haven't joined the room
    // (avoids double delivery to users who are currently viewing the task detail)
    const creatorId = task.creator_id.toString();
    const assigneeId = task.assignee_id?.toString();

    this.emitToUserIfNotInRoom(creatorId, room, 'task:updated', { task });
    if (assigneeId && assigneeId !== creatorId) {
      this.emitToUserIfNotInRoom(assigneeId, room, 'task:updated', { task });
    }
  }

  emitTaskDeleted(taskId: string, creatorId: string, assigneeId?: string): void {
    if (!this.io) return;
    const payload = { taskId };
    this.io.to(`task:${taskId}`).emit('task:deleted', payload);
    this.emitToUser(creatorId, 'task:deleted', payload);
    if (assigneeId && assigneeId !== creatorId) {
      this.emitToUser(assigneeId, 'task:deleted', payload);
    }
  }

  emitUserEditing(taskId: string, userId: string, userEmail: string): void {
    if (!this.io) return;
    this.io.to(`task:${taskId}`).emit('task:editing', { taskId, userId, userEmail });
  }

  emitUserStoppedEditing(taskId: string, userId: string): void {
    if (!this.io) return;
    this.io.to(`task:${taskId}`).emit('task:stop-editing', { taskId, userId });
  }

  private emitToUser(userId: string, event: string, data: unknown): void {
    const socketIds = userSocketMap.get(userId);
    if (!socketIds) return;
    for (const socketId of socketIds) {
      this.io.to(socketId).emit(event, data);
    }
  }

  private emitToUserIfNotInRoom(userId: string, room: string, event: string, data: unknown): void {
    const socketIds = userSocketMap.get(userId);
    if (!socketIds) return;
    for (const socketId of socketIds) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && !socket.rooms.has(room)) {
        socket.emit(event, data);
      }
    }
  }
}

export default new SocketService();
