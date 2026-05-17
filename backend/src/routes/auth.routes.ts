import { Router, Request, Response, NextFunction, CookieOptions } from 'express';
import { z } from 'zod';
import authService from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { AuthRequest, AppError, ErrorCodes } from '../types';

const router = Router();

const hasHttpsFrontend = (process.env.FRONTEND_URL || '')
  .split(',')
  .some((origin) => origin.trim().startsWith('https://'));
const useCrossSiteCookies = process.env.NODE_ENV === 'production' || hasHttpsFrontend;

const COOKIE_BASE: CookieOptions = {
  httpOnly: true,
  secure: useCrossSiteCookies,
  sameSite: useCrossSiteCookies ? 'none' : 'lax',
};

const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('access_token', accessToken, {
    ...COOKIE_BASE,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_BASE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/auth/refresh',
  });
}

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201: { description: User created successfully }
 *       409: { description: Email already in use }
 *       422: { description: Validation error }
 */
router.post('/register', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new AppError(422, ErrorCodes.VALIDATION_ERROR, firstError.message, firstError.path[0] as string);
    }

    const { email, password } = parsed.data;
    const user = await authService.register(email, password);
    const { accessToken, refreshToken } = authService.generateTokens(user._id.toString(), user.email);

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: { id: user._id, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new AppError(422, ErrorCodes.VALIDATION_ERROR, firstError.message, firstError.path[0] as string);
    }

    const { email, password } = parsed.data;
    const { user, accessToken, refreshToken } = await authService.login(email, password);

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      user: { id: user._id, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate token
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: Logged out successfully }
 */
router.post('/logout', authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    authService.logout(req.user!.jti, req.user!.refresh_jti);
    res.clearCookie('access_token', COOKIE_BASE);
    res.clearCookie('refresh_token', { ...COOKIE_BASE, path: '/auth/refresh' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Token refreshed }
 *       401: { description: Invalid refresh token }
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodyToken = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
    const token = (req.cookies?.refresh_token as string | undefined) || bodyToken;
    if (!token) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Refresh token required');
    }

    const payload = authService.verifyRefreshToken(token);

    if (authService.isBlocked(payload.jti)) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Refresh token has been revoked');
    }

    const user = await authService.getUserById(payload.id);
    if (!user) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'User not found');
    }

    const { accessToken, refreshToken } = authService.generateTokens(user._id.toString(), user.email);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      user: { id: user._id, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Not authenticated }
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getUserById(req.user!.id);
    if (!user) throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'User not found');
    res.json({ user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post('/socket-token', authenticate, (req: AuthRequest, res: Response) => {
  const token = authService.generateSocketToken(req.user!.id, req.user!.email);
  res.json({ token });
});

export default router;
