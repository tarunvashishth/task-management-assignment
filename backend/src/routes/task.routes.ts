import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import taskService from '../services/task.service';
import socketService from '../services/socket.service';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest, AppError, ErrorCodes } from '../types';

const router = Router();

router.use(authenticate);

const listTasksQuerySchema = z.object({
  status: z.enum(['pending', 'in-progress', 'completed']).optional(),
  assignee_id: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const assignSchema = z.object({
  assignee_id: z.string().nullable().optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).optional(),
  assignee_id: z.string().optional(),
  deadline: z.string().datetime({ offset: true }).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).optional(),
  deadline: z.string().datetime({ offset: true }).optional().nullable(),
  version: z.number().int().min(0, 'version is required for updates'),
});

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: Get all visible tasks (paginated)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in-progress, completed] }
 *       - in: query
 *         name: assignee_id
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated task list
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = listTasksQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new AppError(422, ErrorCodes.VALIDATION_ERROR, firstError.message, firstError.path[0] as string);
    }
    const result = await taskService.getVisibleTasks(req.user!.id, parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *               assignee_id: { type: string }
 *               deadline: { type: string, format: date-time }
 *     responses:
 *       201: { description: Task created }
 *       422: { description: Validation error }
 */
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new AppError(422, ErrorCodes.VALIDATION_ERROR, firstError.message, firstError.path[0] as string);
    }

    const task = await taskService.createTask(parsed.data as Parameters<typeof taskService.createTask>[0], req.user!.id);
    socketService.emitTaskCreated(task);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task details }
 *       404: { description: Task not found or not visible }
 */
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.getVisibleTaskById(req.params.id, req.user!.id);
    if (!task) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Task not found');
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task (requires version for optimistic locking)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [version]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *               deadline: { type: string }
 *               version: { type: integer }
 *     responses:
 *       200: { description: Task updated }
 *       409: { description: Version conflict }
 */
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new AppError(422, ErrorCodes.VALIDATION_ERROR, firstError.message, firstError.path[0] as string);
    }

    const task = await taskService.updateTask(req.params.id, req.user!.id, parsed.data as Parameters<typeof taskService.updateTask>[2]);
    socketService.emitTaskUpdated(task);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task (creator only)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Task deleted }
 *       403: { description: Not the task creator }
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // getVisibleTaskById returns a populated task, so creator_id/assignee_id may be User documents.
    // Use _id explicitly instead of .toString() on the ref.
    const task = await taskService.getVisibleTaskById(req.params.id, req.user!.id);
    const creatorRef = task?.creator_id as unknown as { _id?: unknown } | null | undefined;
    const assigneeRef = task?.assignee_id as unknown as { _id?: unknown } | null | undefined;
    const creatorId = creatorRef?._id ? String(creatorRef._id) : creatorRef ? String(creatorRef) : undefined;
    const assigneeId = assigneeRef?._id ? String(assigneeRef._id) : assigneeRef ? String(assigneeRef) : undefined;

    await taskService.deleteTask(req.params.id, req.user!.id);
    if (creatorId) {
      socketService.emitTaskDeleted(req.params.id, creatorId, assigneeId);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /tasks/{id}/assign:
 *   patch:
 *     summary: Assign or unassign a task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignee_id: { type: string, nullable: true }
 *     responses:
 *       200: { description: Task assigned }
 *       403: { description: Not the creator }
 *       404: { description: Assignee not found }
 */
router.patch('/:id/assign', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = assignSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new AppError(422, ErrorCodes.VALIDATION_ERROR, firstError.message, firstError.path[0] as string);
    }
    const { assignee_id } = parsed.data;

    const { task, previousAssigneeId } = await taskService.assignTask(
      req.params.id,
      assignee_id || null,
      req.user!.id,
    );

    // Evict previous assignee from socket room
    if (previousAssigneeId && previousAssigneeId !== assignee_id) {
      socketService.evictUserFromRoom(previousAssigneeId, req.params.id);
    }

    socketService.emitTaskUpdated(task);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

export default router;
