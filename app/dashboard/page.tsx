import { prisma } from '@/lib/prisma';
import { DashboardKpiView } from '@/components/dashboard/enterprise/DashboardKpiView';

/**
 * Dashboard principal: KPIs sin carpeta (folderId null). Server Component.
 */
export default async function DashboardPage() {
  const kpis = await prisma.kPI.findMany({
    where: { folderId: null },
    orderBy: { createdAt: 'desc' },
  });

  return <DashboardKpiView kpis={kpis} />;
}
