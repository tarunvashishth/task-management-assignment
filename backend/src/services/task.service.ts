import { Types } from 'mongoose';
import { Task } from '../models/task.model';
import { User } from '../models/user.model';
import { ITask, TaskFilters, AppError, ErrorCodes } from '../types';

class TaskService {
  private get paginationLimit(): number {
    return parseInt(process.env.PAGINATION_LIMIT || '20', 10);
  }

  private encodeCursor(id: string): string {
    return Buffer.from(id).toString('base64');
  }

  private decodeCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  }

  async getVisibleTasks(
    userId: string,
    filters: TaskFilters,
  ): Promise<{ tasks: ITask[]; nextCursor: string | null }> {
    const limit = Math.min(filters.limit || this.paginationLimit, 100);

    // Base visibility filter: must be creator or assignee
    const query: Record<string, unknown> = {
      $or: [
        { creator_id: new Types.ObjectId(userId) },
        { assignee_id: new Types.ObjectId(userId) },
      ],
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.assignee_id) {
      query.assignee_id = new Types.ObjectId(filters.assignee_id);
    }

    if (filters.from || filters.to) {
      const dateFilter: Record<string, Date> = {};
      if (filters.from) dateFilter.$gte = new Date(filters.from);
      if (filters.to) dateFilter.$lte = new Date(filters.to);
      query.createdAt = dateFilter;
    }

    if (filters.cursor) {
      const decodedId = this.decodeCursor(filters.cursor);
      if (!Types.ObjectId.isValid(decodedId)) {
        throw new AppError(422, ErrorCodes.VALIDATION_ERROR, 'Invalid cursor');
      }
      query._id = { $lt: new Types.ObjectId(decodedId) };
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('creator_id', 'email')
      .populate('assignee_id', 'email')
      .lean();

    const hasMore = tasks.length > limit;
    const resultTasks = hasMore ? tasks.slice(0, limit) : tasks;
    const nextCursor = hasMore ? this.encodeCursor(resultTasks[resultTasks.length - 1]._id.toString()) : null;

    return { tasks: resultTasks as unknown as ITask[], nextCursor };
  }

  async getVisibleTaskById(taskId: string, userId: string): Promise<ITask | null> {
    if (!Types.ObjectId.isValid(taskId)) return null;

    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { creator_id: new Types.ObjectId(userId) },
        { assignee_id: new Types.ObjectId(userId) },
      ],
    })
      .populate('creator_id', 'email')
      .populate('assignee_id', 'email');

    return task;
  }

  async createTask(data: Partial<ITask>, userId: string): Promise<ITask> {
    const task = await Task.create({
      ...data,
      creator_id: new Types.ObjectId(userId),
      version: 0,
    });

    return Task.findById(task._id)
      .populate('creator_id', 'email')
      .populate('assignee_id', 'email') as Promise<ITask>;
  }

  async updateTask(taskId: string, userId: string, updates: Partial<ITask> & { version: number }): Promise<ITask> {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Task not found');
    }

    const { version, ...rest } = updates;

    // Must be creator or assignee to edit
    const visibilityCheck = await Task.findOne({
      _id: taskId,
      $or: [
        { creator_id: new Types.ObjectId(userId) },
        { assignee_id: new Types.ObjectId(userId) },
      ],
    });

    if (!visibilityCheck) {
      // Check if task exists at all
      const exists = await Task.findById(taskId);
      if (!exists) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Task not found');
      throw new AppError(403, ErrorCodes.FORBIDDEN, 'You do not have access to this task');
    }

    // Optimistic locking: match on _id AND current version
    const updated = await Task.findOneAndUpdate(
      { _id: taskId, version },
      { $set: rest, $inc: { version: 1 } },
      { new: true },
    )
      .populate('creator_id', 'email')
      .populate('assignee_id', 'email');

    if (!updated) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Task was modified by another user. Please refresh and try again.');
    }

    return updated;
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Task not found');
    }

    const task = await Task.findById(taskId);
    if (!task) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Task not found');

    if (task.creator_id.toString() !== userId) {
      throw new AppError(403, ErrorCodes.FORBIDDEN, 'Only the task creator can delete it');
    }

    await Task.deleteOne({ _id: taskId });
  }

  async assignTask(
    taskId: string,
    assigneeId: string | null,
    requesterId: string,
  ): Promise<{ task: ITask; previousAssigneeId: string | null }> {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Task not found');
    }

    const task = await Task.findById(taskId);
    if (!task) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Task not found');

    if (task.creator_id.toString() !== requesterId) {
      throw new AppError(403, ErrorCodes.FORBIDDEN, 'Only the task creator can assign it');
    }

    if (assigneeId) {
      if (!Types.ObjectId.isValid(assigneeId)) {
        throw new AppError(404, ErrorCodes.NOT_FOUND, 'Assignee not found');
      }
      const assignee = await User.findById(assigneeId);
      if (!assignee) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Assignee not found');
    }

    const previousAssigneeId = task.assignee_id?.toString() || null;

    const updated = await Task.findByIdAndUpdate(
      taskId,
      assigneeId
        ? { $set: { assignee_id: new Types.ObjectId(assigneeId) }, $inc: { version: 1 } }
        : { $unset: { assignee_id: '' }, $inc: { version: 1 } },
      { new: true },
    )
      .populate('creator_id', 'email')
      .populate('assignee_id', 'email');

    return { task: updated as ITask, previousAssigneeId };
  }

  async getAllUserIdsForTask(taskId: string): Promise<string[]> {
    const task = await Task.findById(taskId);
    if (!task) return [];

    const ids = [task.creator_id.toString()];
    if (task.assignee_id) ids.push(task.assignee_id.toString());
    return ids;
  }
}

export default new TaskService();
