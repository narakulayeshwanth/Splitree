/**
 * tests/expenses.test.js
 *
 * Unit tests for splitCalculator.js — pure functions, no DB required.
 * Run with: npm test
 */

const {
  splitEqual,
  splitUnequal,
  splitPercentage,
  splitByShare,
  calculateSplits,
} = require('../src/utils/splitCalculator');

// ─── EQUAL split ──────────────────────────────────────────────────────────────

describe('EQUAL split', () => {
  test('$90 among 3 users — each gets $30.00', () => {
    const result = splitEqual(90, ['u1', 'u2', 'u3']);
    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(30);
    expect(result[1].amount).toBe(30);
    expect(result[2].amount).toBe(30);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBeCloseTo(90, 2);
  });

  test('$10 among 3 users — rounding remainder on last participant', () => {
    const result = splitEqual(10, ['u1', 'u2', 'u3']);
    expect(result[0].amount).toBe(3.33);
    expect(result[1].amount).toBe(3.33);
    expect(result[2].amount).toBe(3.34);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBeCloseTo(10, 2);
  });
});

// ─── UNEQUAL split ────────────────────────────────────────────────────────────

describe('UNEQUAL split', () => {
  test('amounts that sum to total — accepted as-is', () => {
    const result = splitUnequal(100, [
      { userId: 'u1', amount: 60 },
      { userId: 'u2', amount: 40 },
    ]);
    expect(result[0].amount).toBe(60);
    expect(result[1].amount).toBe(40);
  });

  test('amounts that do NOT sum to total — throws validation error', () => {
    expect(() =>
      splitUnequal(100, [
        { userId: 'u1', amount: 60 },
        { userId: 'u2', amount: 30 }, // sum = 90, not 100
      ])
    ).toThrow(/do not equal total amount/);
  });
});

// ─── PERCENTAGE split ─────────────────────────────────────────────────────────

describe('PERCENTAGE split', () => {
  test('percentages that sum to 100 — computed amounts correct', () => {
    const result = splitPercentage(200, [
      { userId: 'u1', percentage: 50 },
      { userId: 'u2', percentage: 50 },
    ]);
    expect(result[0].amount).toBe(100);
    expect(result[1].amount).toBe(100);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBeCloseTo(200, 2);
  });

  test('percentages that do NOT sum to 100 — throws validation error', () => {
    expect(() =>
      splitPercentage(200, [
        { userId: 'u1', percentage: 40 },
        { userId: 'u2', percentage: 40 }, // sum = 80, not 100
      ])
    ).toThrow(/do not sum to 100/);
  });
});

// ─── SHARE split ──────────────────────────────────────────────────────────────

describe('SHARE split', () => {
  test('2 shares + 1 share on $30 — $20 and $10', () => {
    const result = splitByShare(30, [
      { userId: 'u1', shareValue: 2 },
      { userId: 'u2', shareValue: 1 },
    ]);
    expect(result[0].amount).toBe(20);
    expect(result[1].amount).toBe(10);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBeCloseTo(30, 2);
  });

  test('zero share value — throws "at least 1 share" error', () => {
    expect(() =>
      splitByShare(30, [
        { userId: 'u1', shareValue: 0 },
        { userId: 'u2', shareValue: 1 },
      ])
    ).toThrow(/at least 1 share/);
  });
});

// ─── calculateSplits dispatcher ───────────────────────────────────────────────

describe('calculateSplits dispatcher', () => {
  test('invalid split type — throws error', () => {
    expect(() =>
      calculateSplits('INVALID', 100, [{ userId: 'u1' }])
    ).toThrow(/Unknown split type/);
  });

  test('amount <= 0 — throws error', () => {
    expect(() =>
      calculateSplits('EQUAL', 0, [{ userId: 'u1' }])
    ).toThrow(/greater than 0/);
  });
});
