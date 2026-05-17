import { Server, Socket } from 'socket.io';
import { Task } from '../models/task.model';
import { ITask } from '../types';

// Safely extract a user id from a ref that may be a string, an ObjectId, or a populated user document.
// `ref.toString()` on a populated Mongoose document returns the whole object as a string, not the id —
// so we have to look inside _id first.
function extractId(ref: unknown): string {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  const obj = ref as { _id?: unknown; toString?: () => string };
  if (obj._id) return String(obj._id);
  return obj.toString ? obj.toString() : String(ref);
}

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

  emitTaskCreated(task: ITask, excludeUserId?: string): void {
    if (!this.io) return;
    const creatorId = extractId(task.creator_id);
    const assigneeId = extractId(task.assignee_id);

    if (creatorId && creatorId !== excludeUserId) {
      this.emitToUser(creatorId, 'task:created', { task });
    }
    if (assigneeId && assigneeId !== creatorId && assigneeId !== excludeUserId) {
      this.emitToUser(assigneeId, 'task:created', { task });
    }
  }

  emitTaskUpdated(task: ITask, excludeUserId?: string): void {
    if (!this.io) return;
    const room = `task:${extractId(task._id)}`;
    const creatorId = extractId(task.creator_id);
    const assigneeId = extractId(task.assignee_id);

    if (creatorId && creatorId !== excludeUserId) {
      this.emitToUserIfNotInRoom(creatorId, room, 'task:updated', { task });
    }
    if (assigneeId && assigneeId !== creatorId && assigneeId !== excludeUserId) {
      this.emitToUserIfNotInRoom(assigneeId, room, 'task:updated', { task });
    }
  }

  emitTaskDeleted(taskId: string, creatorId: string, assigneeId?: string, excludeUserId?: string): void {
    if (!this.io) return;
    const payload = { taskId };
    if (creatorId && creatorId !== excludeUserId) {
      this.emitToUser(creatorId, 'task:deleted', payload);
    }
    if (assigneeId && assigneeId !== creatorId && assigneeId !== excludeUserId) {
      this.emitToUser(assigneeId, 'task:deleted', payload);
    }
  }

  async emitUserEditing(taskId: string, userId: string, userEmail: string): Promise<void> {
    if (!this.io) return;
    const recipients = await this.collaboratorIds(taskId, userId);
    const payload = { taskId, userId, userEmail };
    for (const recipientId of recipients) {
      this.emitToUser(recipientId, 'task:editing', payload);
    }
  }

  async emitUserStoppedEditing(taskId: string, userId: string): Promise<void> {
    if (!this.io) return;
    const recipients = await this.collaboratorIds(taskId, userId);
    const payload = { taskId, userId };
    for (const recipientId of recipients) {
      this.emitToUser(recipientId, 'task:stop-editing', payload);
    }
  }

  private async collaboratorIds(taskId: string, excludeUserId: string): Promise<string[]> {
    const task = await Task.findById(taskId).select('creator_id assignee_id').lean();
    if (!task) return [];
    const ids = new Set<string>();
    ids.add(task.creator_id.toString());
    if (task.assignee_id) ids.add(task.assignee_id.toString());
    ids.delete(excludeUserId);
    return Array.from(ids);
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
