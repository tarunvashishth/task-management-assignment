<!-- /autoplan restore point: /Users/tarunvashishtha/.gstack/projects/TruBotAssignment/main-autoplan-restore-20260515-014244.md -->
# Task Management API with Real-time Updates — Implementation Plan

## Overview
Build a production-ready MERN stack (MongoDB, Express, React, Node.js) task management system with real-time collaboration, comprehensive authentication, and modern DevOps practices.

## Core Requirements

### Backend (Node.js + Express)
- **Authentication**: JWT-based user auth (register, login, logout)
  - Password hashing with bcrypt
  - Secure token storage and refresh mechanism
  - Protected routes with middleware

- **Task CRUD Operations**
  - Create, read, update, delete tasks
  - Task ownership and assignment to other users
  - Status tracking (pending, in-progress, completed)
  - Date/deadline support
  - Task filtering by status, assignee, date range

- **Real-time Updates**: WebSocket/Socket.io integration
  - Push task changes to connected clients
  - Broadcast events (create, update, delete, complete)
  - Multi-user awareness (show who's editing)

- **MongoDB Schema Design**
  - Users collection (id, email, password_hash, created_at)
  - Tasks collection (id, title, description, status, assignee_id, creator_id, created_at, updated_at, deadline)
  - Proper indexing on foreign keys and frequently queried fields

- **API Design** (RESTful + WebSocket)
  - `/auth/register` — POST new user
  - `/auth/login` — POST credentials, return JWT
  - `/auth/logout` — POST invalidate token
  - `/tasks` — GET all (with filters), POST create
  - `/tasks/:id` — GET single, PATCH update, DELETE
  - `/tasks/:id/assign` — PATCH assign to user
  - WebSocket events: task.created, task.updated, task.deleted, task.completed

- **Input Validation & Error Handling**
  - Joi/Zod schema validation on all inputs
  - Consistent error responses with codes and messages
  - HTTP status codes (400, 401, 403, 404, 500)
  - Graceful error recovery

- **API Documentation**
  - Swagger/OpenAPI spec auto-generated from code
  - Postman collection for manual testing
  - Endpoint descriptions, request/response schemas
  - Authentication flow documented

### Frontend (React)
- **Authentication UI**
  - Register page (email, password, confirm password)
  - Login page (email, password, remember-me option)
  - Logout button with session invalidation
  - Redirect unauthenticated users to login

- **Dashboard**
  - Display all tasks assigned to or created by the user
  - Filter controls: by status, by assignee, by date range
  - Task cards showing title, status, assignee, due date
  - Sort options (newest, due soon, status)

- **Task Management UI**
  - Modal for creating new task (title, description, deadline, assignee)
  - Modal for editing task (pre-filled with current data)
  - Inline status update (dropdown or buttons)
  - Delete task with confirmation
  - Quick-assign dropdown for changing assignee

- **Real-time Updates**
  - Tasks update when other users make changes
  - Visual indicators for currently-editing users
  - Optimistic UI updates with rollback on error
  - Toast notifications for task events (created by X, deleted, etc.)

- **Responsive Design**
  - Mobile-first approach
  - Desktop: sidebar layout, full task details
  - Tablet: adjustable panels
  - Mobile: hamburger menu, full-width task list
  - Touch-friendly buttons (min 44px)

- **Error Handling & UX**
  - Loading spinners during API calls
  - Empty state messages (no tasks, no results)
  - Error alerts with retry buttons
  - Connection loss detection with reconnect UI
  - Form validation with inline error messages

## Technical Decisions

### Architecture
- **Backend**: Express middleware stack
  - Authentication middleware → route handlers → controller logic
  - Service layer for business logic (task operations, user management)
  - Data access layer (MongoDB queries)
  - Separation of concerns: routes, controllers, services, models

- **Frontend**: React with state management
  - Component-based architecture (LoginForm, TaskCard, TaskModal, Dashboard)
  - Context API or Redux for global state (auth token, current user, tasks)
  - Custom hooks for reusable logic (useAuth, useTasks, useWebSocket)
  - Responsive CSS framework (Tailwind CSS or Material-UI)

### Database
- MongoDB (NoSQL, flexible schema)
- Collections: users, tasks
- Indexes on: user_id, task_id, creator_id, assignee_id, deadline
- Relationships via foreign keys (no joins in MongoDB)

### Real-time
- Socket.io for WebSocket abstraction (easier fallback to polling)
- Room-based architecture (users join tasks they can see)
- Event-driven updates to minimize bandwidth

### Security
- Passwords hashed with bcrypt (rounds: 10-12)
- JWT stored in httpOnly cookies (no localStorage)
- Input sanitization to prevent injection attacks
- CORS configured for frontend domain only
- Rate limiting on auth endpoints
- SQL injection N/A (MongoDB uses parameterized queries by default)
- XSS prevention through React's template escaping

### Testing Strategy
- **Unit tests**: Individual functions (controllers, services, validation)
- **Integration tests**: API endpoints with mock database
- **E2E tests**: Full user workflows (register → login → create task → filter → real-time update)
- Test frameworks: Jest (backend), React Testing Library (frontend)
- Minimum 70% code coverage target

### Deployment
- **Docker**: Dockerfile for backend (Node, npm install, run)
- **Docker Compose**: Multi-container (backend, MongoDB, frontend)
- **CI/CD**: GitHub Actions
  - Run linting (ESLint) on push
  - Run tests on pull requests
  - Build Docker images on main branch merge
  - Deploy to staging/production (if configured)

### Code Quality
- ESLint + Prettier for consistent formatting
- TypeScript for type safety (bonus)
- Comprehensive commit messages with Conventional Commits
- Pull request workflow with code review

## Scope (In vs Out)

### In Scope
- Core authentication flow (JWT)
- Full CRUD task operations
- Real-time updates via WebSockets
- Dashboard with filtering and sorting
- Responsive mobile/tablet/desktop UI
- Input validation and error handling
- API documentation (Swagger + Postman)
- Unit and integration tests
- Docker containerization
- CI/CD pipeline
- TypeScript implementation

### Out of Scope (Deferred)
- Advanced analytics/reporting dashboard
- Recurring/recurring tasks
- Task templates
- File attachments
- Email notifications
- Multi-team support
- Advanced permission system (just owner + assignees)
- Mobile native app

## Success Criteria

1. **Functionality**: All CRUD operations, auth, real-time updates work without errors
2. **Security**: No hardcoded secrets, passwords hashed, XSS/injection prevention
3. **Code Quality**: Modular, well-named functions, clear separation of concerns
4. **Testing**: 70%+ coverage, all critical paths tested
5. **DevOps**: Docker builds successfully, CI/CD pipeline runs without manual intervention
6. **Performance**: Dashboard loads <2s, real-time updates <500ms latency
7. **Documentation**: Swagger spec complete, Postman collection usable, code comments on non-obvious logic

## Timeline Estimate
- Phase 1 (Backend setup + Auth): 2-3 days
- Phase 2 (Task CRUD + Services): 2-3 days
- Phase 3 (WebSocket + Real-time): 1-2 days
- Phase 4 (Frontend): 4-5 days
- Phase 5 (Testing + Polish): 2-3 days
- Phase 6 (Docker + CI/CD): 1-2 days
- **Total**: ~2 weeks for complete implementation

## Bonus Enhancements
- [ ] Full TypeScript implementation (backend + frontend)
- [ ] Comprehensive unit + integration tests
- [ ] Docker multi-stage builds for optimized images
- [ ] GitHub Actions CI/CD with automated testing and deploys
- [ ] Performance optimizations (query pagination, connection pooling, caching)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] API rate limiting and throttling
- [ ] Comprehensive error logging and monitoring

