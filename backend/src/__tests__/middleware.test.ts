import request from 'supertest';
import app from '../app';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import authService from '../services/auth.service';
import { AuthRequest } from '../types';

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

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('CORS origin handling', () => {
  it('allows requests from a Vercel preview URL', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://my-app-abc123.vercel.app');
    expect(res.status).toBe(200);
  });

  it('allows requests with no origin header', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});

describe('optionalAuthenticate middleware', () => {
  it('calls next without setting user when no token is present', () => {
    const req = { headers: {}, cookies: {} } as unknown as AuthRequest;
    const res = {} as never;
    const next = jest.fn();
    optionalAuthenticate(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });

  it('populates req.user with a valid access token in cookie', () => {
    const { accessToken } = authService.generateTokens('aaaaaaaaaaaaaaaaaaaaaaaa', 'opt@example.com');
    const req = { headers: {}, cookies: { access_token: accessToken } } as unknown as AuthRequest;
    const res = {} as never;
    const next = jest.fn();
    optionalAuthenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.email).toBe('opt@example.com');
  });

  it('calls next without setting user when token is invalid', () => {
    const req = {
      headers: { authorization: 'Bearer not.a.valid.token' },
      cookies: {},
    } as unknown as AuthRequest;
    const res = {} as never;
    const next = jest.fn();
    optionalAuthenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
