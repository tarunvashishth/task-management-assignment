import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '../types';

// Bypass rate limiting in test environment
const noopMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

export const authRateLimit = process.env.NODE_ENV === 'test' ? noopMiddleware : rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const retryAfter = Math.ceil(
      parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) / 1000,
    );
    res.status(429).json({
      error: {
        code: ErrorCodes.RATE_LIMITED,
        message: 'Too many requests. Please try again later.',
        retryAfter,
      },
    });
  },
});