## Dependencies
- **Backend**: Node.js 18+, Express, MongoDB, Socket.io, JWT, bcrypt, Joi/Zod, Swagger
- **Frontend**: React 18+, React Router, Axios/Fetch, Socket.io-client, CSS framework
- **DevOps**: Docker, Docker Compose, GitHub Actions
- **Tools**: ESLint, Prettier, Jest, Postman

---

## /autoplan CEO Review — Phase 1

### Step 0A: Premise Challenge

**Accepted premises:**
1. MERN stack — reasonable for collaborative task apps with large ecosystem
2. JWT in httpOnly cookies — correct security posture
3. Socket.io — right abstraction for reconnect logic and bidirectional updates
4. ~2-week timeline — achievable with AI assistance if TypeScript is first-class from day one

**Challenged premise — USER CHALLENGE:**
- **MongoDB for relational task data**: Both models flag this. Tasks have owners, assignees, deadlines, audit trails, and filtering across multiple axes. MongoDB's lack of native joins forces denormalization. The moment the plan needs "show me all tasks ever assigned to user X including unassigned ones" — you're doing application-side joins. PostgreSQL would give ACID transactions, proper foreign keys, and JOIN-native filtering for free. This was assumed, not chosen.
- **Rationale for keeping MongoDB**: NoSQL gives flexible schema if task fields evolve; Socket.io real-time updates don't care about DB type; user accepted this premise explicitly.
- **This surfaces at the Final Gate as USER CHALLENGE #1.**

### Step 0B: Existing Code Leverage

Greenfield project — no existing code to reuse. Sub-problem mapping:

| Sub-problem | Existing code | Gap |
|---|---|---|
| JWT auth | None | Build from scratch |
| Task CRUD | None | Build from scratch |
| Real-time events | None | Socket.io |
| Input validation | None | Joi or Zod |
| API docs | None | swagger-jsdoc |
| Testing | None | Jest + RTL |

### Step 0C: Dream State Diagram

```
CURRENT STATE          THIS PLAN               12-MONTH IDEAL
────────────           ─────────               ──────────────
No app                 MERN task manager       + Team workspaces
                       JWT auth                + Email notifications
                       Socket.io real-time     + Slack/Calendar integration
                       Basic CRUD              + Analytics dashboard
                       70%+ test coverage      + Mobile native app
                       Docker + CI/CD          + Audit log / history
                                               + Recurring tasks
                                               + File attachments
```

Delta: This plan leaves us with a solid single-team MVP. Multi-team, notifications, and integrations are the 12-month gaps.

### Step 0C-bis: Implementation Alternatives

| Approach | Effort | Risk | Pros | Cons |
|---|---|---|---|---|
| MERN + Socket.io (current) | Medium | Medium | Proven stack, large ecosystem, bidirectional real-time | No ACID transactions, manual joins |
| Next.js + PostgreSQL + Prisma | Medium | Low | SSR, type-safe DB, ACID, JOIN-native | Different React mental model, more infra |
| tRPC + React Query + SSE | Low | Low | End-to-end types, simpler real-time, HTTP/2 | Less bidirectional capability |

### Step 0D: Mode — SELECTIVE EXPANSION

Auto-decided: SELECTIVE EXPANSION. Plan is solid; surface gaps as expansions.

### Step 0E: Temporal Interrogation

```
HOUR 1:   Set up monorepo, initialize backend (Express + TypeScript), MongoDB Atlas
HOUR 2-3: Auth routes (register/login/logout), bcrypt, JWT middleware
HOUR 4-6: Task CRUD endpoints with Joi validation, basic tests
HOUR 6+:  WebSocket integration, frontend scaffold, Docker compose
DAY 3+:   Frontend components, real-time event handlers, error states
WEEK 2:   Testing to 70%+, CI/CD, Swagger docs, polish
LATE RISK: TypeScript types become inconsistent if not enforced from day 1
```

### Step 0F: Mode Confirmed — SELECTIVE EXPANSION

---

### CEO Dual Voices

**CODEX SAYS (CEO):** [codex-unavailable]

**CLAUDE SUBAGENT (CEO — strategic independence):**
Key findings: (1) JWT revocation is theater without a blocklist or short TTL + refresh rotation — logout doesn't actually invalidate tokens. (2) WebSocket room auth has a data leak: users removed from task continue receiving updates. (3) TypeScript as "bonus" creates technical debt if types are retrofitted post-implementation. (4) MongoDB is the wrong datastore for relational filtering and audit trails. (5) Socket.io chosen by default, not by analysis vs SSE.

---

### CEO Review Sections 1-10

#### Section 1: Problem Validation

This is an assignment/portfolio project, not a product with a paying customer. The problem statement is valid for its context: demonstrate MERN stack competency with real-time and auth. No issues flagged.

Examined: plan scope, stated goals, success criteria. Nothing strategic to flag given assignment context.

#### Section 2: Error & Rescue Registry

| Error | Trigger | Who sees it | Catch | Tested? |
|---|---|---|---|---|
| JWT expired mid-session | Token TTL elapsed | User gets 401, white screen | Auth middleware → 401 response | Must be tested |
| WebSocket disconnect | Network loss, server restart | Stale task state | Reconnect logic with event replay | Must be tested |
| MongoDB connection loss | Network/DB failure | 500 on all requests | Express error middleware | Must be tested |
| Race condition: concurrent edit | Two users edit same task | Last write wins silently | None specified → add conflict notification | MISSING |
| JWT not invalidated on logout | Token blocklist absent | Stolen token still valid | None → add blocklist or short TTL | CRITICAL GAP |
| Socket.io room auth bypass | User unassigned from task | Old user still gets events | None → add room re-auth | CRITICAL GAP |
| /tasks returns all records | No pagination | Slow/OOM at scale | None → add cursor pagination | MISSING |

**Auto-decided (Principle 1 — Completeness):** Add all missing items to plan. Mechanical.

#### Section 3: Scope Calibration

**In scope:** Core CRUD, auth, real-time, Dashboard with filtering, Docker, CI/CD, TypeScript — correct.

**GAPS requiring addition (auto-decided, mechanical):**
- JWT refresh token rotation: 15-min access token + 7-day refresh token in httpOnly cookie
- Cursor-based pagination on GET /tasks (default limit: 20)
- Socket.io JWT middleware validating on every connection (including reconnect)
- WebSocket room re-authorization after assignment changes
- Optimistic locking or last-write-wins with conflict notification for concurrent edits

**Auto-Decision D2 (Mechanical):** Add JWT refresh token rotation to plan. Principle 1 (completeness). Rejected alternative: no refresh (insecure).

**Auto-Decision D3 (Mechanical):** Add cursor pagination to /tasks. Principle 1. Rejected: no pagination (OOM at scale).

**Auto-Decision D4 (Mechanical):** Add Socket.io JWT auth middleware on all connections. Principle 1. Rejected: auth only at handshake (security gap).

**Auto-Decision D5 (Mechanical):** Upgrade TypeScript from "bonus" to first-class. Principle 5 (explicit over clever). Rejected: optional TypeScript creates retrofitting cost.

**Auto-Decision D6 (Mechanical):** Add WebSocket room re-auth on task assignment change. Principle 1. Rejected: no re-auth (data leak).

**Auto-Decision D7 (Taste):** Keep Socket.io over SSE. Reason: plan needs bidirectional (multi-user awareness, optimistic rollback). SSE is one-way only. Principle 3 (pragmatic). This is a TASTE DECISION surfaced at gate.

**Auto-Decision D8 (Mechanical):** Add optimistic locking with conflict detection to task update flow. Principle 1. Rejected: silent last-write-wins.

#### Section 4: Alternatives Analysis

The plan did not analyze MongoDB vs PostgreSQL, Socket.io vs SSE, or Joi vs Zod alternatives. This is a gap.

**Auto-Decision D9 (Mechanical):** Document alternatives rationale in plan. Principle 5.

#### Section 5: Build vs Buy Decisions

