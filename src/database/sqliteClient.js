/**
 * Shared SQLite database connection using better-sqlite3.
 * Usage: const db = require('./sqliteClient');
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../prisma/dev.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
