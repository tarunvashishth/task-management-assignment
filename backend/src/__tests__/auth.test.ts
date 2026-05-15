import request from 'supertest';
import app from '../app';

describe('Auth Routes', () => {
  describe('POST /auth/register', () => {
    it('registers a new user and returns 201', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 409 for duplicate email', async () => {
      await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'password123' });
      const res = await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'password123' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 422 for invalid email', async () => {
      const res = await request(app).post('/auth/register').send({ email: 'not-an-email', password: 'password123' });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 for short password', async () => {
      const res = await request(app).post('/auth/register').send({ email: 'x@example.com', password: '123' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/auth/register').send({ email: 'login@example.com', password: 'password123' });
    });

    it('returns 200 with cookies on valid credentials', async () => {
      const res = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('login@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 for non-existent user (no info leak)', async () => {
      const res = await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'password123' });
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid credentials');
    });
  });

  describe('POST /auth/logout + JTI blocklist', () => {
    it('invalidates the token so subsequent requests are rejected', async () => {
      const loginRes = await request(app)
        .post('/auth/register')
        .send({ email: 'blocklist@example.com', password: 'password123' });

      const cookie = loginRes.headers['set-cookie'] as unknown as string[];

      // Verify protected route works
      const meRes = await request(app).get('/auth/me').set('Cookie', cookie);
      expect(meRes.status).toBe(200);

      // Logout
      const logoutRes = await request(app).post('/auth/logout').set('Cookie', cookie);
      expect(logoutRes.status).toBe(200);

      // Old token should now be rejected
      const afterLogout = await request(app).get('/auth/me').set('Cookie', cookie);
      expect(afterLogout.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns current user with valid token', async () => {
      const loginRes = await request(app)
        .post('/auth/register')
        .send({ email: 'me@example.com', password: 'password123' });
      const cookie = loginRes.headers['set-cookie'] as unknown as string[];

      const res = await request(app).get('/auth/me').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('me@example.com');
    });
  });
});
