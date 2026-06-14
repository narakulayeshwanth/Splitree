# Splitree — Premium Expense Sharing

![Splitree](https://img.shields.io/badge/Splitree-v1.0-10b981?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node%20%2B%20PostgreSQL-3b82f6?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-21%20passing-10b981?style=for-the-badge)

A full-stack group expense splitting application — create groups, add expenses with multiple split strategies, track who owes whom, settle debts, and discuss expenses in real-time.

**Live App:** `https://splitree.vercel.app` *(deploy instructions below)*  
**GitHub:** `https://github.com/your-username/splitree`

---

## Features

- **Auth** — JWT-based register/login, protected routes
- **Groups** — create groups, invite members by email, leave/remove members
- **Expenses** — 4 split types: Equal, Unequal, Percentage, Share-based
- **Balance Engine** — real-time pairwise balance calculation per group
- **Settlements** — record payments, balances update instantly
- **Comments** — per-expense discussion with Socket.io real-time delivery
- **Dashboard** — net balance overview, activity feed, group summaries
- **Activity** — full timeline of expenses and settlements

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios |
| Backend | Node.js, Express 5, Socket.io |
| Database | PostgreSQL (Neon serverless) via Prisma ORM v5 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod schemas |
| Testing | Jest (21 tests across 3 suites) |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Local Setup

### Prerequisites
- Node.js v18+
- A PostgreSQL database URL (Neon recommended — free tier)

### 1. Clone
```bash
git clone https://github.com/your-username/splitree.git
cd splitree
```

### 2. Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-super-secret-key-min-32-chars
PORT=3000
CLIENT_URL=http://localhost:5173
```

Run migrations and seed:
```bash
npx prisma migrate dev --name init
npm run seed
```

Start backend:
```bash
npm run dev          # runs on http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

Start frontend:
```bash
npm run dev          # runs on http://localhost:5173
```

### 4. Demo Accounts (after seed)
| Name | Email | Password |
|---|---|---|
| Alice | alice@test.com | password123 |
| Bob | bob@test.com | password123 |
| Charlie | charlie@test.com | password123 |

---

## Running Tests

```bash
cd backend
npm test             # all 21 tests (requires live DB)
npm run test:unit    # 15 unit tests (no DB needed)
```

---

## Deployment

### Backend → Render
1. Create new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `npm install && npx prisma generate`
4. Start command: `node src/index.js`
5. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`

### Frontend → Vercel
1. Import project on [vercel.com](https://vercel.com)
2. Set root to `frontend/`
3. Add env var: `VITE_API_URL=https://your-render-app.onrender.com/api`

---

## AI Used

This project was built with assistance from **Google Gemini (Antigravity IDE)**.  
See [AI_USAGE.md](./AI_USAGE.md) for detailed usage, prompts, and corrections.

---

## Project Structure

```
splitree/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # DB models
│   │   ├── seed.js            # Demo data
│   │   └── migrations/
│   ├── src/
│   │   ├── index.js           # Express + Socket.io server
│   │   ├── middleware/auth.js  # JWT authentication
│   │   ├── routes/            # auth, groups, expenses, settlements, comments, dashboard
│   │   └── utils/             # balanceCalculator, splitCalculator, activityGenerator
│   └── tests/                 # auth, balances, expenses test suites
└── frontend/
    └── src/
        ├── api/               # axios client + per-resource modules
        ├── components/        # Sidebar, ProtectedRoute
        ├── context/           # AuthContext
        └── pages/             # Dashboard, Groups, GroupDetail, ExpenseCreate, etc.
```
