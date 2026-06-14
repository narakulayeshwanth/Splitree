/**
 * splitCalculator.js
 *
 * Pure functions for computing expense splits.
 * No database calls. All inputs are plain numbers/arrays.
 * All amounts returned as numbers rounded to 2 decimal places.
 * Any rounding remainder is added to the LAST participant's amount
 * to ensure the total always equals the expense amount exactly.
 */

/**
 * Round a number to 2 decimal places.
 */
function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * EQUAL split — divide amount equally among all participants.
 * Rounding remainder goes to the last participant.
 *
 * @param {number} totalAmount
 * @param {string[]} participantIds
 * @returns {{ userId: string, amount: number }[]}
 */
function splitEqual(totalAmount, participantIds) {
  if (!participantIds || participantIds.length === 0) {
    throw new Error('At least one participant is required');
  }
  const n = participantIds.length;
  const baseAmount = round2(Math.floor((totalAmount / n) * 100) / 100);
  const sumOfBase = round2(baseAmount * n);
  const remainder = round2(totalAmount - sumOfBase);

  return participantIds.map((userId, i) => ({
    userId,
    amount: i === n - 1 ? round2(baseAmount + remainder) : baseAmount,
  }));
}

/**
 * UNEQUAL split — each participant has a manually specified amount.
 * Validates that amounts sum to totalAmount (within 0.01 tolerance).
 *
 * @param {number} totalAmount
 * @param {{ userId: string, amount: number }[]} participants
 * @returns {{ userId: string, amount: number }[]}
 */
function splitUnequal(totalAmount, participants) {
  if (!participants || participants.length === 0) {
    throw new Error('At least one participant is required');
  }
  const sum = round2(participants.reduce((acc, p) => acc + p.amount, 0));
  if (Math.abs(sum - totalAmount) > 0.01) {
    throw new Error(
      `Split amounts (${sum}) do not equal total amount (${totalAmount})`
    );
  }
  return participants.map((p) => ({ userId: p.userId, amount: round2(p.amount) }));
}

/**
 * PERCENTAGE split — each participant has a percentage share.
 * Validates that percentages sum to 100 (within 0.01 tolerance).
 * Computes amount = (percentage / 100) * totalAmount.
 * Rounding remainder goes to the last participant.
 *
 * @param {number} totalAmount
 * @param {{ userId: string, percentage: number }[]} participants
 * @returns {{ userId: string, amount: number, percentage: number }[]}
 */
function splitPercentage(totalAmount, participants) {
  if (!participants || participants.length === 0) {
    throw new Error('At least one participant is required');
  }
  const sumPct = round2(participants.reduce((acc, p) => acc + p.percentage, 0));
  if (Math.abs(sumPct - 100) > 0.01) {
    throw new Error(
      `Percentages (${sumPct}) do not sum to 100`
    );
  }

  const splits = participants.map((p) => ({
    userId: p.userId,
    percentage: p.percentage,
    amount: round2((p.percentage / 100) * totalAmount),
  }));

  // Fix rounding drift on last participant
  const computedSum = round2(splits.reduce((acc, s) => acc + s.amount, 0));
  const drift = round2(totalAmount - computedSum);
  splits[splits.length - 1].amount = round2(splits[splits.length - 1].amount + drift);

  return splits;
}

/**
 * SHARE split — each participant has an integer share unit.
 * Validates each share >= 1.
 * Computes amount = (shares / totalShares) * totalAmount.
 * Rounding remainder goes to the last participant.
 *
 * @param {number} totalAmount
 * @param {{ userId: string, shareValue: number }[]} participants
 * @returns {{ userId: string, amount: number, shareValue: number }[]}
 */
function splitByShare(totalAmount, participants) {
  if (!participants || participants.length === 0) {
    throw new Error('At least one participant is required');
  }
  for (const p of participants) {
    if (!p.shareValue || p.shareValue < 1) {
      throw new Error(`Each participant must have at least 1 share (got ${p.shareValue})`);
    }
  }
  const totalShares = participants.reduce((acc, p) => acc + p.shareValue, 0);

  const splits = participants.map((p) => ({
    userId: p.userId,
    shareValue: p.shareValue,
    amount: round2((p.shareValue / totalShares) * totalAmount),
  }));

  // Fix rounding drift on last participant
  const computedSum = round2(splits.reduce((acc, s) => acc + s.amount, 0));
  const drift = round2(totalAmount - computedSum);
  splits[splits.length - 1].amount = round2(splits[splits.length - 1].amount + drift);

  return splits;
}

/**
 * Main entry point. Dispatch to the correct split function.
 *
 * @param {'EQUAL'|'UNEQUAL'|'PERCENTAGE'|'SHARE'} splitType
 * @param {number} totalAmount
 * @param {object[]} participants
 * @returns {object[]}
 */
function calculateSplits(splitType, totalAmount, participants) {
  if (totalAmount <= 0) {
    throw new Error('Expense amount must be greater than 0');
  }
  if (!participants || participants.length < 1) {
    throw new Error('Expense must have at least 1 participant');
  }

  switch (splitType) {
    case 'EQUAL':
      return splitEqual(
        totalAmount,
        participants.map((p) => p.userId)
      );
    case 'UNEQUAL':
      return splitUnequal(totalAmount, participants);
    case 'PERCENTAGE':
      return splitPercentage(totalAmount, participants);
    case 'SHARE':
      return splitByShare(totalAmount, participants);
    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }
}

module.exports = { calculateSplits, splitEqual, splitUnequal, splitPercentage, splitByShare };
