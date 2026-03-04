import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardKpiView } from '@/components/dashboard/enterprise/DashboardKpiView';

/**
 * Vista de una carpeta: KPIs con folderId = id. Server Component.
 */
export default async function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const folder = await prisma.folder.findUnique({
    where: { id },
    include: { kpis: true },
  });

  if (!folder) notFound();

  const kpis = folder.kpis.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return <DashboardKpiView kpis={kpis} title={folder.name} />;
}
