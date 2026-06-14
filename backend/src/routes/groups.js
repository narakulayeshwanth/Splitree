const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');
const { calculateGroupBalances } = require('../utils/balanceCalculator');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Verify the requesting user is a member of the group. Returns the group or null. */
async function requireGroupMember(groupId, userId) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return membership;
}

/** Verify the requesting user is the group creator. */
async function requireGroupCreator(groupId, userId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return null;
  if (group.createdBy !== userId) return null;
  return group;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional().nullable(),
});

// ─── POST /api/groups — Create group ─────────────────────────────────────────

router.post('/', authenticate, async (req, res) => {
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { name, description } = parsed.data;
  try {
    const group = await prisma.group.create({
      data: {
        name,
        description,
        createdBy: req.user.id,
        members: { create: [{ userId: req.user.id }] },
      },
    });
    return res.status(201).json(group);
  } catch (err) {
    console.error('Create group error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/groups — List user's groups ────────────────────────────────────

router.get('/', authenticate, async (req, res) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.user.id },
      include: {
        group: {
          include: { _count: { select: { members: true } } },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      memberCount: m.group._count.members,
    }));

    return res.status(200).json(groups);
  } catch (err) {
    console.error('List groups error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/groups/:id — Group detail ──────────────────────────────────────

router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const member = await requireGroupMember(id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this group' });

  try {
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const response = {
      ...group,
      members: group.members.map((m) => ({
        ...m.user,
        joinedAt: m.joinedAt,
      })),
    };
    return res.status(200).json(response);
  } catch (err) {
    console.error('Get group error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/groups/:id — Update group (creator only) ───────────────────────

router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const group = await requireGroupCreator(id, req.user.id);
  if (!group) return res.status(403).json({ error: 'Only the group creator can update this group' });

  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  try {
    const updated = await prisma.group.update({
      where: { id },
      data: { name: parsed.data.name, description: parsed.data.description },
    });
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Update group error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/groups/:id — Delete group (creator only) ────────────────────

router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const group = await requireGroupCreator(id, req.user.id);
  if (!group) return res.status(403).json({ error: 'Only the group creator can delete this group' });

  try {
    await prisma.group.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('Delete group error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/groups/:id/members — Add member by email ──────────────────────

router.post('/:id/members', authenticate, async (req, res) => {
  const { id } = req.params;
  const member = await requireGroupMember(id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this group' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  try {
    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found. They must register first.' });

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: userToAdd.id } },
    });
    if (existing) return res.status(409).json({ error: 'User is already a member of this group' });

    await prisma.groupMember.create({ data: { groupId: id, userId: userToAdd.id } });
    return res.status(201).json({
      message: 'Member added',
      user: { id: userToAdd.id, name: userToAdd.name, email: userToAdd.email },
    });
  } catch (err) {
    console.error('Add member error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/groups/:id/members/:userId — Remove member or leave ─────────

router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  const { id: groupId, userId: targetUserId } = req.params;
  const requesterId = req.user.id;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const isCreator = group.createdBy === requesterId;
  const isSelf = requesterId === targetUserId;

  // Creator removing someone else: allowed
  // Member removing themselves (leave): allowed only if balance = 0
  // Anyone else trying to remove another member: forbidden
  if (!isCreator && !isSelf) {
    return res.status(403).json({ error: 'Only the group creator can remove other members' });
  }

  // If leaving (self), check balance is 0
  if (isSelf && !isCreator) {
    const allMembers = await prisma.groupMember.findMany({ where: { groupId } });
    const memberIds = allMembers.map((m) => m.userId);

    const expenses = await prisma.expense.findMany({
      where: { groupId, isDeleted: false },
      include: { splits: true },
    });
    const settlements = await prisma.settlement.findMany({ where: { groupId } });

    const { userNetBalance } = calculateGroupBalances(requesterId, memberIds, expenses, settlements);

    if (userNetBalance !== 0) {
      return res.status(400).json({
        error: `Cannot leave with an outstanding balance of ₹${Math.abs(userNetBalance).toFixed(2)}. Please settle all debts first.`,
      });
    }
  }

  try {
    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    return res.status(200).json({ message: isSelf ? 'You have left the group' : 'Member removed' });
  } catch (err) {
    console.error('Remove member error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/groups/:id/balances — Pairwise balances ────────────────────────

router.get('/:id/balances', authenticate, async (req, res) => {
  const { id: groupId } = req.params;
  const member = await requireGroupMember(groupId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this group' });

  try {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true } } },
    });
    const memberIds = allMembers.map((m) => m.userId);

    const expenses = await prisma.expense.findMany({
      where: { groupId, isDeleted: false },
      include: { splits: true },
    });

    const settlements = await prisma.settlement.findMany({ where: { groupId } });

    const { balances, userNetBalance } = calculateGroupBalances(
      req.user.id,
      memberIds,
      expenses,
      settlements
    );

    // Attach names to balances
    const memberMap = {};
    allMembers.forEach((m) => { memberMap[m.userId] = m.user.name; });

    const namedBalances = balances
      .filter((b) => b.youOwe > 0 || b.theyOwe > 0)
      .map((b) => ({ ...b, userName: memberMap[b.userId] || 'Unknown' }));

    return res.status(200).json({ userBalance: userNetBalance, balances: namedBalances });
  } catch (err) {
    console.error('Get balances error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
