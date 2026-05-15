import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | undefined;

beforeAll(async () => {
  const workerId = parseInt(process.env.JEST_WORKER_ID || '1', 10);
  const port = 40000 + (process.pid % 10000) + workerId;
  mongod = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
      port,
      portGeneration: false,
      args: ['--nounixsocket'],
    },
  });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_BCRYPT_ROUNDS = '1';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