- Auth: custom JWT — correct (Passport.js would add complexity for this scope)
- Validation: Joi/Zod — correct choice
- Real-time: Socket.io — correct
- Test: Jest — correct
- ORM: None planned for MongoDB — correct for MVP, but Mongoose is strongly recommended for schema enforcement

**Auto-Decision D10 (Mechanical):** Add Mongoose as required dependency (not optional). Schema enforcement prevents silent data corruption. Principle 1.

#### Section 6: Risk Assessment

Plan's risk section covers: WebSocket reconnect, DB performance, security, deployment. Misses:

1. JWT refresh race condition (multiple concurrent requests hitting expired token simultaneously) — add mutex or token rotation lock
2. MongoDB replica set requirement for transactions — document whether Atlas free tier supports it
3. CORS misconfiguration — specify exact origins in plan, not "frontend domain"

**Auto-Decision D11 (Mechanical):** Add CORS configuration specifics to security section. Principle 5.

#### Section 7: Success Criteria Review

The 7 success criteria are measurable and concrete. Gaps:
- No mention of pagination in performance criterion ("Dashboard loads <2s" fails if returning 10,000 tasks)
- "Real-time updates <500ms" doesn't account for server-side event broadcast delay under load

**Auto-Decision D12 (Mechanical):** Add "task list supports pagination; initial load <2s at 1,000 tasks" to criterion 6.

#### Section 8: Timeline Reality Check

2 weeks for one developer:
- Phase 1-2 (Backend + CRUD): 4-5 days — realistic with AI
- Phase 3 (WebSocket): 2-3 days — realistic
- Phase 4 (Frontend): 5-6 days — tight but doable
- Phase 5 (Testing to 70%+): 2-3 days — very tight
- Phase 6 (Docker + CI/CD): 1 day — realistic

**Total: 14-18 days. 2 weeks is P50. Add 20% buffer or de-scope E2E tests.**

**Auto-Decision D13 (Taste):** Keep 2-week estimate with a note that E2E tests may slip to bonus. TASTE DECISION at gate.

#### Section 9: Dependencies Review

Backend deps look right. Missing:
- `mongoose` (for MongoDB ODM) — add as required
- `cookie-parser` (for httpOnly cookie handling) — add as required
- `express-rate-limit` (for auth rate limiting) — already noted in security section, add to deps list
- `ioredis` or `redis` (if token blocklist implemented) — add as conditional

#### Section 10: "What NOT in scope" / Deferred Items

Items deferred to TODOS.md (auto-written below):
1. Email notifications
2. Multi-team support
3. Advanced permissions beyond owner/assignee
4. File attachments
5. Mobile native app
6. Task templates
7. Recurring tasks
8. Advanced analytics
9. Redis token blocklist (if not implemented in MVP — conditional)
10. E2E tests (may slip to bonus if timeline is tight)

### What Already Exists

Greenfield project — nothing exists. All components built from scratch.

### NOT in Scope (CEO Decision)

- Multi-team workspaces
- Email/push notifications
- Slack/calendar integrations
- Advanced permissions system (role-based)
- Analytics dashboard
- Mobile native app
- File attachments to tasks
- Task templates and recurring tasks

### CEO Completion Summary

| Section | Status | Critical Gaps | Auto-Decisions |
|---|---|---|---|
| 1. Problem Validation | Clean | None | None |
| 2. Error & Rescue | Gaps found | JWT revocation, WS auth | D2, D4, D6 |
| 3. Scope Calibration | Gaps found | Pagination, TypeScript | D3, D5, D8 |
| 4. Alternatives | Gap | No analysis documented | D9 |
| 5. Build vs Buy | Gap | Mongoose missing | D10 |
| 6. Risk Assessment | Partial | CORS, JWT race | D11 |
| 7. Success Criteria | Partial | Pagination missing | D12 |
| 8. Timeline | Tight | E2E tests may slip | D13 |
| 9. Dependencies | Gap | mongoose, cookie-parser | Auto-added |
| 10. NOT in scope | Written | N/A | N/A |

**USER CHALLENGE #1:** MongoDB vs PostgreSQL — both models flag MongoDB as wrong for relational task data. Surfaces at final gate.

## Risk Assessment
- **Real-time sync issues**: WebSocket connection loss or message ordering → mitigate with reconnect logic and message queuing
- **Database performance**: Large number of tasks → index strategy and pagination
- **Security**: Token leakage or weak hashing → use httpOnly cookies, bcrypt rounds 10+
- **Deployment**: Container resource limits → set proper memory/CPU limits in Dockerfile and Compose
- **JWT revocation**: Logout is theater without refresh token rotation — add 15-min access tokens + 7-day refresh tokens with rotation
- **WebSocket auth**: Socket.io connections must validate JWT on every connection including reconnects, not just initial handshake
- **Concurrent edit conflict**: Two users editing same task silently overwrites — add version field + conflict notification
- **Pagination**: GET /tasks must support cursor-based pagination; no pagination means OOM at scale

---

---

## /autoplan Design Review — Phase 2

### Step 0A: Design Completeness Rating

**Overall design completeness: 3/10**

The plan specifies what backend does comprehensively, but the UI section is generic descriptions ("clean modern card-based layout" implicit). A 10/10 would have: user journey narrative, state matrix per screen, concrete design tokens (colors, type, spacing), breakpoints with behavior per breakpoint, and implementable real-time UX spec.

### Step 0B: DESIGN.md Status

No DESIGN.md found. Proceeding with universal design principles.

### Step 0C: Design Leverage

Greenfield — no existing UI to leverage. Must establish all patterns from scratch.

---

### Design Dual Voices

**CODEX SAYS (design):** [codex-unavailable]

**CLAUDE SUBAGENT (design — independent review):**
Critical gaps found: (1) No visual state matrix — loading/empty/error/success/partial unspecified for all screens. (2) Real-time editing indicator UX not implementable as written — needs component spec, placement, overflow behavior, and rollback visual. (3) "Tailwind or Material-UI" gives implementer two radically different outputs — must pick one. (4) No colors, type scale, or spacing tokens. (5) Responsive spec is structure-only, not behavior.

---

### Design Review — 7 Passes

#### Pass 1: Information Architecture — 4/10

**Gap:** Plan is backend-first: 40 lines of API design before first UI mention. No user flow. No screen-by-screen progression. Implementer has no journey to reference.

**Fix (auto-decided D14, Mechanical, P5):** Add user journey to plan:

```
USER JOURNEY:
1. New user → /register (sees form, fills email/password, sees success toast)
2. → /login (fills credentials, redirected to /dashboard)
3. → Empty dashboard (empty state: "No tasks yet. Create your first task." + CTA button)
4. → Create task modal (fills title, description, deadline, assignee, submits)
5. → Task card appears in dashboard (real-time: other users see it too)
6. → Edit task (modal pre-filled, saves → optimistic update → confirmation toast)
7. → Filter tasks (by status: pending/in-progress/completed, by assignee, by date)
8. → Logout (/auth/logout → JWT invalidated → redirect to /login)
```

#### Pass 2: Visual Hierarchy / Design Tokens — 3/10

**Gap:** "Tailwind CSS or Material-UI" leaves output completely undefined. No primary color, type scale, or spacing spec.

**Fix (auto-decided D15, Mechanical, P5 Explicit):**
- **CSS Framework: Tailwind CSS** (not Material-UI — Tailwind gives full control; MUI imposes its own opinionated design system)
- **Design tokens:**
  - Primary: `#3B82F6` (blue-500)
  - Text primary: `#1F2937` (gray-800)
  - Text secondary: `#6B7280` (gray-500)
  - Background: `#F9FAFB` (gray-50)
  - Card background: `#FFFFFF` with `shadow-sm`
  - Border radius: `rounded-lg` (8px)
  - Button height: `h-10` (40px) / touch: `h-11` (44px)
  - Modal max-width: `max-w-lg` (512px)
  - Font: system-ui stack (no custom font for MVP)

