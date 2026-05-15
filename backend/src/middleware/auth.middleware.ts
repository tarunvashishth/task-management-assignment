import { Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { AuthRequest, AppError, ErrorCodes } from '../types';

function extractToken(req: AuthRequest): string | null {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fall back to httpOnly cookie
  if (req.cookies?.access_token) {
    return req.cookies.access_token as string;
  }

  return null;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Authentication required');
    }

    const payload = authService.verifyAccessToken(token);

    if (authService.isBlocked(payload.jti)) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Token has been revoked');
    }

    req.user = { id: payload.id, email: payload.email, jti: payload.jti };
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuthenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = authService.verifyAccessToken(token);
    if (!authService.isBlocked(payload.jti)) {
      req.user = { id: payload.id, email: payload.email, jti: payload.jti };
    }
  } catch {
    // Silently ignore invalid tokens in optional mode
  }

  next();
}
