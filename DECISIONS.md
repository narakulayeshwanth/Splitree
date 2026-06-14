# DECISIONS.md — Architecture & Design Decision Log

Each entry follows the format: **Context → Options Considered → Decision → Reason**

---

## 1. Database: PostgreSQL vs MongoDB

**Context:** Need persistent storage for structured relational data (users, groups, expenses, splits, settlements).

**Options:**
- **PostgreSQL (Neon)** — relational, strict schema, ACID transactions, free serverless tier
- **MongoDB** — flexible schema, document model, easier early iteration
- **SQLite** — simple, file-based, no cloud hosting

**Decision:** PostgreSQL via Neon serverless + Prisma ORM.

**Reason:**
- Expense splitting is inherently relational — `ExpenseSplit` references both `Expense` and `User`, settlements reference two users and a group. Foreign key constraints enforce data integrity.
- Decimal arithmetic is accurate in PostgreSQL — critical for financial data.
- Neon provides free serverless Postgres with connection pooling — zero infrastructure cost.
- Prisma gives type-safe queries and auto-generated migrations.

---

## 2. ORM: Prisma vs Raw SQL vs Sequelize

**Context:** Need a way to interact with PostgreSQL.

**Options:**
- **Prisma** — type-safe, schema-first, auto-migrations, modern API
- **Sequelize** — mature, JS-native, more verbose, less type safety
- **Raw SQL** — maximum control, error-prone, no schema tracking
- **Drizzle** — newer, lighter, good TS support

**Decision:** Prisma v5.

**Reason:**
- Schema-first design means the `schema.prisma` file is the single source of truth — readable and self-documenting.
- `prisma migrate dev` generates versioned SQL migrations automatically.
- Type safety prevents entire classes of runtime errors (wrong field names, missing includes).
- Prisma's `@@unique` and `onDelete: Cascade` declaratively enforce business rules.

---

## 3. Split Types: Which to Support

**Context:** How should expenses be divided among participants?

**Options:**
- Equal only (Splitwise MVP)
- Equal + Unequal
- Equal + Unequal + Percentage
- Equal + Unequal + Percentage + Shares

**Decision:** All four: `EQUAL`, `UNEQUAL`, `PERCENTAGE`, `SHARE`.

**Reason:**
- Real-world groups have diverse needs — a trip may have equal hotel split but flight costs that vary by ticket price (UNEQUAL), or a landlord covering 60% rent (PERCENTAGE).
- Share-based splitting (2 shares vs 1 share) is the most fair approach when usage differs proportionally.
- All four are implemented in a single pure function (`splitCalculator.js`) — adding them cost minimal complexity.
- Each type is independently tested in `expenses.test.js`.

---

## 4. Balance Calculation: Real-Time vs Cached

**Context:** Balances change every time an expense or settlement is added/modified.

**Options:**
- **Real-time calculation** — compute from raw expenses + settlements every request
- **Cached/materialized** — store a running balance in a `Balance` table, update on each change
- **Event-sourced** — store all transactions and replay on demand

**Decision:** Real-time calculation from source data.

**Reason:**
- Simplicity — no risk of cache invalidation bugs. With financial data, stale balances are worse than slow balances.
- The dataset per group is small — even 1000 expenses processes in milliseconds in JS.
- Avoids a whole class of bugs where balance table gets out of sync with actual expenses.
- Correct-by-construction: the balance is always derived from the ground truth.
- Can be optimized later with caching if scale demands it.

---

## 5. Authentication: JWT vs Sessions

**Context:** Need to identify users across API requests.

**Options:**
- **JWT (stateless)** — token stored client-side, no server state
- **Session + cookie** — server stores session, cookie passed back
- **OAuth only** — Google/GitHub login, no passwords

**Decision:** JWT stored in `localStorage`, sent as `Authorization: Bearer` header.

**Reason:**
- Stateless — backend can scale horizontally without shared session store.
- REST API + JWT is the industry standard for React + Node.js SPAs.
- Simple implementation: `jsonwebtoken` sign on login, verify via middleware on every protected route.
- 7-day expiry with 401 → auto-redirect to login gives good UX with reasonable security.

