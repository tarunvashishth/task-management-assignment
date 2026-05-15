import request from 'supertest';
import app from '../app';
import taskService from '../services/task.service';
import { Task } from '../models/task.model';

async function registerAndLogin(email: string) {
  const res = await request(app).post('/auth/register').send({ email, password: 'password123' });
  return {
    cookie: res.headers['set-cookie'] as unknown as string[],
    userId: res.body.user.id as string,
  };
}

describe('Task Routes', () => {
  let user1: { cookie: string[]; userId: string };
  let user2: { cookie: string[]; userId: string };

  beforeEach(async () => {
    user1 = await registerAndLogin('u1@example.com');
    user2 = await registerAndLogin('u2@example.com');
  });

  describe('POST /tasks', () => {
    it('creates a task and returns 201', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Cookie', user1.cookie)
        .send({ title: 'Test Task' });

      expect(res.status).toBe(201);
      expect(res.body.task.title).toBe('Test Task');
      expect(res.body.task.version).toBe(0);
    });

    it('returns 422 when title is missing', async () => {
      const res = await request(app).post('/tasks').set('Cookie', user1.cookie).send({});
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/tasks').send({ title: 'No Auth' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /tasks', () => {
    it('only returns tasks visible to the requesting user', async () => {
      // user1 creates a task
      await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'U1 Task' });

      // user2 creates a task
      await request(app).post('/tasks').set('Cookie', user2.cookie).send({ title: 'U2 Task' });

      const u1Res = await request(app).get('/tasks').set('Cookie', user1.cookie);
      const u2Res = await request(app).get('/tasks').set('Cookie', user2.cookie);

      expect(u1Res.body.tasks).toHaveLength(1);
      expect(u1Res.body.tasks[0].title).toBe('U1 Task');

      expect(u2Res.body.tasks).toHaveLength(1);
      expect(u2Res.body.tasks[0].title).toBe('U2 Task');
    });

    it('filters by status', async () => {
      await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Pending', status: 'pending' });
      await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Done', status: 'completed' });

      const res = await request(app).get('/tasks?status=pending').set('Cookie', user1.cookie);
      expect(res.body.tasks).toHaveLength(1);
      expect(res.body.tasks[0].title).toBe('Pending');
    });

    it('returns cursor for next page when limit exceeded', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: `Task ${i}` });
      }

      const res = await request(app).get('/tasks?limit=2').set('Cookie', user1.cookie);
      expect(res.body.tasks).toHaveLength(2);
      expect(res.body.nextCursor).not.toBeNull();
    });
  });

  describe('GET /tasks/:id', () => {
    it('returns 404 for a task not visible to the user', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Private' });
      const taskId = createRes.body.task._id;

      const res = await request(app).get(`/tasks/${taskId}`).set('Cookie', user2.cookie);
      expect(res.status).toBe(404);
    });

    it('returns task for creator', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Mine' });
      const taskId = createRes.body.task._id;

      const res = await request(app).get(`/tasks/${taskId}`).set('Cookie', user1.cookie);
      expect(res.status).toBe(200);
      expect(res.body.task.title).toBe('Mine');
    });
  });

  describe('PATCH /tasks/:id (optimistic locking)', () => {
    it('updates with correct version', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Original' });
      const { _id, version } = createRes.body.task;

      const res = await request(app)
        .patch(`/tasks/${_id}`)
        .set('Cookie', user1.cookie)
        .send({ title: 'Updated', version });

      expect(res.status).toBe(200);
      expect(res.body.task.title).toBe('Updated');
      expect(res.body.task.version).toBe(1);
    });

    it('returns 409 on version conflict', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Concurrent' });
      const { _id } = createRes.body.task;

      // First update succeeds
      await request(app).patch(`/tasks/${_id}`).set('Cookie', user1.cookie).send({ title: 'First', version: 0 });

      // Second update with stale version fails
      const res = await request(app)
        .patch(`/tasks/${_id}`)
        .set('Cookie', user1.cookie)
        .send({ title: 'Conflict', version: 0 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 403 for non-creator/non-assignee', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Owned by U1' });
      const { _id, version } = createRes.body.task;

      const res = await request(app)
        .patch(`/tasks/${_id}`)
        .set('Cookie', user2.cookie)
        .send({ title: 'Hack', version });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('allows creator to delete', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Delete Me' });
      const { _id } = createRes.body.task;

      const res = await request(app).delete(`/tasks/${_id}`).set('Cookie', user1.cookie);
      expect(res.status).toBe(204);
    });

    it('returns 403 for non-creator', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Not Yours' });
      const { _id } = createRes.body.task;

      const res = await request(app).delete(`/tasks/${_id}`).set('Cookie', user2.cookie);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('assigns a valid user', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Assign Me' });
      const { _id } = createRes.body.task;

      const res = await request(app)
        .patch(`/tasks/${_id}/assign`)
        .set('Cookie', user1.cookie)
        .send({ assignee_id: user2.userId });

      expect(res.status).toBe(200);
    });

    it('re-assigns to a different user (evicts previous assignee)', async () => {
      const user3 = await registerAndLogin('u3@example.com');

      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Re-assign Me' });
      const { _id } = createRes.body.task;

      await request(app)
        .patch(`/tasks/${_id}/assign`)
        .set('Cookie', user1.cookie)
        .send({ assignee_id: user2.userId });

      const res = await request(app)
        .patch(`/tasks/${_id}/assign`)
        .set('Cookie', user1.cookie)
        .send({ assignee_id: user3.userId });

      expect(res.status).toBe(200);
    });

    it('returns 404 for non-existent assignee', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Assign Bad' });
      const { _id } = createRes.body.task;

      const res = await request(app)
        .patch(`/tasks/${_id}/assign`)
        .set('Cookie', user1.cookie)
        .send({ assignee_id: '507f1f77bcf86cd799439011' });

      expect(res.status).toBe(404);
    });

    it('returns 403 for non-creator', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'No Assign' });
      const { _id } = createRes.body.task;

      const res = await request(app)
        .patch(`/tasks/${_id}/assign`)
        .set('Cookie', user2.cookie)
        .send({ assignee_id: user2.userId });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /tasks query validation', () => {
    it('returns 422 for invalid status value', async () => {
      const res = await request(app).get('/tasks?status=invalid-status').set('Cookie', user1.cookie);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('filters tasks by date range', async () => {
      await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Dated Task' });
      const from = new Date(Date.now() - 60000).toISOString();
      const to = new Date(Date.now() + 60000).toISOString();

      const res = await request(app)
        .get(`/tasks?from=${from}&to=${to}`)
        .set('Cookie', user1.cookie);
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /tasks/:id body validation', () => {
    it('returns 422 when version is missing', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Validate Me' });
      const { _id } = createRes.body.task;

      const res = await request(app)
        .patch(`/tasks/${_id}`)
        .set('Cookie', user1.cookie)
        .send({ title: 'No Version' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Invalid ObjectId paths', () => {
    it('PATCH /tasks/invalid-id returns 404', async () => {
      const res = await request(app)
        .patch('/tasks/not-an-objectid')
        .set('Cookie', user1.cookie)
        .send({ title: 'x', version: 0 });
      expect(res.status).toBe(404);
    });

    it('DELETE /tasks/invalid-id returns 404', async () => {
      const res = await request(app).delete('/tasks/not-an-objectid').set('Cookie', user1.cookie);
      expect(res.status).toBe(404);
    });

    it('PATCH /tasks/invalid-id/assign returns 404', async () => {
      const res = await request(app)
        .patch('/tasks/not-an-objectid/assign')
        .set('Cookie', user1.cookie)
        .send({ assignee_id: user2.userId });
      expect(res.status).toBe(404);
    });

    it('assign with non-ObjectId assignee_id returns 404', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Bad Assignee' });
      const { _id } = createRes.body.task;

      const res = await request(app)
        .patch(`/tasks/${_id}/assign`)
        .set('Cookie', user1.cookie)
        .send({ assignee_id: 'not-a-valid-objectid' });
      expect(res.status).toBe(404);
    });

    it('assign with wrong body type returns 422', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Type Error' });
      const { _id } = createRes.body.task;

      const res = await request(app)
        .patch(`/tasks/${_id}/assign`)
        .set('Cookie', user1.cookie)
        .send({ assignee_id: 99999 });
      expect(res.status).toBe(422);
    });
  });

  describe('Cursor-based pagination', () => {
    it('uses the returned cursor to fetch the next page', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: `Page Task ${i}` });
      }

      const firstPage = await request(app).get('/tasks?limit=2').set('Cookie', user1.cookie);
      expect(firstPage.body.tasks).toHaveLength(2);
      const cursor = firstPage.body.nextCursor as string;
      expect(cursor).not.toBeNull();

      const secondPage = await request(app).get(`/tasks?limit=2&cursor=${cursor}`).set('Cookie', user1.cookie);
      expect(secondPage.status).toBe(200);
      expect(secondPage.body.tasks).toHaveLength(1);
    });

    it('returns 422 for an invalid cursor value', async () => {
      const invalidCursor = Buffer.from('not-a-valid-objectid').toString('base64');
      const res = await request(app).get(`/tasks?cursor=${invalidCursor}`).set('Cookie', user1.cookie);
      expect(res.status).toBe(422);
    });

    it('filters tasks by assignee_id', async () => {
      const createRes = await request(app).post('/tasks').set('Cookie', user1.cookie).send({ title: 'Assignee Filter' });
      const { _id } = createRes.body.task;

      await request(app).patch(`/tasks/${_id}/assign`).set('Cookie', user1.cookie).send({ assignee_id: user2.userId });

      const res = await request(app).get(`/tasks?assignee_id=${user2.userId}`).set('Cookie', user2.cookie);
      expect(res.status).toBe(200);
      expect(res.body.tasks.some((t: { title: string }) => t.title === 'Assignee Filter')).toBe(true);
    });
  });

  describe('taskService.getAllUserIdsForTask (unit)', () => {
    it('returns empty array for non-existent task', async () => {
      const ids = await taskService.getAllUserIdsForTask('507f1f77bcf86cd799439011');
      expect(ids).toEqual([]);
    });

    it('returns only creator id when no assignee', async () => {
      const task = await Task.create({ title: 'Solo', creator_id: '507f1f77bcf86cd799439011', version: 0 });
      const ids = await taskService.getAllUserIdsForTask(task._id.toString());
      expect(ids).toEqual(['507f1f77bcf86cd799439011']);
    });

    it('returns both creator and assignee ids when assigned', async () => {
      const task = await Task.create({
        title: 'Duo',
        creator_id: '507f1f77bcf86cd799439011',
        assignee_id: '507f191e810c19729de860ea',
        version: 0,
      });
      const ids = await taskService.getAllUserIdsForTask(task._id.toString());
      expect(ids).toContain('507f1f77bcf86cd799439011');
      expect(ids).toContain('507f191e810c19729de860ea');
    });
  });
});
