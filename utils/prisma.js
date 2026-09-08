const { PrismaClient } = require('@prisma/client');

// Reused across hot-reloads in dev so we never open more than one pool.
const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

module.exports = prisma;
