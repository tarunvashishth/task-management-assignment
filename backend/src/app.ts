import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import { User } from './models/user.model';
import { authenticate } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { AuthRequest } from './types';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users (for assignee dropdown)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
app.get('/users', authenticate, async (_req: AuthRequest, res, next) => {
  try {
    const users = await User.find({}, { email: 1 }).lean();
    res.json({ users: users.map(u => ({ id: u._id, email: u.email })) });
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

export default app;
