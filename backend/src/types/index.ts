import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  creator_id: Types.ObjectId;
  assignee_id?: Types.ObjectId;
  deadline?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: { id: string; email: string; jti: string };
}

export interface TaskFilters {
  status?: string;
  assignee_id?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE: 'UNPROCESSABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    public message: string,
    public field?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
