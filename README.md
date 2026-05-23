# Task Management API with Real-time Updates

A production-ready MERN stack task management application featuring JWT authentication, WebSocket-powered real-time collaboration, and a polished React UI.

**Frontend:** https://task-management-assignment-six.vercel.app/dashboard

**API Docs:** https://task-management-assignment-dtoj.onrender.com/api-docs/

http://localhost:3001/api-docs (Swagger UI, local)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [WebSocket Protocol](#websocket-protocol)
- [Architecture Decisions & Trade-offs](#architecture-decisions--trade-offs)
- [Assumptions](#assumptions)
- [Time Tracking](#time-tracking)

---

## Quick Start

### Docker (recommended)

```bash
git clone <repo-url>
cd trubot-assignment
cp .env.example .env        # uses sensible defaults for local Docker
docker-compose up --build
```

| Service  | URL                            |
|----------|--------------------------------|
| Frontend | http://localhost               |
| Backend  | http://localhost:3001          |
| Swagger  | http://localhost:3001/api-docs |

### Local Dev

**Prerequisites:** Node.js 18+, MongoDB running locally

```bash
# Terminal 1 — Backend
cd backend
cp ../.env.example .env
# Edit .env: set MONGODB_URI=mongodb://localhost:27017/taskmanager
npm install
npm run dev         # http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev         # http://localhost:5173
```

### Seed test data

```bash
cd backend && npm run seed
```

**Test accounts:**

| Email            | Password    |
|------------------|-------------|
| dev@example.com  | password123 |
| dev2@example.com | password123 |

### Hello World curl

```bash
# Register
curl -c cookies.txt -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'

# Create a task
curl -b cookies.txt -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","status":"pending"}'

# List tasks
curl -b cookies.txt http://localhost:3001/tasks
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  React 18 + Vite (TypeScript)                       │
│  Tailwind CSS + GSAP animations                     │
│  Axios (REST) │ Socket.io-client (WebSocket)        │
└───────────────┬────────────────────┬────────────────┘
                │ HTTP/REST          │ WebSocket
                ▼                   ▼
┌─────────────────────────────────────────────────────┐
│  Express 4 + Socket.io                              │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ JWT Auth     │  │ Real-time Engine           │  │
│  │ middleware   │  │ userSocketMap: Map<userId, │  │
│  │ (httpOnly    │  │   Set<socketId>>           │  │
│  │  cookies)    │  │ task rooms per taskId      │  │
│  └──────────────┘  └────────────────────────────┘  │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ JTI Blocklist│  │ Optimistic Lock            │  │
│  │ (in-memory)  │  │ (version field, 409s)      │  │
│  └──────────────┘  └────────────────────────────┘  │
│  Zod validation, rate limiting, swagger-jsdoc       │
└───────────────────────────────┬─────────────────────┘
                                │ Mongoose ODM
                                ▼
┌─────────────────────────────────────────────────────┐
│  MongoDB 7                                          │
│  users: { email, passwordHash, refreshTokens[] }    │
│  tasks: { title, status, assignee_id, version,      │
│           deadline, creator_id, timestamps }        │
│  Indexes: creator+status, assignee+status,          │
│           cursor pagination (createdAt+_id)         │
└─────────────────────────────────────────────────────┘
```

### Directory Structure

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers (auth, tasks, users)
│   │   ├── middleware/     # auth, errorHandler, rateLimiter
│   │   ├── models/         # Mongoose schemas (User, Task)
│   │   ├── routes/         # Express routers
│   │   ├── services/       # socketService, jtiBlocklist
│   │   ├── validation/     # Zod schemas
│   │   └── __tests__/      # Jest + supertest integration tests
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client + typed API functions
│   │   ├── components/     # Layout, Tasks (Card/Modal/Filters), UI
│   │   ├── context/        # AuthContext (React context + hooks)
│   │   ├── hooks/          # useTasks, useWebSocket, useScrollFadeIn
│   │   └── pages/          # Login, Register, Dashboard
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## API Reference

| Method | Endpoint           | Auth | Description                                  |
|--------|--------------------|------|----------------------------------------------|
| POST   | /auth/register     | —    | Register, returns user + sets cookies        |
| POST   | /auth/login        | —    | Login, sets httpOnly access + refresh cookies|
| POST   | /auth/logout       | ✓    | Invalidates access token (JTI blocklist)     |
| POST   | /auth/refresh      | —    | Rotate refresh token, issue new access token |
| GET    | /auth/me           | ✓    | Current authenticated user                   |
| GET    | /tasks             | ✓    | Paginated task list (creator OR assignee)    |
| POST   | /tasks             | ✓    | Create task                                  |
| GET    | /tasks/:id         | ✓    | Get single task (visibility enforced)        |
| PATCH  | /tasks/:id         | ✓    | Update task (requires `version` for OCC)     |
| DELETE | /tasks/:id         | ✓    | Delete task (creator only)                   |
| PATCH  | /tasks/:id/assign  | ✓    | Assign/unassign task; evicts prior assignee  |
| GET    | /users             | ✓    | List users (for assignee dropdown)           |

Full interactive docs: http://localhost:3001/api-docs

### Filter Parameters (GET /tasks)

| Param       | Type   | Description                        |
|-------------|--------|------------------------------------|
| status      | string | pending / in-progress / completed  |
| assignee_id | string | Filter by assignee ObjectId        |
| from        | ISO date | Tasks created after this date    |
| to          | ISO date | Tasks created before this date   |
| cursor      | string | Cursor for next page (opaque)      |
| limit       | number | Page size (default: 20, max: 100)  |

---

## WebSocket Protocol

Clients connect authenticated (cookie forwarded automatically). The server validates the JWT on every connection and reconnect.

| Event              | Direction | Payload                              |
|--------------------|-----------|--------------------------------------|
| task:join          | C → S     | `{ taskId }`                         |
| task:leave         | C → S     | `{ taskId }`                         |
| task:editing       | C → S     | `{ taskId }`                         |
| task:stop-editing  | C → S     | `{ taskId }`                         |
| task:created       | S → C     | `{ task: Task }`                     |
| task:updated       | S → C     | `{ task: Task }`                     |
| task:deleted       | S → C     | `{ taskId: string }`                 |
| task:editing       | S → C     | `{ taskId, userId, userEmail }`      |
| task:stop-editing  | S → C     | `{ taskId, userId }`                 |
| task:evicted       | S → C     | `{ taskId }` — you were unassigned  |

---

## Architecture Decisions & Trade-offs

### 1. JWT in httpOnly Cookies (not localStorage)

**Decision:** Store JWTs in httpOnly, SameSite=Lax cookies.

**Why:** localStorage tokens are readable by any JavaScript on the page, making them vulnerable to XSS. httpOnly cookies are never accessible to JS. The trade-off is CSRF exposure (mitigated by SameSite=Lax), and cookies require explicit credential forwarding in CORS setups — handled via `withCredentials: true` on the Axios client.

**Alternative considered:** localStorage with Authorization header. Simpler to implement, but a XSS attack anywhere on the page can steal the token.

---

### 2. In-Memory JTI Blocklist (not Redis)

**Decision:** Track invalidated JWT IDs in a Node.js `Set`.

**Why:** Stateless JWTs can't be truly invalidated without server-side state. An in-memory Set is zero-dependency, zero-latency, and sufficient for the scope of this project. The trade-off is that the blocklist is lost on server restart — logged-out tokens become valid again until they naturally expire (15 minutes). In production I would use Redis for persistence and multi-instance support.

---

### 3. Optimistic Concurrency Control (version field)

**Decision:** Every task carries a `version` integer. `PATCH /tasks/:id` requires the client to send the current version and returns 409 Conflict if it has changed.

**Why:** Two users editing the same task simultaneously would silently overwrite each other's work without concurrency control. OCC is chosen over pessimistic locking (row-level locks) because task edits are infrequent and short — the collision rate is low, and OCC has no deadlock risk and no lock overhead on reads. On 409, the frontend rolls back the optimistic update and shows a toast, prompting the user to refresh.

---

### 4. Cursor-Based Pagination (not offset)

**Decision:** `GET /tasks` returns a `nextCursor` (base64-encoded composite of `createdAt + _id`) rather than `?page=N&limit=M`.

**Why:** Offset pagination is unstable when items are inserted or deleted between pages — a new task at position 0 shifts every subsequent page. Cursor pagination is stable: new tasks may appear at the top, but the cursor always points to the same document. The compound `(createdAt, _id)` cursor handles ties in `createdAt` (same-second inserts) without duplication.

---

### 5. Socket.io Rooms per Task (not per-user broadcast)

**Decision:** Each task has a Socket.io room (`task:<taskId>`). "Editing" presence events are scoped to that room.

**Why:** Broadcasting to all connected users would send every editing event to every user, regardless of which task they're looking at. Room scoping means only users who have opened a task's edit modal receive presence events for that task. The trade-off is slightly more bookkeeping (join/leave events), but the signal-to-noise ratio is far better.

**Bonus:** When a user is unassigned from a task, the server emits `task:evicted` to their socket and forcibly removes them from the room — preventing a former assignee from receiving future updates on a task they can no longer see.

---

### 6. Separate `/assign` Endpoint (not in-body PATCH)

**Decision:** Assigning a task uses `PATCH /tasks/:id/assign` with `{ assignee_id }`, separate from the general PATCH which updates title/status/deadline.

**Why:** Assignment changes trigger side effects (room eviction of the old assignee, socket notifications, visibility enforcement). Bundling these into the general PATCH body made the controller logic hard to follow and created ambiguity about which fields trigger which side effects. Separate endpoints make intent explicit and side effects predictable.

---

### 7. GSAP + Tailwind (not CSS Transitions only)

**Decision:** GSAP ScrollTrigger handles the staggered card fade-in; Tailwind handles all static styling.

**Why:** Tailwind provides design-system consistency (color scale, spacing, typography) with zero runtime CSS-in-JS overhead. GSAP was added specifically for the scroll-triggered stagger animation, which is difficult to do correctly with CSS alone (timing, play-once semantics, `ScrollTrigger.refresh()` for accurate initial position). The `useScrollFadeIn` hook encapsulates all GSAP state and the `hasAnimated` ref guard prevents the animation from replaying on filter changes or WebSocket updates.

---

## Assumptions

1. **Single-server deployment** — the JTI blocklist and `userSocketMap` are in-process. A multi-instance deployment would require Redis for the blocklist and Redis Pub/Sub (or Socket.io-redis adapter) for the socket map.

2. **Trusted network for MongoDB** — MongoDB has no authentication configured in the Docker Compose setup. In production, set `MONGO_INITDB_ROOT_USERNAME/PASSWORD` and update the connection string.

3. **Task visibility = creator OR assignee** — a task is only visible to the user who created it or the user it's assigned to. There is no concept of "team" or "project" shared visibility.

4. **No email verification** — registration succeeds immediately without verifying the email address.

5. **Access token is short-lived (15 min), refresh is 7 days** — chosen as a reasonable security/UX balance. The refresh token is rotated on every use (rolling refresh).

6. **Frontend is a SPA served from Nginx** — the Nginx config redirects all paths to `index.html` for React Router to handle client-side. Deep linking works in Docker but requires the same Nginx config in production.

---

## Running Tests

```bash
cd backend
npm test                # all integration tests (jest + supertest + mongodb-memory-server)
npm run test:coverage   # with coverage report
```

The test suite uses `mongodb-memory-server` — no external MongoDB needed. Tests cover auth flows, task CRUD, visibility enforcement, optimistic locking, and pagination.

CI runs automatically on push via GitHub Actions (`.github/workflows/ci.yml`).

---

## Environment Variables

| Variable            | Required | Description                            |
|---------------------|----------|----------------------------------------|
| MONGODB_URI         | Yes      | MongoDB connection string              |
| JWT_SECRET          | Yes      | 32+ random chars, access token signing |
| JWT_REFRESH_SECRET  | Yes      | 32+ random chars, refresh token signing|
| JWT_ACCESS_EXPIRES  | No       | Default: 15m                           |
| JWT_REFRESH_EXPIRES | No       | Default: 7d                            |
| PORT                | No       | Default: 3001                          |
| FRONTEND_URL        | Yes      | Allowed CORS origin(s), comma-separated|
| NODE_ENV            | No       | Set to `production` for prod           |

---

## Time Tracking

| Section                                           | Time    |
|---------------------------------------------------|---------|
| Project setup, Docker, CI, Mongoose schemas       | ~1.5 h  |
| Auth system (JWT, cookies, refresh rotation, JTI) | ~2 h    |
| Task CRUD API + Zod validation + Swagger docs     | ~2 h    |
| WebSocket real-time (rooms, presence, eviction)   | ~2 h    |
| Security hardening (rate limit, OCC, visibility)  | ~1 h    |
| Frontend skeleton (routing, auth context, Axios)  | ~1.5 h  |
| Task UI (TaskCard, TaskModal, TaskFilters)        | ~2 h    |
| UI redesign (design system, GSAP animations)      | ~2 h    |
| QA + bug fixes (4 bugs found and fixed)           | ~1.5 h  |
| README + architecture documentation               | ~0.5 h  |
| **Total**                                         | **~16 h** |

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Backend    | Node.js 20, Express 4, TypeScript             |
| Database   | MongoDB 7, Mongoose 8                         |
| Auth       | JWT (jsonwebtoken), bcryptjs, cookie-parser   |
| Real-time  | Socket.io 4                                   |
| Validation | Zod                                           |
| API Docs   | swagger-jsdoc, swagger-ui-express             |
| Frontend   | React 18, Vite 5, TypeScript                  |
| Styling    | Tailwind CSS 3, GSAP 3 (ScrollTrigger)        |
| Routing    | React Router v6                               |
| HTTP       | Axios                                         |
| Testing    | Jest, ts-jest, supertest, mongodb-memory-server|
| DevOps     | Docker, Docker Compose, GitHub Actions        |
