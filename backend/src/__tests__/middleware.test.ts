import request from 'supertest';
import app from '../app';

describe('Auth Middleware', () => {
  it('blocks requests without token', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('blocks requests with invalid token', async () => {
    const res = await request(app).get('/tasks').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('allows requests with valid token', async () => {
    const loginRes = await request(app)
      .post('/auth/register')
      .send({ email: 'middleware@example.com', password: 'password123' });

    const cookie = loginRes.headers['set-cookie'] as unknown as string[];
    const res = await request(app).get('/tasks').set('Cookie', cookie);
    expect(res.status).toBe(200);
  });

  it('blocks token after logout (JTI blocklist)', async () => {
    const loginRes = await request(app)
      .post('/auth/register')
      .send({ email: 'jti@example.com', password: 'password123' });

    const cookie = loginRes.headers['set-cookie'] as unknown as string[];

    await request(app).post('/auth/logout').set('Cookie', cookie);

    const res = await request(app).get('/tasks').set('Cookie', cookie);
    expect(res.status).toBe(401);
  });
});

describe('Rate Limiter', () => {
  it('allows requests within limit', async () => {
    // 10 max by default; just send a few
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'ratelimit@example.com', password: 'wrong' });
      expect(res.status).not.toBe(429);
    }
  });
});
