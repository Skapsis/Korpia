import { prisma } from '@/lib/prisma';
import { AnalyticsDashboard } from '@/components/dashboard/studio/AnalyticsDashboard';

/** Analytics / Report Detail: datos desde Prisma, pasado al cliente como initialData. */
export default async function AnalyticsPage() {
  const raw = await prisma.financialRecord.findMany({
    orderBy: { date: 'asc' },
  });
  const initialData = raw.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    revenue: r.revenue,
    target: r.target,
    region: r.region,
    product: r.product,
  }));
  return <AnalyticsDashboard initialData={initialData} />;
}
