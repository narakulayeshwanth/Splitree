# BUILD_PLAN.md — Splitree

> This document summarizes the full build plan for Splitree, a simplified Splitwise clone,
> built as an internship assignment using AI as a primary development collaborator.

---

## 1. Product Research

### How I Studied Splitwise
- Used Splitwise personally for trip and friend-group expense tracking.
- Identified core user flows by going through the app's main screens: dashboard, groups, expenses, balances, settlements.
- Identified which features are essential vs. ancillary (see scope below).

### What I Learned
- Splitwise's core value is **eliminating the need to calculate who owes whom** after group spending.
- The balance engine works on raw expense + settlement records — not running counters.
- Expense splitting is the most nuanced feature: 4 split types, each with different validation rules.
- Group management is simple: no RBAC complexity — only the creator has elevated privileges.
- Real-time features (comments) are UX enhancements, not core to the product.

### Core Workflows Identified
1. Register/login → land on dashboard
2. Create group → invite members by email
3. Add expense → choose split type → confirm amounts
4. View group page → see pairwise balances
5. Record settlement → balance updates
6. Open expense → read/write comments in real time

### Product Assumptions Made
- One payer per expense (no split-pay for MVP).
- "Adding a user" means searching by email — no invitations to non-registered users.
- Removed members' historical expense data is preserved.
- Members with outstanding balances cannot leave a group.
- No category field on expenses (time constraint).
- Currency is always treated as a single unnamed unit (e.g., ₹ or $ not stored).

---

## 2. Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Frontend Routing | React Router v6 |
| Frontend State | React Context API |
| HTTP Client | Axios |
| Real-time Client | socket.io-client |
| Backend | Node.js 20 + Express 5 |
| Real-time Server | Socket.io |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 (Neon) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod |
| Frontend Deploy | Vercel |
| Backend Deploy | Render (free tier) |
| DB Deploy | Neon (free tier) |

### Database Schema Summary

**7 tables:**

| Table | Purpose |
|---|---|
| `User` | Registered accounts |
| `Group` | Expense groups |
| `GroupMember` | Many-to-many: users ↔ groups |
| `Expense` | Individual expense records |
| `ExpenseSplit` | Per-user owed amount for each expense |
| `Settlement` | Payment records between two users |
| `Comment` | Comment thread per expense |

**Key design choices:**
- All PKs are UUID v4.
- `is_deleted` flag on `Expense` for soft delete.
- `Decimal(10,2)` for all monetary values.
- Balances are never stored — always computed dynamically from `ExpenseSplit` and `Settlement` records.

See `AI_CONTEXT.md §8` for the full Prisma schema.

### API Design Summary

**9 route groups:**
- `POST/GET /api/auth/*` — register, login, me
- `GET /api/users/search` — find user by email
- `POST/GET/PUT/DELETE /api/groups/*` — CRUD groups
- `POST/DELETE /api/groups/:id/members` — member management
- `POST/GET/PUT/DELETE /api/groups/:groupId/expenses/*` — expense CRUD
- `GET /api/groups/:groupId/balances` — computed balances
- `POST/GET /api/groups/:groupId/settlements` — settlement records
- `POST/GET /api/expenses/:expenseId/comments` — comments
- `GET /api/dashboard` — overall summary

See `AI_CONTEXT.md §9` for full request/response shapes.

### Frontend Structure Summary

**9 pages:**
- `/login`, `/register` — public
- `/` (dashboard), `/groups/new`, `/groups/:id`, `/groups/:id/expenses/new`, `/groups/:id/expenses/:expenseId`, `/groups/:id/settle`, `/profile` — protected

**Key components:** Navbar, ProtectedRoute, ExpenseCard, BalanceSummary, MemberList, CommentThread, SplitForm, SettlementForm.

### Deployment Approach

```
┌──────────────┐    REST API     ┌──────────────┐    Prisma    ┌──────────┐
│   Vercel     │ ─────────────→  │    Render    │ ──────────→  │   Neon   │
│  (React FE)  │  Socket.io WS   │  (Node BE)   │             │ (Postgres)│
└──────────────┘                 └──────────────┘             └──────────┘
```

- Migrations run automatically on each backend deploy (`prisma migrate deploy`).
- CORS configured to allow only the Vercel frontend origin.
- `.env.example` committed; actual secrets in platform dashboards.

---

## 3. AI Collaboration Process

### How I Instructed the AI
- Used the verbatim "Required Initial Prompt" from the assignment to frame the AI as a junior engineer.
- Explicitly told the AI NOT to assume requirements and NOT to jump to implementation.
- Instructed the AI to maintain `AI_CONTEXT.md` as the source of truth.

