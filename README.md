# Task Management API with Real-time Updates

A production-ready MERN stack task management app with JWT authentication, WebSocket real-time collaboration, and comprehensive test coverage.

## Quick Start (Docker)

```bash
cp .env.example .env
docker-compose up
```

| Service  | URL                           |
|----------|-------------------------------|
| Frontend | http://localhost              |
| Backend  | http://localhost:3001         |
| Swagger  | http://localhost:3001/api-docs|

## Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- MongoDB running locally

### Backend

```bash
cd backend
cp ../.env.example .env
# Edit .env: set MONGODB_URI=mongodb://localhost:27017/taskmanager
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

### Seed test data

```bash
cd backend
npm run seed
```

## Test Accounts

| Email              | Password    |
|--------------------|-------------|
| dev@example.com    | password123 |
| dev2@example.com   | password123 |

## Hello World curl

```bash
# Register
curl -c cookies.txt -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'

# Create a task
curl -b cookies.txt -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task"}'

# Get your tasks
curl -b cookies.txt http://localhost:3001/tasks
```

## API Overview

| Method | Endpoint              | Description                             |
|--------|-----------------------|-----------------------------------------|
| POST   | /auth/register        | Register new user                       |
| POST   | /auth/login           | Login, sets httpOnly cookie             |
| POST   | /auth/logout          | Logout, invalidates token (JTI blocklist)|
| POST   | /auth/refresh         | Refresh access token                    |
| GET    | /auth/me              | Current user                            |
| GET    | /tasks                | Get visible tasks (paginated + filtered)|
| POST   | /tasks                | Create task                             |
| GET    | /tasks/:id            | Get task (visibility enforced)          |
| PATCH  | /tasks/:id            | Update task (requires `version` field)  |
| DELETE | /tasks/:id            | Delete task (creator only)              |
| PATCH  | /tasks/:id/assign     | Assign/unassign task                    |
| GET    | /users                | List users (for assignee dropdown)      |

Full docs: http://localhost:3001/api-docs

## Filter Parameters (GET /tasks)

| Param        | Description                      |
|--------------|----------------------------------|
| status       | pending / in-progress / completed|
| assignee_id  | Filter by assignee user ID       |
| from         | ISO date — tasks created after   |
| to           | ISO date — tasks created before  |
| cursor       | Cursor for next page             |
| limit        | Page size (default: 20, max: 100)|

## Architecture

```
Client (React + Vite + Tailwind)
  │ HTTP (REST)          │ WebSocket (Socket.io)
  ▼                      ▼
Express + Socket.io Server
  userSocketMap: Map<userId, Set<socketId>>
  JTI Blocklist (in-memory Set)
  │ Mongoose ODM
  ▼
MongoDB: users + tasks (version field, compound indexes)
```

## Security

- JWT in httpOnly cookies (not localStorage)
- JTI blocklist — logout actually invalidates tokens
- bcrypt hashing (12 rounds)
- Rate limiting on auth endpoints (10 req / 15 min)
- Task visibility enforced on every read (creator or assignee only)
- Optimistic locking on task updates (version field, 409 on conflict)
- Socket.io auth middleware on every connection including reconnects
- Room eviction when user is unassigned from a task

## WebSocket Events

| Event              | Direction | Payload                    |
|--------------------|-----------|----------------------------|
| task:join          | C → S     | { taskId }                 |
| task:leave         | C → S     | { taskId }                 |
| task:editing       | C → S     | { taskId }                 |
| task:stop-editing  | C → S     | { taskId }                 |
| task:created       | S → C     | { task }                   |
| task:updated       | S → C     | { task }                   |
| task:deleted       | S → C     | { taskId }                 |
| task:editing       | S → C     | { taskId, userId, userEmail}|
| task:stop-editing  | S → C     | { taskId, userId }         |
| task:evicted       | S → C     | { taskId }                 |

## Running Tests

```bash
cd backend
npm test
npm run test:coverage
```

## Tech Stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Backend  | Node.js 20, Express, TypeScript |
| Database | MongoDB 7, Mongoose             |
| Auth     | JWT, bcryptjs, cookie-parser    |
| Real-time| Socket.io                       |
| Validation| Zod                            |
| Docs     | swagger-jsdoc, swagger-ui-express|
| Frontend | React 18, Vite, TypeScript      |
| Styling  | Tailwind CSS                    |
| Routing  | React Router v6                 |
| HTTP     | Axios                           |
| Toasts   | react-hot-toast                 |
| Testing  | Jest, ts-jest, supertest, mongodb-memory-server|
| DevOps   | Docker, Docker Compose, GitHub Actions|
