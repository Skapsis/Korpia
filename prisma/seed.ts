import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REGIONS = ['North', 'EMEA', 'APAC'];
const PRODUCTS = ['A', 'B', 'C'];

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

/** 12 registros (uno por mes del año actual) con revenue/target realistas para gráficos. */
async function main() {
  console.log('🌱 Limpiando tabla FinancialRecord...');
  await prisma.financialRecord.deleteMany({});

  const year = new Date().getFullYear();
  const records: { date: Date; revenue: number; target: number; region: string; product: string }[] = [];

  for (let month = 1; month <= 12; month++) {
    const date = new Date(year, month - 1, 15);
    const base = 100000 + month * 5000;
    const revenue = randomBetween(base - 15000, base + 20000);
    const target = randomBetween(base - 10000, base + 10000);
    const region = REGIONS[month % REGIONS.length];
    const product = PRODUCTS[month % PRODUCTS.length];
    records.push({ date, revenue, target, region, product });
  }

  console.log('🌱 Insertando 12 registros de FinancialRecord...');
  for (const r of records) {
    await prisma.financialRecord.create({
      data: {
        date: r.date,
        revenue: r.revenue,
        target: r.target,
        region: r.region,
        product: r.product,
      },
    });
  }

  console.log('✅ Seed completado: 12 registros de ventas insertados.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
