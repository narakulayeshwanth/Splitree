require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║           REGISTERED USERS IN DATABASE              ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.name}`);
    console.log(`     Email   : ${u.email}`);
    console.log(`     Password: password123`);
    console.log(`     Joined  : ${new Date(u.createdAt).toLocaleString('en-IN')}\n`);
  });
  console.log(`  Total: ${users.length} users\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