### Questions the AI Asked (Interview Summary)
The AI conducted a structured 46-question interview across:
- Product goals (what Splitwise features matter, who the users are)
- Auth (JWT vs sessions, fields, token lifetime)
- Group management (roles, member removal rules, leave rules)
- Expenses (fields, split types, payer model, soft vs hard delete)
- Comments/chat (per-expense vs group chat, real-time tech)
- Balances (pairwise vs simplified, display format)
- Settlements (who initiates, partial support, fields)
- Frontend screens (routes, landing page after login)
- Tech stack (DB, backend, frontend, ORM)
- Deployment (platforms, domain, data persistence)

### How I Answered
- Answered in structured markdown, one category at a time.
- Made explicit decisions for every ambiguous area (e.g., "soft delete", "UUID PKs", "Render free tier OK").
- Explicitly deferred certain features (category field) due to time constraints.

### How the Plan Evolved
1. Interview → raw requirements captured.
2. AI produced `AI_CONTEXT.md` with complete product understanding, schema, and API.
3. AI produced `BUILD_PLAN.md` with architecture summary.
4. Build proceeds based only on the agreed context — no assumption-driven code.

### How AI_CONTEXT.md Was Maintained
- Created before the first line of code.
- Section 15 ("Changes Made During Implementation") updated whenever a requirement, schema, or API contract changes during the build.
- Any deviation from the original plan documented with a reason.

---

## 4. Tradeoffs

### What We Simplified
| Item | Simplification |
|---|---|
| Auth | No refresh tokens; single long-lived JWT (7 days) |
| Member management | No role system beyond creator privileges |
| Expense assignment | Single payer only |
| Balance display | Raw pairwise (no debt simplification) |
| Real-time | Comments only (not live expense updates) |

### What We Hardcoded
- Token expiry: 7 days (not configurable per user).
- Currency: no label stored (assume single currency throughout).
- Max group size: no enforced limit (DB constraint only).

### What We Avoided
- Email/SMTP integration (no notifications, no email invites).
- File storage (no receipt images).
- Currency conversion API.
- Caching layer (Redis, etc.) — balance always recomputed.
- Pagination on expense lists.
- Complex RBAC within groups.

### What We Would Improve With More Time
1. **Refresh token system** — more secure auth flow.
2. **Debt simplification** — reduce the number of settlements needed.
3. **Email notifications** — alert users of new expenses/settlements.
4. **Pagination** — `/api/groups/:id/expenses?page=1&limit=20`.
5. **Category field on expenses** — better filtering.
6. **Balance caching** — compute incrementally instead of full recompute.
7. **Multi-currency support** — with a currency field and conversion at display time.
8. **Optimistic UI updates** — instant feedback before server confirms.
9. **Mobile responsiveness polish** — full Tailwind responsive breakpoints.
10. **E2E tests with Playwright** — automated regression testing.

---

## 5. Build Sequence

The implementation follows this order (dependencies first):

### Phase 1 — Backend Foundation
1. Initialize Node.js + Express project
2. Set up Prisma + PostgreSQL (Neon) connection
3. Run initial migrations
4. Auth routes: register, login, me
5. JWT middleware

### Phase 2 — Core Backend Features
6. Group routes: CRUD + member management
7. Expense routes: CRUD with split calculation logic
8. Balance calculation engine
9. Settlement routes
10. Comment routes
11. Dashboard aggregation route
12. Socket.io setup for real-time comments

### Phase 3 — Frontend Foundation
13. Vite + React + Tailwind setup
14. Axios instance with auth interceptor
15. AuthContext (login, logout, token persistence)
16. ProtectedRoute component
17. Routing setup (React Router v6)

### Phase 4 — Core Frontend Pages
18. Login + Register pages
19. Dashboard page
20. Group create page
21. Group detail page (members, expenses, balances)
22. Expense create page (with SplitForm component)
23. Expense detail page (with CommentThread)
24. Settle page
25. Profile page

### Phase 5 — Integration & Polish
26. Socket.io client integration in ExpenseDetail
27. Error handling and form validation
28. UI polish (Tailwind styling, dark mode, animations)

### Phase 6 — Deployment
29. Deploy backend to Render (configure env vars, run migrations)
30. Deploy frontend to Vercel (configure env vars, point to Render URL)
31. Smoke test all flows on deployed URLs
32. Write README.md with setup instructions

---

*Document finalized: 2026-06-13 — ready to begin Phase 1.*
