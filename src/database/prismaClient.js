/**
 * Shared Prisma client using the better-sqlite3 driver adapter for Prisma 7 (local dev).
 * Usage: const prisma = require('./prismaClient');
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../prisma/dev.db');
const adapter = new PrismaBetterSqlite3(dbPath);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
