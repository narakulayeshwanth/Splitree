const { PrismaClient } = require('@prisma/client');

// Singleton Prisma client — reuses one connection across the app
const prisma = new PrismaClient();

module.exports = prisma;
