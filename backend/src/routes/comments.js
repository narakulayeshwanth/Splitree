const express = require('express');
const router = express.Router({ mergeParams: true });
const { z } = require('zod');
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');

// ─── Validation ───────────────────────────────────────────────────────────────

const commentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty'),
});

// ─── POST /api/expenses/:expenseId/comments ───────────────────────────────────

router.post('/', authenticate, async (req, res) => {
  const { expenseId } = req.params;

  // Verify expense exists and user is a member of its group
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, isDeleted: false },
    select: { groupId: true },
  });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: expense.groupId, userId: req.user.id } },
  });
  if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  try {
    const comment = await prisma.comment.create({
      data: {
        expenseId,
        userId: req.user.id,
        text: parsed.data.text,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Emit real-time event to all clients viewing this expense
    const io = req.app.get('io');
    if (io) {
      io.to(`expense:${expenseId}`).emit('new_comment', {
        id: comment.id,
        expenseId,
        user: comment.user,
        text: comment.text,
        createdAt: comment.createdAt,
      });
    }

    return res.status(201).json({
      id: comment.id,
      expenseId,
      user: comment.user,
      text: comment.text,
      createdAt: comment.createdAt,
    });
  } catch (err) {
    console.error('Create comment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/expenses/:expenseId/comments ────────────────────────────────────

router.get('/', authenticate, async (req, res) => {
  const { expenseId } = req.params;

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, isDeleted: false },
    select: { groupId: true },
  });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: expense.groupId, userId: req.user.id } },
  });
  if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

  try {
    const comments = await prisma.comment.findMany({
      where: { expenseId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return res.status(200).json(comments);
  } catch (err) {
    console.error('List comments error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
