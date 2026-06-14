const express = require('express');
const router = express.Router({ mergeParams: true });
const { z } = require('zod');
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');

// ─── Validation ───────────────────────────────────────────────────────────────

const settlementSchema = z.object({
  payerId: z.string().uuid(),
  receiverId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  settlementDate: z.string(),
  notes: z.string().optional().nullable(),
});

// ─── POST /api/groups/:groupId/settlements ────────────────────────────────────

router.post('/', authenticate, async (req, res) => {
  const { groupId } = req.params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user.id } },
  });
  if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

  const parsed = settlementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { payerId, receiverId, amount, settlementDate, notes } = parsed.data;

  if (payerId === receiverId) {
    return res.status(400).json({ error: 'Payer and receiver cannot be the same person' });
  }

  try {
    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        payerId,
        receiverId,
        amount,
        settlementDate: new Date(settlementDate),
        notes,
      },
      include: {
        payer: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });
    return res.status(201).json(settlement);
  } catch (err) {
    console.error('Create settlement error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/groups/:groupId/settlements ─────────────────────────────────────

router.get('/', authenticate, async (req, res) => {
  const { groupId } = req.params;

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user.id } },
  });
  if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

  try {
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        payer: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(settlements);
  } catch (err) {
    console.error('List settlements error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
