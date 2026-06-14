require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const groupsRouter = require('./routes/groups');
const expensesRouter = require('./routes/expenses');
const settlementsRouter = require('./routes/settlements');
const commentsRouter = require('./routes/comments');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Attach io to app so routes can access it
app.set('io', io);

io.on('connection', (socket) => {
  // Client joins a per-expense room to receive real-time comments
  socket.on('join_expense', ({ expenseId }) => {
    socket.join(`expense:${expenseId}`);
  });

  socket.on('leave_expense', ({ expenseId }) => {
    socket.leave(`expense:${expenseId}`);
  });

  socket.on('disconnect', () => {
    // Socket.io automatically cleans up rooms on disconnect
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);

// Group routes with nested expenses and settlements
app.use('/api/groups', groupsRouter);
app.use('/api/groups/:groupId/expenses', expensesRouter);
app.use('/api/groups/:groupId/settlements', settlementsRouter);

// Comment routes (keyed by expenseId, not groupId)
app.use('/api/expenses/:expenseId/comments', commentsRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`Splitree API running on port ${PORT}`);
  });
}

// Export for Supertest
module.exports = { app, httpServer };
