/**
 * tests/balances.test.js
 *
 * Unit tests for balanceCalculator.js — pure functions, no DB required.
 * Run with: npm test
 */

const { calculateGroupBalances } = require('../src/utils/balanceCalculator');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a mock expense object.
 */
function makeExpense(id, paidBy, splits) {
  return { id, paidBy, splits };
}

/**
 * Build a mock settlement object.
 */
function makeSettlement(payerId, receiverId, amount) {
  return { payerId, receiverId, amount };
}

// ─── Test data ────────────────────────────────────────────────────────────────

const USER_A = 'user-a';
const USER_B = 'user-b';
const USER_C = 'user-c';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('calculateGroupBalances', () => {
  test('A pays $90 equally among A, B, C — B owes A $30, C owes A $30', () => {
    const expenses = [
      makeExpense('e1', USER_A, [
        { userId: USER_A, amount: 30 }, // payer's own row — excluded by calculator
        { userId: USER_B, amount: 30 },
        { userId: USER_C, amount: 30 },
      ]),
    ];

    const { balances, userNetBalance } = calculateGroupBalances(
      USER_A,
      [USER_A, USER_B, USER_C],
      expenses,
      []
    );

    const bBalance = balances.find((b) => b.userId === USER_B);
    const cBalance = balances.find((b) => b.userId === USER_C);

    expect(bBalance.theyOwe).toBe(30);
    expect(bBalance.youOwe).toBe(0);
    expect(cBalance.theyOwe).toBe(30);
    expect(cBalance.youOwe).toBe(0);
    expect(userNetBalance).toBe(60); // A is owed $60 total
  });

  test('After $20 partial settlement from B to A — B owes A $10', () => {
    const expenses = [
      makeExpense('e1', USER_A, [
        { userId: USER_A, amount: 30 },
        { userId: USER_B, amount: 30 },
        { userId: USER_C, amount: 30 },
      ]),
    ];

    const settlements = [makeSettlement(USER_B, USER_A, 20)];

    const { balances } = calculateGroupBalances(
      USER_A,
      [USER_A, USER_B, USER_C],
      expenses,
      settlements
    );

    const bBalance = balances.find((b) => b.userId === USER_B);
    expect(bBalance.theyOwe).toBe(10);
    expect(bBalance.youOwe).toBe(0);
  });

  test('After full settlement — net = 0 for B', () => {
    const expenses = [
      makeExpense('e1', USER_A, [
        { userId: USER_A, amount: 30 },
        { userId: USER_B, amount: 30 },
      ]),
    ];

    const settlements = [makeSettlement(USER_B, USER_A, 30)];

    const { balances } = calculateGroupBalances(
      USER_A,
      [USER_A, USER_B],
      expenses,
      settlements
    );

    const bBalance = balances.find((b) => b.userId === USER_B);
    expect(bBalance.theyOwe).toBe(0);
    expect(bBalance.youOwe).toBe(0);
  });

  test('Soft-deleted expense excluded — balance = 0', () => {
    // balanceCalculator receives pre-filtered expenses (isDeleted=false already filtered by route)
    // So passing empty expenses array simulates deleted expense being excluded
    const { balances, userNetBalance } = calculateGroupBalances(
      USER_A,
      [USER_A, USER_B],
      [], // no active expenses
      []
    );

    const bBalance = balances.find((b) => b.userId === USER_B);
    expect(bBalance.theyOwe).toBe(0);
    expect(bBalance.youOwe).toBe(0);
    expect(userNetBalance).toBe(0);
  });

  test('Partial settlement reduces balance proportionally', () => {
    const expenses = [
      makeExpense('e1', USER_A, [
        { userId: USER_A, amount: 50 },
        { userId: USER_B, amount: 50 },
      ]),
    ];

    const settlements = [makeSettlement(USER_B, USER_A, 20)]; // partial

    const { balances } = calculateGroupBalances(
      USER_A,
      [USER_A, USER_B],
      expenses,
      settlements
    );

    const bBalance = balances.find((b) => b.userId === USER_B);
    expect(bBalance.theyOwe).toBe(30); // 50 - 20 = 30 still owed
    expect(bBalance.youOwe).toBe(0);
  });
});
