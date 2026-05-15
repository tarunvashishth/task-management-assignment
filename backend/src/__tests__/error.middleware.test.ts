import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { errorHandler } from '../middleware/error.middleware';
import { AppError, ErrorCodes } from '../types';

function makeApp(thrower: (req: Request, res: Response, next: NextFunction) => void) {
  const app = express();
  app.use(express.json());
  app.get('/test', thrower);
  app.use(errorHandler as express.ErrorRequestHandler);
  return app;
}

describe('errorHandler middleware', () => {
  it('returns AppError status/code/message', async () => {
    const app = makeApp((_req, _res, next) => {
      next(new AppError(400, ErrorCodes.VALIDATION_ERROR, 'bad request'));
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('bad request');
    expect(res.body.error.field).toBeUndefined();
  });

  it('includes field when AppError has one', async () => {
    const app = makeApp((_req, _res, next) => {
      next(new AppError(422, ErrorCodes.VALIDATION_ERROR, 'invalid', 'email'));
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(422);
    expect(res.body.error.field).toBe('email');
  });

  it('handles Mongoose ValidationError with 422', async () => {
    const app = makeApp((_req, _res, next) => {
      const err = new mongoose.Error.ValidationError();
      err.errors['email'] = new mongoose.Error.ValidatorError({
        path: 'email',
        message: 'invalid email',
      });
      next(err);
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.field).toBe('email');
  });

  it('handles MongoDB duplicate key (code 11000) with 409', async () => {
    const app = makeApp((_req, _res, next) => {
      next({ code: 11000 });
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('handles plain Error with 500 and exposes message in dev mode', async () => {
    const app = makeApp((_req, _res, next) => {
      next(new Error('unexpected boom'));
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('unexpected boom');
  });

  it('handles non-Error unknown value with 500', async () => {
    const app = makeApp((_req, _res, next) => {
      next('a raw string error');
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });
});