---

## 6. Soft Delete vs Hard Delete for Expenses

**Context:** Users should be able to "delete" expenses, but hard deletion creates referential integrity problems.

**Options:**
- **Hard delete** — remove from DB, cascade to splits/comments
- **Soft delete** — set `isDeleted: true`, filter in all queries

**Decision:** Soft delete (`isDeleted: Boolean @default(false)`).

**Reason:**
- If an expense is hard-deleted but a settlement was already recorded against it, the settlement becomes orphaned and balances look wrong.
- Soft delete preserves audit trail — useful for disputes.
- All `findMany` queries filter `{ isDeleted: false }` automatically.
- The balance calculator only includes non-deleted expenses.

---

## 7. Real-Time: Socket.io vs Server-Sent Events vs Polling

**Context:** Expense comments should update in real-time for a collaborative feel.

**Options:**
- **Socket.io** — WebSocket abstraction, rooms, reliable, good browser support
- **Server-Sent Events (SSE)** — simpler, unidirectional, no library needed
- **Polling** — simplest, but wasteful and laggy

**Decision:** Socket.io with per-expense rooms.

**Reason:**
- Bidirectional potential — comments are the start; future features (live balance updates, typing indicators) need full duplex.
- Room-based broadcasting (`expense:${expenseId}`) means only clients viewing that expense receive updates — minimal overhead.
- Socket.io handles WebSocket fallback to polling automatically — works everywhere.
- `socket.join()` / `socket.leave()` called from the frontend when navigating to/from expense detail.

---

## 8. Frontend State: Context API vs Redux vs Zustand

**Context:** Need to share auth state (current user, token) across all components.

**Options:**
- **React Context + useState** — built-in, no dependency, sufficient for auth
- **Redux Toolkit** — powerful, overkill for a single shared state slice
- **Zustand** — lightweight, ergonomic, less boilerplate than Redux

**Decision:** React Context API (`AuthContext`).

**Reason:**
- Auth is the only global state needed — user, token, login(), logout(). This is exactly the use case Context was designed for.
- Adding Redux for one slice of state adds ~15KB bundle and significant boilerplate.
- Context re-renders are acceptable since auth state changes rarely (login/logout only).
- Simpler to understand and maintain.

---

## 9. API Design: REST vs GraphQL vs tRPC

**Context:** How should frontend and backend communicate?

**Options:**
- **REST** — simple, HTTP verbs, resource-based URLs, well-understood
- **GraphQL** — flexible queries, avoids over/under-fetching, complex setup
- **tRPC** — end-to-end type safety, TypeScript-only

**Decision:** REST with Express Router.

**Reason:**
- REST fits the CRUD nature of this app perfectly — resources are groups, expenses, settlements.
- No complex query requirements — each screen needs a specific, predictable set of data.
- Express Router's nested routes (`/groups/:id/expenses`) map naturally to the data hierarchy.
- Lower cognitive overhead — any developer familiar with HTTP understands the API immediately.
- tRPC requires TypeScript across the full stack; backend is CommonJS.

---

## 10. Deployment: Render + Vercel vs Heroku vs Railway

**Context:** Need free-tier cloud hosting for demo deployment.

**Options:**
- **Render (backend) + Vercel (frontend)** — both have generous free tiers
- **Heroku** — no longer has free tier
- **Railway** — good DX, has free tier with limits
- **Fly.io** — Docker-based, excellent for Node, more setup

**Decision:** Render for backend, Vercel for frontend.

**Reason:**
- Both have zero-cost free tiers sufficient for demo traffic.
- Vercel is purpose-built for Vite/React — zero configuration, instant global CDN.
- Render auto-deploys from GitHub on push, supports Node.js natively, allows environment variable management via dashboard.
- Neon PostgreSQL runs independently — backend only needs `DATABASE_URL`, making deployment straightforward.