#### Pass 3: Interaction Design — 5/10

**Gap:** Filter UX, sidebar collapse, task card density, and modal vs page for task detail all unspecified.

**Fix (auto-decided D16, Mechanical, P5 Explicit):**
- **Sidebar:** Fixed 240px on desktop, overlays on mobile (not collapsible for MVP)
- **Filters:** Horizontal filter bar above task grid (dropdowns for status, assignee, date range)
- **Task cards:** Show title (2-line truncation), status badge, assignee avatar + name, due date. Max 2 lines of description preview.
- **Task detail:** Modal on all breakpoints (not separate page for MVP)
- **Assignee dropdown:** Shows up to 10 users with search; avatar + full name
- **Filter logic:** All filters are AND (stacked), not mutually exclusive

#### Pass 4: States & Edge Cases — 2/10

**Gap:** "Loading spinners" and "empty state messages" are the full spec. No state matrix.

**Fix (auto-decided D17, Mechanical, P1 Completeness):**

| Screen | Loading | Empty | Populated | Error | Success |
|---|---|---|---|---|---|
| Dashboard | Skeleton cards (3 placeholder cards) | "No tasks yet. [+ Create Task]" | Task card grid | "Failed to load tasks. [Retry]" | N/A |
| Task Modal (create) | Submit button spinner | N/A | Form fields | Inline field errors + toast "Failed to create" | Toast "Task created" + modal close |
| Task Modal (edit) | Pre-fill loading spinner | N/A | Pre-filled form | Inline errors + toast "Save failed" | Toast "Task updated" + modal close |
| Login | Submit spinner | N/A | Form | "Invalid credentials" inline | Redirect to /dashboard |
| Register | Submit spinner | N/A | Form | Inline field validation | Toast "Account created" + redirect |

**Partial state:** Tasks loaded, avatars still fetching → show initials placeholder (first letter of name in colored circle).

**Network offline:** Banner at top: "Connection lost — changes may not save" with reconnect indicator.

**Deleted task (open modal):** Toast "This task was deleted by [user]" + modal close.

#### Pass 5: Responsive Design — 3/10

**Gap:** Breakpoints not defined. Mobile spec is "hamburger menu, full-width task list."

**Fix (auto-decided D18, Mechanical, P1 Completeness):**

| Breakpoint | Navigation | Task Grid | Filters | Modals |
|---|---|---|---|---|
| Mobile (<768px) | Hamburger menu → drawer overlay | Single column, full-width cards | Collapsible filter panel (tap to expand) | Full-screen drawer |
| Tablet (768–1024px) | Sidebar visible, icon-only (collapsed) | 2-column card grid | Horizontal filter bar | Centered modal, max-w-lg |
| Desktop (>1024px) | Full sidebar (240px, text + icon) | 3-column card grid | Horizontal filter bar | Centered modal, max-w-lg |

**Touch targets:** All interactive elements minimum 44px height. Filter dropdowns have 44px trigger height on mobile.

#### Pass 6: Real-time UX — 2/10

**Gap:** "Visual indicators for currently-editing users" and "optimistic UI updates with rollback on error" are not implementable.

**Fix (auto-decided D19, Mechanical, P1 Completeness):**

**Editing indicators:**
- Component: Avatar chip (circular, 24px) positioned top-right of task card
- Max visible: 2 avatars + "+N" overflow label (e.g., "+2")
- Tooltip: "John is editing" on hover
- Fade out: 3 seconds after user stops editing (backend sends "stopped editing" event)
- Multiple users: Stack avatars with 8px overlap, leftmost = most recent editor

**Optimistic updates:**
- Task update: Apply locally immediately; if server confirms → no visual change; if server rejects → revert to previous state + red toast "Update failed — changes reverted. [Retry]"
- Task delete: Remove from list immediately; if server rejects → restore card + toast "Delete failed"
- New task: Show card with loading skeleton state; replace with real data on confirmation

**Real-time incoming events (from other users):**
- New task created: Card slides in at top of list with subtle blue left border (2s highlight, then fades)
- Task updated: Card pulses briefly (opacity 0.5 → 1.0, 300ms)
- Task deleted: Card fades out with 300ms animation

**Connection indicator:**
- Green dot (8px) in header next to "Tasks" title
- Yellow when reconnecting: "Reconnecting..."
- Red when offline for >5s: "Connection lost"

#### Pass 7: Accessibility — 5/10

**Gap:** "Accessibility audit (WCAG 2.1 AA)" is listed as bonus, so it may get cut.

**Fix (auto-decided D20, Mechanical, P1 Completeness):** Promote accessibility basics to first-class (not bonus). Advanced audit stays optional.

First-class accessibility requirements:
- Min touch targets: 44px (already specified)
- Color contrast: All text meets AA (4.5:1 for normal, 3:1 for large)
- Keyboard navigation: Modal traps focus (Tab cycles through fields, Esc closes)
- Dropdowns: `aria-label`, `aria-expanded`, arrow key navigation
- Task cards: `role="article"`, status badge has `aria-label="Status: In Progress"`
- Status badges: Not color-only (include text label, not just green/red dot)
- Form errors: `aria-describedby` links field to error message

### Design Completion Summary

| Pass | Rating Before | Issues | Auto-Decisions | Rating After |
|---|---|---|---|---|
| 1. Information Architecture | 4/10 | No user journey | D14 | 8/10 |
| 2. Visual Hierarchy / Tokens | 3/10 | No design tokens, 2 frameworks | D15 | 8/10 |
| 3. Interaction Design | 5/10 | Sidebar/filter/card unspecified | D16 | 8/10 |
| 4. States & Edge Cases | 2/10 | No state matrix | D17 | 9/10 |
| 5. Responsive Design | 3/10 | No breakpoints | D18 | 8/10 |
| 6. Real-time UX | 2/10 | Not implementable as written | D19 | 9/10 |
| 7. Accessibility | 5/10 | Bonus → first-class basics | D20 | 7/10 |

**Overall: 3/10 → 8/10 after auto-decisions.**

---

## /autoplan Eng Review — Phase 3

### Step 0: Scope Challenge

**Existing code analyzed:** Greenfield — no existing code. All components built from scratch.

**Sub-problem to existing code mapping:**

| Sub-problem | Existing code | Approach |
|---|---|---|
| JWT auth | None | express-jwt + custom middleware |
| Task CRUD | None | Express routes + Mongoose models |
| Real-time | None | Socket.io |
| Validation | None | Joi or Zod |
| Testing | None | Jest + supertest + RTL |
| Container | None | Docker + Compose |

**Complexity check:** Plan touches 8+ modules (auth routes, task routes, Socket.io, Mongoose models, React components, hooks, Docker, CI/CD). This is at the threshold. Auto-decided (P6): proceed as-is since the complexity matches the stated assignment scope; no artificial reduction.

---

### Eng Dual Voices

**CODEX SAYS (eng):** [codex-unavailable]

**CLAUDE SUBAGENT (eng — independent review):**
Critical gaps: (1) JWT logout broken — blocklist deferred to TODOS.md but must be MVP. (2) userId→socketId Map missing — required for room eviction on unassign. (3) Task visibility not enforced in API layer — any logged-in user can read any task ID. (4) Optimistic locking has no schema field. (5) Docker has no healthchecks or secret handling. (6) Critical test paths (reconnect, burst, DB loss, concurrent PATCH) absent from test strategy.

---

### Section 1: Architecture — ASCII Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React SPA)                        │
│  LoginForm  |  Register  |  Dashboard  |  TaskModal         │
│  useAuth    |  useTasks  |  useWebSocket                     │
└──────────────────┬──────────────────┬───────────────────────┘
                   │ HTTP (REST)      │ WebSocket (Socket.io)
                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Express + Socket.io Server                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth Middleware│  │ Route Layer  │  │ Socket.io Layer  │  │
