const express = require('express');
const router = express.Router({ mergeParams: true });
const { z } = require('zod');
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');
const { calculateSplits } = require('../utils/splitCalculator');

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireGroupMember(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

// ─── Validation ───────────────────────────────────────────────────────────────

const participantSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().optional(),
  percentage: z.number().optional(),
  shareValue: z.number().optional(),
});

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  paidBy: z.string().uuid('paidBy must be a valid user ID'),
  splitType: z.enum(['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE']),
  expenseDate: z.string().datetime({ offset: true }).or(z.string()),
  notes: z.string().optional().nullable(),
  participants: z.array(participantSchema).min(1, 'At least one participant required'),
});

// ─── POST /api/groups/:groupId/expenses ──────────────────────────────────────

router.post('/', authenticate, async (req, res) => {
  const { groupId } = req.params;
  const member = await requireGroupMember(groupId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this group' });

  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { title, amount, paidBy, splitType, expenseDate, notes, participants } = parsed.data;

  // Compute splits using pure function (throws on validation failure)
  let splits;
  try {
    splits = calculateSplits(splitType, amount, participants);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        title,
        amount,
        paidBy,
        splitType,
        expenseDate: new Date(expenseDate),
        notes,
        groupId,
        createdBy: req.user.id,
        splits: {
          create: splits.map((s) => ({
            userId: s.userId,
            amount: s.amount,
            shareValue: s.shareValue ?? null,
            percentage: s.percentage ?? null,
          })),
        },
      },
      include: {
        payer: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return res.status(201).json(expense);
  } catch (err) {
    console.error('Create expense error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/groups/:groupId/expenses ───────────────────────────────────────

router.get('/', authenticate, async (req, res) => {
  const { groupId } = req.params;
  const member = await requireGroupMember(groupId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this group' });

  try {
    const expenses = await prisma.expense.findMany({
      where: { groupId, isDeleted: false },
      include: {
        payer: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { expenseDate: 'desc' },
    });
    return res.status(200).json(expenses);
  } catch (err) {
    console.error('List expenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/groups/:groupId/expenses/:expenseId ────────────────────────────

router.get('/:expenseId', authenticate, async (req, res) => {
  const { groupId, expenseId } = req.params;
  const member = await requireGroupMember(groupId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this group' });

  try {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, groupId, isDeleted: false },
      include: {
        payer: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    return res.status(200).json(expense);
  } catch (err) {
    console.error('Get expense error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/groups/:groupId/expenses/:expenseId ────────────────────────────

router.put('/:expenseId', authenticate, async (req, res) => {
  const { groupId, expenseId } = req.params;
  const member = await requireGroupMember(groupId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this group' });

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, groupId, isDeleted: false },
  });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  const isCreator = expense.createdBy === req.user.id;
  const isGroupCreator = group.createdBy === req.user.id;
  if (!isCreator && !isGroupCreator) {
    return res.status(403).json({ error: 'Only the expense creator or group creator can edit this expense' });
  }

  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { title, amount, paidBy, splitType, expenseDate, notes, participants } = parsed.data;

  let splits;
  try {
    splits = calculateSplits(splitType, amount, participants);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    // Delete old splits then create new ones in a transaction
    await prisma.$transaction([
      prisma.expenseSplit.deleteMany({ where: { expenseId } }),
      prisma.expense.update({
        where: { id: expenseId },
        data: {
          title, amount, paidBy, splitType,
          expenseDate: new Date(expenseDate), notes,
          splits: {
            create: splits.map((s) => ({
              userId: s.userId,
              amount: s.amount,
              shareValue: s.shareValue ?? null,
              percentage: s.percentage ?? null,
            })),
          },
        },
      }),
    ]);

    const updated = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        payer: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Update expense error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/groups/:groupId/expenses/:expenseId — Soft delete ────────────

router.delete('/:expenseId', authenticate, async (req, res) => {
  const { groupId, expenseId } = req.params;
  const member = await requireGroupMember(groupId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this group' });

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, groupId, isDeleted: false },
  });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  const isCreator = expense.createdBy === req.user.id;
  const isGroupCreator = group.createdBy === req.user.id;
  if (!isCreator && !isGroupCreator) {
    return res.status(403).json({ error: 'Only the expense creator or group creator can delete this expense' });
  }

  try {
    await prisma.expense.update({ where: { id: expenseId }, data: { isDeleted: true } });
    return res.status(200).json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('Delete expense error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
