/**
 * Seed script: Creates initial companies and admin user in PostgreSQL.
 * Run with: node src/database/seed.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create companies
    const solvex = await prisma.company.upsert({
        where: { slug: 'solvex' },
        update: {},
        create: { name: 'SOLVEX', slug: 'solvex' }
    });

    const elMejor = await prisma.company.upsert({
        where: { slug: 'el-mejor' },
        update: {},
        create: { name: 'EL MEJOR', slug: 'el-mejor' }
    });

    console.log(`✅ Companies: ${solvex.name}, ${elMejor.name}`);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@solvex.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@solvex.com',
            password: hashedPassword,
            role: 'admin',
            companyId: solvex.id
        }
    });

    console.log(`✅ Admin user: ${admin.email}`);

    // Seed sample KPI data for SOLVEX
    const periods = ['2024-Q3', '2024-Q4', '2025-Q1'];

    for (const period of periods) {
        await prisma.commercialKPI.upsert({
            where: { id: `seed-comm-${solvex.id}-${period}` },
            update: {},
            create: {
                id: `seed-comm-${solvex.id}-${period}`,
                companyId: solvex.id,
                period,
                potenciales: Math.floor(Math.random() * 30) + 70,
                presupuestos: Math.floor(Math.random() * 20) + 60,
                monto: Math.floor(Math.random() * 200000) + 350000,
                cumplimiento: Math.random() * 20 + 75
            }
        });

        await prisma.operationKPI.upsert({
            where: { id: `seed-op-${solvex.id}-${period}` },
            update: {},
            create: {
                id: `seed-op-${solvex.id}-${period}`,
                companyId: solvex.id,
                period,
                tiempoEfectivo: Math.random() * 15 + 80,
                ordenesProgramadas: Math.floor(Math.random() * 50) + 100,
                ordenesEjecutadas: Math.floor(Math.random() * 45) + 95,
                cancelaciones: Math.floor(Math.random() * 10) + 2
            }
        });

        await prisma.qualityKPI.upsert({
            where: { id: `seed-qual-${solvex.id}-${period}` },
            update: {},
            create: {
                id: `seed-qual-${solvex.id}-${period}`,
                companyId: solvex.id,
                period,
                nps: Math.random() * 30 + 55,
                cancelacionesTecnicas: Math.floor(Math.random() * 12) + 3,
                deficiencias: Math.floor(Math.random() * 5) + 1,
                satisfaccion: Math.random() * 15 + 80
            }
        });
    }

    console.log(`✅ Seeded KPI data for ${periods.length} periods`);
    console.log('🎉 Seed complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