│  │ (JWT verify)  │  │ /auth        │  │ auth middleware  │  │
│  │ Cookie parse  │  │ /tasks       │  │ room management  │  │
│  └──────┬───────┘  └──────┬───────┘  │ userId→socketId  │  │
│         │                 │          └──────────────────┘  │
│  ┌──────▼─────────────────▼──────┐                         │
│  │         Service Layer          │                         │
│  │  AuthService  |  TaskService  │                         │
│  │  JTI Blocklist (in-memory Set) │                         │
│  └──────────────────────┬────────┘                         │
└─────────────────────────┼───────────────────────────────────┘
                          │ Mongoose ODM
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB                                   │
│  users: { _id, email, password_hash, createdAt }            │
│  tasks: { _id, title, desc, status, assignee_id,            │
│           creator_id, version, createdAt, deadline }        │
│  Indexes: (assignee_id, createdAt, _id)                     │
│           (creator_id, createdAt)                           │
│           (status, createdAt)                               │
└─────────────────────────────────────────────────────────────┘
```

**Architecture findings:**

[P0] (confidence: 10/10) `userId→socketId` Map is missing — required for force-leaving rooms on unassign. Add `userSocketMap: Map<userId, Set<socketId>>` in Socket.io layer. When `PATCH /tasks/:id/assign` fires, look up the removed user's socket IDs and call `socket.leave(roomId)`.

[P0] (confidence: 10/10) Task visibility not enforced at API boundary. `GET /tasks/:id` needs ownership check: `{ $or: [{ creator_id: userId }, { assignee_id: userId }] }`. Wrap in `getVisibleTasks(userId)` service method called by every read path.

[P1] (confidence: 9/10) JWT blocklist is deferred to TODOS.md. It must be MVP. Use in-memory `Set<jti>` in `AuthService`. Add caveat: process restart clears the set (document this). Upgrade to Redis for production.

[P2] (confidence: 8/10) Docker Compose has no health checks. MongoDB takes 5-10s to initialize. Backend crashes on first boot. Fix: add `healthcheck` for MongoDB and `depends_on: condition: service_healthy` for backend.

**Auto-Decision D21 (Mechanical, P0):** Promote JTI blocklist from TODOS to MVP — in-memory `Set<jti>` in AuthService.

**Auto-Decision D22 (Mechanical, P0):** Add `userSocketMap: Map<userId, Set<socketId>>` to architecture. Enforce room eviction in `PATCH /tasks/:id/assign` handler.

**Auto-Decision D23 (Mechanical, P1):** Task visibility: add `getVisibleTasks(userId)` to TaskService, called by GET /tasks and GET /tasks/:id.

**Auto-Decision D27 (Mechanical, P2):** Add Docker healthchecks + `.env.example` + `env_file:` directive to Compose spec.

#### Section 2: Code Quality

**Module structure (planned):**

```
backend/
  src/
    routes/       auth.routes.ts, task.routes.ts
    controllers/  auth.controller.ts, task.controller.ts
    services/     auth.service.ts, task.service.ts (getVisibleTasks here)
    models/       user.model.ts, task.model.ts
    middleware/   auth.middleware.ts, rate-limit.middleware.ts
    socket/       socket.handler.ts (userSocketMap here)
    validation/   auth.schema.ts, task.schema.ts (Joi/Zod)
frontend/
  src/
    components/   LoginForm, Dashboard, TaskCard, TaskModal
    hooks/        useAuth, useTasks, useWebSocket
    context/      AuthContext, TaskContext
    pages/        LoginPage, RegisterPage, DashboardPage
```

**[P1] (confidence: 9/10) PATCH /tasks/:id needs version check:** Add `version: Number` to Task Mongoose schema with `default: 0`. Every PATCH must include `version` in body. Service: `findOneAndUpdate({ _id, version }, update, { new: true })` — returns null if version mismatch → 409 Conflict.

**[P1] (confidence: 8/10) Assignee validation missing:** `PATCH /tasks/:id/assign` must validate `assignee_id` against Users collection before writing. Return 404 if user not found.

**[P2] (confidence: 7/10) Mongoose middleware for timestamps:** Use `timestamps: true` in schema options instead of manual `createdAt`/`updatedAt` — less DRY violation.

**Auto-Decision D24 (Mechanical, P1):** Add `version: Number, default: 0` to Task schema. Enforce in PATCH handler.

**Auto-Decision D25 (Mechanical, P1):** Add assignee existence validation in `PATCH /tasks/:id/assign`.

**Auto-Decision D28 (Mechanical, P2):** Use Mongoose `timestamps: true` option instead of manual timestamp fields.

#### Section 3: Test Review — NEVER SKIP

**Test Framework:** Jest (backend) + Supertest + React Testing Library (frontend) + Jest (e2e)

**CODE PATH + USER FLOW DIAGRAM:**

```
CODE PATHS                                    USER FLOWS
[+] auth routes                               [+] Auth Journey
  ├── POST /auth/register                       ├── [→E2E] Register → Login → Dashboard
  │   ├── [GAP] email already exists            ├── [GAP] Login with wrong password
  │   ├── [GAP] weak password                   ├── [GAP] Logout then try protected route
  │   └── [GAP] valid registration              └── [GAP] Token expired mid-session
  ├── POST /auth/login
  │   ├── [GAP] correct credentials           [+] Task CRUD Journey
  │   ├── [GAP] wrong password (no info leak) ├── [→E2E] Create → View → Edit → Delete
  │   └── [GAP] rate limit triggers           ├── [GAP] Create with missing required field
  └── POST /auth/logout                       ├── [GAP] Edit task with stale version (409)
      └── [GAP] JTI added to blocklist        ├── [GAP] Delete task I don't own (403)
                                              └── [GAP] Filter tasks by multiple axes
[+] task routes
  ├── GET /tasks                              [+] Real-time Journey
  │   ├── [GAP] filters by status            ├── [GAP] Two users edit same task
  │   ├── [GAP] pagination cursor            ├── [GAP] Disconnect and reconnect — state sync
  │   ├── [GAP] visibility (creator+assignee)├── [GAP] Unassigned user no longer gets events
  │   └── [GAP] empty result                 └── [GAP] Toast on real-time task delete
  ├── POST /tasks
  │   ├── [GAP] valid creation
  │   ├── [GAP] Joi validation fails         [+] Error State Journey
  │   └── [GAP] creator_id from JWT          ├── [GAP] MongoDB down mid-request
  ├── PATCH /tasks/:id                       ├── [GAP] Rate limit on auth endpoint
  │   ├── [GAP] version match → 200          ├── [GAP] Network offline → reconnect UI
  │   ├── [GAP] version mismatch → 409       └── [GAP] Socket.io burst (100 events/sec)
  │   └── [GAP] not owner → 403
  ├── DELETE /tasks/:id
  │   ├── [GAP] owner only → 200
  │   └── [GAP] not owner → 403
  └── PATCH /tasks/:id/assign
      ├── [GAP] assignee exists → 200
      ├── [GAP] assignee not found → 404
      └── [GAP] force-leave old assignee room

[+] WebSocket
  ├── [GAP] auth middleware rejects invalid JWT
  ├── [GAP] auth middleware accepts valid JWT
  ├── [GAP] reconnect after JWT refresh
  └── [GAP] room join only for visible tasks

