import client from './client';
import { Task, TaskFilters, User } from '../types';

interface GetTasksParams extends TaskFilters {
  cursor?: string;
  limit?: number;
}

export const tasksApi = {
  async getTasks(params?: GetTasksParams): Promise<{ tasks: Task[]; nextCursor: string | null }> {
    const res = await client.get<{ tasks: Task[]; nextCursor: string | null }>('/tasks', { params });
    return res.data;
  },

  async getTask(id: string): Promise<Task> {
    const res = await client.get<{ task: Task }>(`/tasks/${id}`);
    return res.data.task;
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    const res = await client.post<{ task: Task }>('/tasks', data);
    return res.data.task;
  },

  async updateTask(id: string, updates: Partial<Task> & { version: number }): Promise<Task> {
    const res = await client.patch<{ task: Task }>(`/tasks/${id}`, updates);
    return res.data.task;
  },

  async deleteTask(id: string): Promise<void> {
    await client.delete(`/tasks/${id}`);
  },

  async assignTask(id: string, assigneeId: string | null): Promise<Task> {
    const res = await client.patch<{ task: Task }>(`/tasks/${id}/assign`, { assignee_id: assigneeId });
    return res.data.task;
  },

  async getUsers(): Promise<User[]> {
    const res = await client.get<{ users: User[] }>('/users');
    return res.data.users;
  },
};
