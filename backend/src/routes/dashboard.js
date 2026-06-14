const express = require('express');
const router = express.Router();
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middleware/auth');
const { calculateGroupBalances, calculateOverallBalance } = require('../utils/balanceCalculator');
const { generateActivityFeed, ACTIVITY_TYPES } = require('../utils/activityGenerator');

// ─── GET /api/dashboard ───────────────────────────────────────────────────────

router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. All groups the user is a member of
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: true,
            expenses: { where: { isDeleted: false }, include: { splits: true } },
            settlements: true,
          },
        },
      },
    });

    // 2. Compute per-group balances
    const groupResults = memberships.map(({ group }) => {
      const memberIds = group.members.map((m) => m.userId);
      const balanceResult = calculateGroupBalances(userId, memberIds, group.expenses, group.settlements);
      return { groupId: group.id, groupName: group.name, balanceResult };
    });

    const { totalBalance, totalOwed, totalOwe } = calculateOverallBalance(groupResults);

    const groupBalances = groupResults.map(({ groupId, groupName, balanceResult }) => ({
      groupId,
      groupName,
      balance: balanceResult.userNetBalance,
    }));

    // 3. Recent expenses across all groups (10 most recent)
    const allGroupIds = memberships.map((m) => m.group.id);

    const recentExpenses = await prisma.expense.findMany({
      where: { groupId: { in: allGroupIds }, isDeleted: false },
      include: {
        payer: { select: { id: true, name: true } },
        group: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 4. Recent activity feed — expenses + settlements across all groups
    const recentSettlements = await prisma.settlement.findMany({
      where: { groupId: { in: allGroupIds } },
      include: {
        payer: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        group: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const expenseEvents = recentExpenses.map((e) => ({
      type: ACTIVITY_TYPES.EXPENSE_CREATED,
      actorName: e.payer.name,
      expenseTitle: e.title,
      amount: e.amount,
      groupName: e.group.name,
      createdAt: e.createdAt.toISOString(),
    }));

    const settlementEvents = recentSettlements.map((s) => ({
      type: ACTIVITY_TYPES.SETTLEMENT_CREATED,
      actorName: s.payer.name,
      targetName: s.receiver.name,
      amount: s.amount,
      groupName: s.group.name,
      createdAt: s.createdAt.toISOString(),
    }));

    // Merge and sort by createdAt, take top 10
    const allEvents = [...expenseEvents, ...settlementEvents].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 10);

    const recentActivity = generateActivityFeed(allEvents);

    return res.status(200).json({
      currentUser: { id: req.user.id, name: req.user.name, email: req.user.email },
      totalBalance,
      totalOwed,
      totalOwe,
      recentExpenses: recentExpenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        groupName: e.group.name,
        paidByName: e.payer.name,
        expenseDate: e.expenseDate,
      })),
      groupBalances,
      recentActivity,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
