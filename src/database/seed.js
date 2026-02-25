/**
 * Seed script: Creates initial companies and admin user using better-sqlite3 directly.
 * Run with: node src/database/seed.js
 */
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../prisma/dev.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent write performance
db.pragma('journal_mode = WAL');

function createTables() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS Company (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            createdAt TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS User (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'viewer',
            companyId TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (companyId) REFERENCES Company(id)
        );

        CREATE TABLE IF NOT EXISTS CommercialKPI (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            period TEXT NOT NULL,
            potenciales INTEGER NOT NULL DEFAULT 0,
            presupuestos INTEGER NOT NULL DEFAULT 0,
            monto REAL NOT NULL DEFAULT 0,
            cumplimiento REAL NOT NULL DEFAULT 0,
            companyId TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now')),
            uploadedAt TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (companyId) REFERENCES Company(id)
        );

        CREATE TABLE IF NOT EXISTS OperationKPI (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            period TEXT NOT NULL,
            tiempoEfectivo REAL NOT NULL DEFAULT 0,
            ordenesProgramadas INTEGER NOT NULL DEFAULT 0,
            ordenesEjecutadas INTEGER NOT NULL DEFAULT 0,
            cancelaciones INTEGER NOT NULL DEFAULT 0,
            companyId TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now')),
            uploadedAt TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (companyId) REFERENCES Company(id)
        );

        CREATE TABLE IF NOT EXISTS QualityKPI (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            period TEXT NOT NULL,
            nps REAL NOT NULL DEFAULT 0,
            cancelacionesTecnicas INTEGER NOT NULL DEFAULT 0,
            deficiencias INTEGER NOT NULL DEFAULT 0,
            satisfaccion REAL NOT NULL DEFAULT 0,
            companyId TEXT NOT NULL,
            createdAt TEXT DEFAULT (datetime('now')),
            uploadedAt TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (companyId) REFERENCES Company(id)
        );
    `);
    console.log('✅ Tables created/verified');
}

function upsertCompany(name, slug) {
    const existing = db.prepare('SELECT id FROM Company WHERE slug = ?').get(slug);
    if (existing) return existing.id;
    const id = require('crypto').randomUUID();
    db.prepare('INSERT INTO Company (id, name, slug) VALUES (?, ?, ?)').run(id, name, slug);
    return id;
}

async function main() {
    console.log('🌱 Seeding database...');
    createTables();

    const solvexId = upsertCompany('SOLVEX', 'solvex');
    const elMejorId = upsertCompany('EL MEJOR', 'el-mejor');
    console.log(`✅ Companies: SOLVEX (${solvexId}), EL MEJOR (${elMejorId})`);

    // Create or update admin user
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get('admin@solvex.com');
    if (!existingUser) {
        db.prepare('INSERT INTO User (id, email, password, name, role, companyId) VALUES (?, ?, ?, ?, ?, ?)')
            .run(require('crypto').randomUUID(), 'admin@solvex.com', hashedPassword, 'Admin User', 'admin', solvexId);
    }
    console.log('✅ Admin user: admin@solvex.com');

    // Seed KPI data
    const periods = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2'];

    // Clear existing seed data
    db.prepare('DELETE FROM CommercialKPI WHERE companyId = ?').run(solvexId);
    db.prepare('DELETE FROM OperationKPI WHERE companyId = ?').run(solvexId);
    db.prepare('DELETE FROM QualityKPI WHERE companyId = ?').run(solvexId);

    const insertComm = db.prepare('INSERT INTO CommercialKPI (id, companyId, period, potenciales, presupuestos, monto, cumplimiento) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertOp = db.prepare('INSERT INTO OperationKPI (id, companyId, period, tiempoEfectivo, ordenesProgramadas, ordenesEjecutadas, cancelaciones) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertQual = db.prepare('INSERT INTO QualityKPI (id, companyId, period, nps, cancelacionesTecnicas, deficiencias, satisfaccion) VALUES (?, ?, ?, ?, ?, ?, ?)');

    for (const period of periods) {
        insertComm.run(
            require('crypto').randomUUID(), solvexId, period,
            Math.floor(Math.random() * 30) + 70,
            Math.floor(Math.random() * 20) + 60,
            Math.floor(Math.random() * 200000) + 350000,
            (Math.random() * 20 + 75).toFixed(2)
        );
        insertOp.run(
            require('crypto').randomUUID(), solvexId, period,
            (Math.random() * 15 + 80).toFixed(2),
            Math.floor(Math.random() * 50) + 100,
            Math.floor(Math.random() * 45) + 95,
            Math.floor(Math.random() * 10) + 2
        );
        insertQual.run(
            require('crypto').randomUUID(), solvexId, period,
            (Math.random() * 30 + 55).toFixed(2),
            Math.floor(Math.random() * 12) + 3,
            Math.floor(Math.random() * 5) + 1,
            (Math.random() * 15 + 80).toFixed(2)
        );
    }

    console.log(`✅ Seeded KPI data for ${periods.length} periods`);
    console.log('🎉 Seed complete!');
    db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
