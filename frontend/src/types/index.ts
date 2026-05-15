export interface User {
  id: string;
  email: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  creator_id: string | User;
  assignee_id?: string | User;
  deadline?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: string;
  assignee_id?: string;
  from?: string;
  to?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    field?: string;
    retryAfter?: number;
  };
}

export type ConnectionState = 'connected' | 'connecting' | 'disconnected';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