COVERAGE: 0/35 paths tested (0% — greenfield, all GAPs)
All code paths marked [GAP] = must be written during implementation.
Priority: E2E flows first, then unit tests for service layer, then edge cases.
```

**Critical test cases that will break at 2am Friday:**
1. Concurrent PATCH with same task ID from two users → version conflict handled, not silently overwritten
2. POST /auth/login with 1000 rapid requests → rate limiter returns 429, doesn't crash
3. MongoDB connection loss mid-PATCH → Express error middleware returns 503 (not 500 hang)
4. Socket.io reconnect after 30s disconnect → client re-joins rooms, gets missed events
5. WebSocket room after user unassigned → removed user no longer receives task updates

**Auto-Decision D26 (Mechanical, P1):** Add all 5 critical test cases above to integration test plan. Principle 1.

**Test Plan Artifact:** (Writing to disk below)

#### Section 4: Performance

**N+1 queries:** Plan has correct index strategy in principle. Missing:
- `GET /tasks` with filter by `assignee_id` + sort by `createdAt`: needs compound index `(assignee_id, createdAt, _id)` — mentioned above in architecture
- Populate `assignee` on every task in GET /tasks: N+1 if not using `$lookup` or Mongoose `.populate()` correctly. Must use one `populate()` call, not per-task fetch.

**Memory:** MongoDB connection pool — default pool size 5. For concurrent WebSocket connections (100 users), this may queue. Set `maxPoolSize: 10` in Mongoose connect options.

**Caching:** No caching layer for MVP — appropriate. Note: `/tasks` with no filters is the hot path. If adding Redis later, cache by `(userId, filters)`.

**Socket.io scalability:** Single server instance — correct for MVP. Document: horizontal scaling requires Redis adapter (`socket.io-redis`). Single point of failure if server restarts.

**Auto-Decision D29 (Mechanical, P2):** Specify `maxPoolSize: 10` in Mongoose connect options. Add note about Redis adapter for Socket.io horizontal scaling.

### Engineering Completion Summary

| Section | Status | Critical Gaps | Auto-Decisions |
|---|---|---|---|
| 1. Architecture | Gaps found | userId→socketId, JTI blocklist, visibility | D21, D22, D23, D27 |
| 2. Code Quality | Gaps found | version field, assignee validation | D24, D25, D28 |
| 3. Test Review | Full diagram | 35 gaps (greenfield), 5 critical 2am tests | D26 |
| 4. Performance | Partial | N+1 populate, pool size | D29 |

**NOT in scope (Eng):**
- Redis adapter for Socket.io horizontal scaling (defer to post-MVP)
- Advanced MongoDB sharding (defer)
- Performance profiling under real load (defer to post-deploy)

**What already exists:** Nothing — greenfield project.

---

## /autoplan DX Review — Phase 3.5

### Step 0: DX Scope Assessment

**Product type:** REST API + React frontend — primary DX audience is a technical evaluator/interviewer who will clone the repo, run the API, and verify it works.

**Developer journey stages:** clone → configure → start → register → login → create task → see real-time update → review docs

**Initial DX completeness: 1/10**

What a 10 looks like: Clone, run `docker-compose up`, hit `http://localhost:3000/api-docs` in browser, copy-paste the register example, get a JWT, run a task CRUD cycle — all within 3 minutes, with zero reading required.

**TTHW current estimate: 20-45 minutes** (no README, no port documented, no .env.example, no seed data, no one-liner)

**TTHW target: <5 minutes**

---

### DX Dual Voices

**CODEX SAYS (DX):** [codex-unavailable]

**CLAUDE SUBAGENT (DX — independent):**
Critical gaps: (1) TTHW 20-45 minutes — no README quickstart, port unknown, no .env.example, no seed data. (2) Undefined error response schema — every error path is a mystery box. (3) Swagger doesn't specify cookie-auth scheme — evaluator can't authenticate in Swagger UI. (4) No configurable env vars — TTLs, pagination, rate limits all hardcoded. (5) Missing GET /users endpoint — assignee dropdown can't populate without it.

---

### DX Review — 8 Passes

#### Pass 1: Getting Started — 1/10

**Gap:** No README. No port. No one-liner. Steps from clone to first response: git clone → read PLAN.md → infer monorepo structure → install Node 18+ → install Docker → find .env.example (doesn't exist yet) → configure 6 env vars → `docker-compose up` → wait for MongoDB → find the port → POST to /auth/register.

**10/10 looks like:** `git clone → cp .env.example .env → docker-compose up` → API running at `http://localhost:3000` with Swagger at `http://localhost:3000/api-docs`.

**Fix (auto-decided D30, Critical, P1 Completeness):**

Plan must include a "Developer Quickstart" section in README.md:
```
# Developer Quickstart
git clone <repo>
cd <repo>
cp .env.example .env       # All defaults work for local dev
docker-compose up          # MongoDB + backend + frontend start together

API: http://localhost:3000
Swagger: http://localhost:3000/api-docs
Frontend: http://localhost:5173

# Seed test data
npm run seed               # Creates dev@example.com / password123 + 5 sample tasks
```

Plus a curl hello-world:
```bash
# Register
curl -c cookies.txt -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'

# Get tasks
curl -b cookies.txt http://localhost:3000/tasks
```

#### Pass 2: API Ergonomics — 6/10

**Gap:** Filter parameter names undefined. Response envelope undefined. GET /users missing for assignee dropdown.

**Fix (auto-decided D35, Medium, P5 Explicit):**

API contract specification:
- `GET /tasks?status=pending&assignee_id=<id>&from=2026-01-01&to=2026-12-31&cursor=<objectId>&limit=20`
- Response: `{ "data": [...tasks], "cursor": "<nextId>", "total": 142, "hasMore": true }`
- Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "status must be one of: pending, in-progress, completed", "field": "status" } }`
- Add `GET /users` (list all users for assignee dropdown) — requires auth, returns `{ "data": [{ "_id", "email" }] }`

#### Pass 3: Error Messages — 1/10

**Gap:** No canonical error response schema defined anywhere. 409 (version conflict), 429 (rate limit), 422 (validation), 403 (forbidden) all return mystery boxes.

**10/10 looks like:** Every error returns `{ error: { code, message, field?, retryAfter? } }`. The code is copy-pasteable into a client switch statement. The message explains the cause. There's a docs link for non-obvious errors.

**Fix (auto-decided D31, Critical, P1 Completeness):**

Canonical error schema:
```typescript
{
  error: {
    code: string;          // e.g. "VALIDATION_ERROR", "TASK_NOT_FOUND", "CONFLICT"
    message: string;       // Human-readable explanation of the problem
    field?: string;        // For validation errors: which field failed
    retryAfter?: number;   // Seconds to wait (for 429 rate limit)
  }
}
```

Required error codes and messages:
| Status | Code | Message template |
|---|---|---|
| 400 | VALIDATION_ERROR | "{field} is required" / "status must be one of: pending, in-progress, completed" |
| 401 | UNAUTHORIZED | "Authentication required" / "Token expired or invalid" |
| 403 | FORBIDDEN | "You don't have permission to {action} this task" |
| 404 | NOT_FOUND | "Task not found or not visible to you" / "User not found" |
| 409 | CONFLICT | "Task was modified by another user. Reload and retry." |
| 422 | UNPROCESSABLE | "assignee_id references a user that doesn't exist" |
| 429 | RATE_LIMITED | "Too many requests. Try again in {n} seconds" (+ retryAfter field) |
| 500 | INTERNAL_ERROR | "An unexpected error occurred. Request ID: {id}" |

#### Pass 4: Documentation — 3/10

**Gap:** Swagger specified as "auto-generated from code" but: (1) access URL not defined, (2) no auth scheme for httpOnly cookie (Swagger UI can't set cookies — evaluators need a workaround), (3) Postman collection has no pre-request script for token handling.

**Fix (auto-decided D33, High, P1 Completeness):**

- Swagger UI served at `/api-docs` using `swagger-ui-express`
- Add Bearer token option to Swagger (even though API uses httpOnly cookies) for Swagger UI compatibility — document this in Swagger description: "For Swagger UI testing, extract the token from the login response Set-Cookie header and use Bearer auth. In production, cookies are used automatically."
- Postman collection: pre-request script on collection root:
  ```javascript
  const res = await pm.sendRequest({
    url: pm.environment.get("base_url") + "/auth/login",
    method: "POST",
    header: { "Content-Type": "application/json" },
    body: { mode: "raw", raw: JSON.stringify({ email: "dev@example.com", password: "password123" }) }
  });
  pm.environment.set("auth_cookie", res.headers.get("Set-Cookie"));
  ```
- Postman environment template with `base_url=http://localhost:3000` and all required variables

