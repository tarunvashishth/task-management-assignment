import 'dotenv/config';
import { connectDB, disconnectDB } from './config/db';
import { User } from './models/user.model';
import { Task } from './models/task.model';
import bcrypt from 'bcryptjs';

async function seed() {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Task.deleteMany({});

  const password = await bcrypt.hash('password123', 12);

  const [user1, user2] = await User.insertMany([
    { email: 'dev@example.com', password },
    { email: 'dev2@example.com', password },
  ]);

  await Task.insertMany([
    {
      title: 'Set up project scaffolding',
      description: 'Initialize the monorepo with backend and frontend packages',
      status: 'completed',
      creator_id: user1._id,
      assignee_id: user1._id,
      deadline: new Date(Date.now() - 86400000 * 2),
      version: 2,
    },
    {
      title: 'Implement JWT authentication',
      description: 'Add register, login, and logout endpoints with httpOnly cookies',
      status: 'in-progress',
      creator_id: user1._id,
      assignee_id: user2._id,
      deadline: new Date(Date.now() + 86400000 * 3),
      version: 1,
    },
    {
      title: 'Build task CRUD endpoints',
      description: 'Create, read, update, delete tasks with visibility rules',
      status: 'in-progress',
      creator_id: user1._id,
      version: 0,
    },
    {
      title: 'Add real-time WebSocket updates',
      description: 'Socket.io integration with room-based broadcasting',
      status: 'pending',
      creator_id: user2._id,
      assignee_id: user1._id,
      deadline: new Date(Date.now() + 86400000 * 7),
      version: 0,
    },
    {
      title: 'Write integration tests',
      description: 'Cover auth, task CRUD, socket, and middleware with >70% coverage',
      status: 'pending',
      creator_id: user2._id,
      version: 0,
    },
  ]);

  console.log('Seeded 2 users and 5 tasks');
  console.log('dev@example.com / password123');
  console.log('dev2@example.com / password123');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
