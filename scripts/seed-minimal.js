/**
 * Seed mínimo: una empresa y un tablero para que el dashboard cargue.
 * Ejecutar: node scripts/seed-minimal.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let company = await prisma.company.findFirst();
  if (company) {
    console.log('✅ Ya existe empresa:', company.name);
    return;
  }
  company = await prisma.company.create({
    data: { name: 'SOLVEX', slug: 'solvex' },
  });
  console.log('✅ Empresa creada:', company.name);

  const tablero = await prisma.tablero.create({
    data: {
      empresaId: company.id,
      nombre: 'Comercial',
      icono: '📊',
      orden: 0,
    },
  });
  console.log('✅ Tablero creado:', tablero.nombre);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
