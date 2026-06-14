/**
 * balanceCalculator.js
 *
 * Pure function that takes raw expense splits and settlements data
 * (already queried from the DB) and returns pairwise balances.
 *
 * No database calls. Inputs are plain JS arrays.
 * This makes it independently testable without Prisma.
 */

/**
 * Round a number to 2 decimal places.
 */
function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate pairwise balances for a group from the current user's perspective.
 *
 * @param {string} currentUserId - The user viewing the balances.
 * @param {string[]} memberIds - All member IDs in the group (excluding currentUser).
 * @param {Array} expenses - Non-deleted expenses with their splits.
 *   Each expense: { id, paidBy, splits: [{ userId, amount }] }
 * @param {Array} settlements - All settlements in the group.
 *   Each settlement: { payerId, receiverId, amount }
 *
 * @returns {{
 *   balances: Array<{ userId: string, youOwe: number, theyOwe: number }>,
 *   userNetBalance: number  // positive = net owed to currentUser, negative = currentUser owes net
 * }}
 */
function calculateGroupBalances(currentUserId, memberIds, expenses, settlements) {
  const result = {};

  // Initialize a bucket for each other member
  for (const memberId of memberIds) {
    if (memberId !== currentUserId) {
      result[memberId] = { raw_you_owe: 0, raw_they_owe: 0 };
    }
  }

  // --- Step 1: Tally raw debts from expense splits ---
  // For each expense, we look at the splits.
  // A split row means: "this user owes `amount` toward this expense."
  // The payer is excluded from owing themselves (skip split where userId === paidBy).

  for (const expense of expenses) {
    const { paidBy, splits } = expense;

    for (const split of splits) {
      // Skip the payer's own split row (they don't owe themselves)
      if (split.userId === paidBy) continue;

      const amount = Number(split.amount);

      if (paidBy === currentUserId && split.userId !== currentUserId) {
        // Someone else owes the current user
        if (result[split.userId] !== undefined) {
          result[split.userId].raw_they_owe = round2(result[split.userId].raw_they_owe + amount);
        }
      } else if (split.userId === currentUserId && paidBy !== currentUserId) {
        // Current user owes someone else
        if (result[paidBy] !== undefined) {
          result[paidBy].raw_you_owe = round2(result[paidBy].raw_you_owe + amount);
        }
      }
      // Splits between two other members don't affect current user's balance
    }
  }

  // --- Step 2: Tally settlements ---
  for (const s of settlements) {
    const amount = Number(s.amount);

    if (s.payerId === currentUserId && result[s.receiverId] !== undefined) {
      // Current user paid someone: reduces what current user owes them
      result[s.receiverId].raw_you_owe = round2(result[s.receiverId].raw_you_owe - amount);
    } else if (s.receiverId === currentUserId && result[s.payerId] !== undefined) {
      // Someone paid current user: reduces what they owe current user
      result[s.payerId].raw_they_owe = round2(result[s.payerId].raw_they_owe - amount);
    }
  }

  // --- Step 3: Compute net per pair ---
  // net = raw_you_owe - raw_they_owe
  // net > 0 → you owe them net
  // net < 0 → they owe you |net|
  // net = 0 → settled

  let userNetBalance = 0;

  const balances = memberIds
    .filter((id) => id !== currentUserId)
    .map((memberId) => {
      const { raw_you_owe, raw_they_owe } = result[memberId] || { raw_you_owe: 0, raw_they_owe: 0 };
      const net = round2(raw_you_owe - raw_they_owe);

      let youOwe = 0;
      let theyOwe = 0;

      if (net > 0) {
        youOwe = net;
        userNetBalance = round2(userNetBalance - net);
      } else if (net < 0) {
        theyOwe = round2(Math.abs(net));
        userNetBalance = round2(userNetBalance + theyOwe);
      }

      return { userId: memberId, youOwe, theyOwe };
    });

  return { balances, userNetBalance };
}

/**
 * Calculate an individual user's total balance across multiple groups.
 * Returns a single net number: positive = owed to user, negative = user owes.
 *
 * @param {Array} groupResults - Array of { groupId, balanceResult } from calculateGroupBalances
 * @returns {{ totalBalance: number, totalOwed: number, totalOwe: number }}
 */
function calculateOverallBalance(groupResults) {
  let totalOwed = 0; // sum of what others owe current user
  let totalOwe = 0;  // sum of what current user owes others

  for (const { balanceResult } of groupResults) {
    for (const b of balanceResult.balances) {
      totalOwed = round2(totalOwed + b.theyOwe);
      totalOwe = round2(totalOwe + b.youOwe);
    }
  }

  return {
    totalBalance: round2(totalOwed - totalOwe),
    totalOwed,
    totalOwe,
  };
}

module.exports = { calculateGroupBalances, calculateOverallBalance };
