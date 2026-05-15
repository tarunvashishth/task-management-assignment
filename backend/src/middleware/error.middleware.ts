import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError, ErrorCodes } from '../types';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.field && { field: err.field }),
      },
    });
    return;
  }

  // Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.keys(err.errors);
    res.status(422).json({
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        field: fields[0],
      },
    });
    return;
  }

  // MongoDB duplicate key
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json({
      error: {
        code: ErrorCodes.CONFLICT,
        message: 'Resource already exists',
      },
    });
    return;
  }

  // MongoDB connection errors
  if (err instanceof mongoose.mongo.MongoNetworkError || err instanceof mongoose.mongo.MongoServerError) {
    res.status(503).json({
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Service unavailable',
      },
    });
    return;
  }

  // Unknown errors
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: isDev && err instanceof Error ? err.message : 'Internal server error',
    },
  });
}