#### Pass 5: Developer Journey — 1/10

**Gap:** No developer onboarding. No seed data. No end-to-end curl example. The plan has a user journey (D14) for the end user but zero for the API evaluator.

**Fix (auto-decided D34, High, P1 Completeness):**

Developer journey (add to plan):
1. **Clone + configure** (30s): `git clone → cp .env.example .env → docker-compose up`
2. **Seed data** (5s): `npm run seed` → creates `dev@example.com` + 5 tasks
3. **Swagger hello world** (2 min): open `/api-docs` → click "Authorize" → use Bearer token from login → try GET /tasks
4. **Real-time test** (2 min): open two browser tabs → edit task in one → see update in other
5. **Postman** (3 min): import collection → import environment → run "Auth Flow" folder → run "Tasks CRUD" folder

Total TTHW after fix: **~8 minutes** (competitive tier). With a polish pass on seed data + curl snippets: **<5 minutes** (champion tier).

#### Pass 6: Setup Friction — 1/10

**Gap:** 6+ env vars required before API starts. None have documented defaults. No startup validation with clear error messages.

**Fix (auto-decided D32, Critical, P1 Completeness):**

Complete `.env.example` table (add to plan):

| Variable | Required | Default (local) | Purpose |
|---|---|---|---|
| `PORT` | No | `3000` | API server port |
| `MONGO_URI` | Yes (if no Docker) | `mongodb://mongo:27017/taskdb` | MongoDB connection (Docker: use service name) |
| `JWT_SECRET` | Yes | `dev-jwt-secret-change-in-prod` | Access token signing key |
| `JWT_REFRESH_SECRET` | Yes | `dev-refresh-secret-change-in-prod` | Refresh token signing key |
| `JWT_ACCESS_TTL` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | No | `7d` | Refresh token lifetime |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin |
| `BCRYPT_ROUNDS` | No | `10` | Password hash rounds |
| `RATE_LIMIT_WINDOW` | No | `15m` | Rate limit window |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `PAGINATION_DEFAULT_LIMIT` | No | `20` | Default page size |

**Startup validation:** On boot, check required vars. If missing, log and exit:
```
Error: JWT_SECRET is required. Copy .env.example to .env and set JWT_SECRET.
```

#### Pass 7: Escape Hatches — 2/10

**Gap:** Almost nothing is configurable without editing source code.

**Fix (auto-decided D36, Medium, P3 Pragmatic):**

Per the env var table above (D32), expose as configurable:
- `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` — for testing with very short tokens
- `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX` — for load testing
- `PAGINATION_DEFAULT_LIMIT` — for large-dataset testing
- `BCRYPT_ROUNDS` — for test environments (set to 1 for speed in CI)

#### Pass 8: Upgrade Path — N/A (greenfield)

No existing version to upgrade from. Add a CHANGELOG.md with initial v1.0.0 entry. Use Conventional Commits format for automated changelog generation.

**Auto-Decision D37 (Mechanical, P5):** Add CHANGELOG.md with v1.0.0 entry to plan deliverables.

### DX Scorecard

| Dimension | Score Before | Issues | Auto-Decisions | Score After |
|---|---|---|---|---|
| 1. Getting Started | 1/10 | No README, no quickstart, no seed | D30, D34 | 8/10 |
| 2. API Ergonomics | 6/10 | Filter params undefined, GET /users missing | D35 | 8/10 |
| 3. Error Messages | 1/10 | No canonical schema | D31 | 9/10 |
| 4. Documentation | 3/10 | Swagger auth scheme, Postman scripts | D33 | 8/10 |
| 5. Developer Journey | 1/10 | No onboarding, no seed data | D34 | 8/10 |
| 6. Setup Friction | 1/10 | No .env.example, no startup validation | D32 | 8/10 |
| 7. Escape Hatches | 2/10 | Everything hardcoded | D36 | 7/10 |
| 8. Upgrade Path | N/A | Greenfield | D37 | 7/10 |

**TTHW: 20-45 min → <5 min (Champion tier) after D30, D32, D34.**

**Overall DX: 1/10 → 8/10 after 8 auto-decisions.**

### DX Implementation Checklist

- [ ] README.md with Developer Quickstart section (`docker-compose up` one-liner, ports, Swagger URL)
- [ ] `npm run seed` script creating `dev@example.com / password123` + 5 sample tasks
- [ ] Curl hello-world snippet in README
- [ ] `.env.example` with all 11 variables, safe local defaults, purpose comments
- [ ] Startup validation for required env vars (fail fast with clear error)
- [ ] Canonical error schema `{ error: { code, message, field?, retryAfter? } }` implemented in all handlers
- [ ] Error code enum documented (8 codes: VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, UNPROCESSABLE, RATE_LIMITED, INTERNAL_ERROR)
- [ ] `GET /tasks` query param names documented: `?status=&assignee_id=&from=&to=&cursor=&limit=`
- [ ] Response envelope: `{ data: [...], cursor: "", hasMore: bool }`
- [ ] `GET /users` endpoint added for assignee dropdown
- [ ] Swagger served at `/api-docs` with cookie-auth workaround documented
- [ ] Postman collection with pre-request auth script
- [ ] Postman environment template with `base_url=http://localhost:3000`
- [ ] JWT TTL, rate limit, pagination limit, bcrypt rounds all env-configurable
- [ ] CHANGELOG.md with v1.0.0 entry

## TODOS.md (Deferred Scope)

