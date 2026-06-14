/**
 * prisma/seed.js
 *
 * Demo seed data for evaluators.
 * Creates 3 users, 1 group, and sample expenses across all 4 split types.
 *
 * Run with: npm run seed
 * Or:       node prisma/seed.js
 *
 * Demo credentials:
 *   alice@test.com   / password123
 *   bob@test.com     / password123
 *   charlie@test.com / password123
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── Users ──────────────────────────────────────────────────────────────────
  const alice = await prisma.user.upsert({
    where: { email: 'alice@test.com' },
    update: {},
    create: { name: 'Alice', email: 'alice@test.com', passwordHash },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@test.com' },
    update: {},
    create: { name: 'Bob', email: 'bob@test.com', passwordHash },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@test.com' },
    update: {},
    create: { name: 'Charlie', email: 'charlie@test.com', passwordHash },
  });

  console.log(`✅ Users: Alice (${alice.id}), Bob (${bob.id}), Charlie (${charlie.id})`);

  // ─── Group ──────────────────────────────────────────────────────────────────
  const group = await prisma.group.create({
    data: {
      name: 'Goa Trip',
      description: 'Weekend trip to Goa — April 2024',
      createdBy: alice.id,
      members: {
        create: [
          { userId: alice.id },
          { userId: bob.id },
          { userId: charlie.id },
        ],
      },
    },
  });

  console.log(`✅ Group: Goa Trip (${group.id})`);

  // ─── Expense 1: EQUAL split ─────────────────────────────────────────────────
  // Alice pays ₹900 for hotel, split equally among all 3
  const hotelExpense = await prisma.expense.create({
    data: {
      title: 'Hotel Stay',
      amount: 900,
      paidBy: alice.id,
      createdBy: alice.id,
      splitType: 'EQUAL',
      expenseDate: new Date('2024-04-20'),
      notes: '2 nights at Alila Diwa',
      groupId: group.id,
      splits: {
        create: [
          { userId: alice.id, amount: 300 },
          { userId: bob.id, amount: 300 },
          { userId: charlie.id, amount: 300 },
        ],
      },
    },
  });

  console.log(`✅ Expense 1 (EQUAL): Hotel Stay ₹900 (${hotelExpense.id})`);

  // ─── Expense 2: PERCENTAGE split ────────────────────────────────────────────
  // Bob pays ₹1200 for flights; Alice 50%, Bob 30%, Charlie 20%
  const flightExpense = await prisma.expense.create({
    data: {
      title: 'Flights',
      amount: 1200,
      paidBy: bob.id,
      createdBy: bob.id,
      splitType: 'PERCENTAGE',
      expenseDate: new Date('2024-04-19'),
      groupId: group.id,
      splits: {
        create: [
          { userId: alice.id, amount: 600, percentage: 50 },
          { userId: bob.id, amount: 360, percentage: 30 },
          { userId: charlie.id, amount: 240, percentage: 20 },
        ],
      },
    },
  });

  console.log(`✅ Expense 2 (PERCENTAGE): Flights ₹1200 (${flightExpense.id})`);

  // ─── Expense 3: SHARE split ─────────────────────────────────────────────────
  // Charlie pays ₹600 for food; Alice 3 shares, Bob 2 shares, Charlie 1 share
  const foodExpense = await prisma.expense.create({
    data: {
      title: 'Beach BBQ',
      amount: 600,
      paidBy: charlie.id,
      createdBy: charlie.id,
      splitType: 'SHARE',
      expenseDate: new Date('2024-04-21'),
      groupId: group.id,
      splits: {
        create: [
          { userId: alice.id, amount: 300, shareValue: 3 },   // 3/6 * 600
          { userId: bob.id, amount: 200, shareValue: 2 },     // 2/6 * 600
          { userId: charlie.id, amount: 100, shareValue: 1 }, // 1/6 * 600
        ],
      },
    },
  });

  console.log(`✅ Expense 3 (SHARE): Beach BBQ ₹600 (${foodExpense.id})`);

  // ─── Expense 4: UNEQUAL split ───────────────────────────────────────────────
  // Alice pays ₹500 for activities; Bob owes ₹300, Charlie owes ₹200
  const activityExpense = await prisma.expense.create({
    data: {
      title: 'Water Sports',
      amount: 500,
      paidBy: alice.id,
      createdBy: alice.id,
      splitType: 'UNEQUAL',
      expenseDate: new Date('2024-04-21'),
      groupId: group.id,
      splits: {
        create: [
          { userId: alice.id, amount: 0 },     // Alice doesn't owe herself
          { userId: bob.id, amount: 300 },
          { userId: charlie.id, amount: 200 },
        ],
      },
    },
  });

  console.log(`✅ Expense 4 (UNEQUAL): Water Sports ₹500 (${activityExpense.id})`);

  // ─── Settlement ─────────────────────────────────────────────────────────────
  // Bob settles ₹200 with Alice
  const settlement = await prisma.settlement.create({
    data: {
      groupId: group.id,
      payerId: bob.id,
      receiverId: alice.id,
      amount: 200,
      settlementDate: new Date('2024-04-22'),
      notes: 'Partial payment via UPI',
    },
  });

  console.log(`✅ Settlement: Bob → Alice ₹200 (${settlement.id})`);

  // ─── Comment ────────────────────────────────────────────────────────────────
  await prisma.comment.create({
    data: {
      expenseId: hotelExpense.id,
      userId: bob.id,
      text: 'Great hotel! Will settle the rest by end of week.',
    },
  });

  console.log('✅ Comment added to Hotel Stay expense');

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────');
  console.log('Demo credentials:');
  console.log('  alice@test.com   / password123');
  console.log('  bob@test.com     / password123');
  console.log('  charlie@test.com / password123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