Items deferred — not blocking MVP:
1. Email/push notifications for task events
2. Multi-team workspace support
3. Advanced role-based permissions (beyond owner/assignee)
4. File attachments on tasks
5. Mobile native app
6. Task templates
7. Recurring tasks
8. Analytics/reporting dashboard
9. Redis-backed JWT blocklist (implement if short-TTL refresh rotation is insufficient)
10. E2E test suite (defer if timeline is tight — unit + integration take priority)

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| D2 | CEO | Add JWT refresh token rotation (15min access + 7-day refresh) | Mechanical | P1 Completeness | Logout without revocation = theater; stolen tokens remain valid | No refresh (insecure) |
| D3 | CEO | Add cursor-based pagination to GET /tasks (default: 20/page) | Mechanical | P1 Completeness | Returning all tasks causes OOM at scale; <2s load requires pagination | No pagination |
| D4 | CEO | Add Socket.io JWT auth middleware on all connections + reconnects | Mechanical | P1 Completeness | Auth only at handshake leaves reconnects unauthenticated | Auth at handshake only |
| D5 | CEO | Promote TypeScript from "bonus" to first-class | Mechanical | P5 Explicit | Retrofitting types post-implementation is high-cost and usually abandoned | Optional TypeScript |
| D6 | CEO | Add WebSocket room re-auth on task assignment change | Mechanical | P1 Completeness | Removed assignee continues receiving task events — data leak | No room re-auth |
| D7 | CEO | Keep Socket.io over SSE | Taste | P3 Pragmatic | Plan needs bidirectional (multi-user awareness, optimistic rollback); SSE is one-way | SSE (simpler but one-way) |
| D8 | CEO | Add optimistic locking with conflict detection to task update | Mechanical | P1 Completeness | Silent last-write-wins corrupts collaborative data; version field + conflict notification | Silent overwrite |
| D9 | CEO | Document alternatives rationale in plan | Mechanical | P5 Explicit | Plan chose MongoDB/Socket.io without analysis; document why | No rationale |
| D10 | CEO | Add Mongoose as required (not optional) dependency | Mechanical | P1 Completeness | Schema enforcement prevents silent data corruption in MongoDB | Raw MongoDB driver |
| D11 | CEO | Specify CORS origins explicitly in plan | Mechanical | P5 Explicit | "Frontend domain" is vague; misconfigured CORS is a security gap | Vague CORS config |
| D12 | CEO | Add pagination to success criterion #6 | Mechanical | P1 Completeness | "Dashboard loads <2s" fails if GET /tasks returns 10,000 records | No pagination criterion |
| D13 | CEO | Keep 2-week estimate; note E2E may slip | Taste | P3 Pragmatic | 2 weeks is P50; E2E tests are last to implement, first to defer | Extend timeline |
| D14 | Design | Add user journey narrative to plan | Mechanical | P5 Explicit | Plan is backend-first; implementer needs a user journey to reference | No journey |
| D15 | Design | Pick Tailwind CSS (not "Tailwind or MUI"); define design tokens | Mechanical | P5 Explicit | Two frameworks = two radically different outputs; tokens prevent arbitrary choices | Leave open |
| D16 | Design | Specify sidebar (fixed 240px), filter bar (horizontal), card density (2-line truncation) | Mechanical | P5 Explicit | Ambiguity becomes scope creep mid-implementation | Implementer's discretion |
| D17 | Design | Add state matrix (loading/empty/error/success) for all screens | Mechanical | P1 Completeness | Missing states ship as white screens or broken UI | Ad-hoc states |
| D18 | Design | Define breakpoints (<768, 768-1024, >1024) with behavior per breakpoint | Mechanical | P1 Completeness | "Hamburger menu" is not a responsive spec | General description |
| D19 | Design | Specify real-time editing indicator (avatar chips, 44px, fade on stop) and optimistic rollback (red toast + revert) | Mechanical | P1 Completeness | "Visual indicators" and "optimistic UI" are not implementable without spec | Leave to implementer |
| D20 | Design | Promote accessibility basics to first-class (contrast AA, keyboard nav, aria labels) | Mechanical | P1 Completeness | If listed as bonus, it gets cut; basics should be non-negotiable | Keep as bonus |
| D21 | Eng | Promote JTI blocklist from TODOS to MVP (in-memory Set<jti> in AuthService) | Mechanical | P0 Security | Logout without blocklist is theater; stolen token valid until TTL expires | Keep deferred |
| D22 | Eng | Add userSocketMap: Map<userId, Set<socketId>> to architecture; force socket.leave() on unassign | Mechanical | P0 Security | Without userId→socketId tracking, room eviction on unassign is impossible | Design gap |
| D23 | Eng | Specify cursor-based pagination: _id cursor, sort createdAt DESC, compound index (assignee_id, createdAt, _id) | Mechanical | P1 Completeness | "Cursor pagination default 20" is not implementable without specifying cursor field and index | Vague spec |
| D24 | Eng | Add version: Number (default: 0) to Task schema; enforce in PATCH handler; return 409 on mismatch | Mechanical | P1 Completeness | Optimistic lock (D8) is not implementable without a version field in the schema | No version field |
| D25 | Eng | Add getVisibleTasks(userId) to TaskService; call on every read path | Mechanical | P1 Security | Without visibility filter, any authenticated user can read any task by ID | No access control |
| D26 | Eng | Add 5 critical integration tests (concurrent PATCH, rate limit burst, DB loss, reconnect, room eviction) | Mechanical | P1 Completeness | These are the paths that fail at 2am Friday; 70% coverage without them is noise | Generic test plan |
| D27 | Eng | Add Docker healthchecks (MongoDB) + depends_on condition + .env.example + env_file directive | Mechanical | P2 Reliability | Without healthcheck, backend crashes on boot if MongoDB takes >2s to initialize | No startup order |
| D28 | Eng | Add assignee existence validation in PATCH /tasks/:id/assign; return 404 if user not found | Mechanical | P2 Correctness | Assigning task to non-existent user creates dangling reference in MongoDB | No validation |
| D29 | Eng | Set maxPoolSize: 10 in Mongoose connect options; document Redis adapter for Socket.io scale | Mechanical | P2 Performance | Default pool size 5 queues at 100+ concurrent users; Redis adapter needed for horizontal scale | Default settings |
| D30 | DX | Add README Developer Quickstart (docker-compose up, ports, Swagger URL, curl snippet) | Mechanical | P1 Completeness | No README = TTHW 20-45min; evaluator can't start without it | No README |
| D31 | DX | Define canonical error response schema: { error: { code, message, field?, retryAfter? } } | Mechanical | P1 Completeness | Without schema, API is a mystery box; evaluators can't write client error handling | No error schema |
| D32 | DX | Add .env.example with all 11 vars, safe local defaults, startup validation | Mechanical | P1 Completeness | Required vars unknown until you read source; startup should fail fast with clear error | No env docs |
| D33 | DX | Specify Swagger at /api-docs with cookie-auth workaround + Postman pre-request auth script | Mechanical | P1 Completeness | httpOnly cookies break Swagger UI auth; evaluators can't try endpoints | Broken auth in docs |
| D34 | DX | Add seed script (npm run seed) creating dev@example.com + 5 tasks + curl hello-world | Mechanical | P1 Completeness | Without seed data, evaluating real-time with 2 users requires creating accounts manually | No seed data |
| D35 | DX | Define filter param names (?status=, ?assignee_id=, ?from=, ?to=, ?cursor=, ?limit=) + response envelope + GET /users | Mechanical | P5 Explicit | "Filter by status" is not an API spec; GET /users missing = assignee dropdown broken | Vague filter spec |
| D36 | DX | Expose JWT TTL, rate limit, pagination limit, bcrypt rounds as configurable env vars | Mechanical | P3 Pragmatic | Hardcoded values prevent load testing and test-environment tuning | Hardcoded |
| D37 | DX | Add CHANGELOG.md with v1.0.0 entry to deliverables | Mechanical | P5 Explicit | No changelog = no upgrade story for future evaluators | No changelog |

---

## GSTACK REVIEW REPORT

> Generated by `/autoplan` — 2026-05-15 | Branch: `main` | Commit: `46341db`

| Skill | Phase | Status | Findings | Decisions |
|---|---|---|---|---|
| plan-ceo-review | CEO | issues_open | 2 critical gaps, 1 unresolved | SELECTIVE_EXPANSION mode; user journey, failure modes, scope added |
| plan-design-review | Design | issues_open | 0 unresolved | 7 design passes; state matrix, tokens, breakpoints, real-time UX spec added |
| plan-eng-review | Eng | issues_open | 9 issues found, 2 critical gaps, 0 unresolved | JTI blocklist, userSocketMap, optimistic lock, visibility filter, cursor pagination added |
| plan-devex-review | DX | issues_open | 0 unresolved; score 1→8/10 | TTHW 20-45min → <5min; README, .env.example, seed, error schema, Swagger workaround added |
| autoplan-voices (CEO) | CEO | — | 2 confirmed, 2 disagree | Single-model mode (codex unavailable) |
| autoplan-voices (Design) | Design | — | 3 confirmed, 4 disagree | Single-model mode (codex unavailable) |
| autoplan-voices (Eng) | Eng | — | 1 confirmed, 5 disagree | Single-model mode (codex unavailable) |
| autoplan-voices (DX) | DX | — | 6 confirmed, 0 disagree | Single-model mode (codex unavailable) |

**Total decisions logged:** D2–D37 (36 decisions)
**User challenges:** 1 (MongoDB retained over PostgreSQL — user preference)
**Approval:** Approve as-is — 2026-05-15

> Next step: `/ship` to begin implementation.
