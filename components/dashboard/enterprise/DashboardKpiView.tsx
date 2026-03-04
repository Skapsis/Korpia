'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { deleteKpi } from '@/app/actions/kpiActions';
import { DashboardContent, IndicadorCard } from './DashboardContent';

export interface KpiFromDb {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unitType: string;
  trendDirection: string;
  folderId: string | null;
  createdAt: Date | string;
}

function mapKpiToCard(k: KpiFromDb): IndicadorCard {
  return {
    id: k.id,
    titulo: k.name,
    valor: k.category,
    tendencia: undefined,
    tendenciaUp: k.trendDirection === 'up',
    tipoGrafico: 'bar',
  };
}

export function DashboardKpiView({ kpis, title }: { kpis: KpiFromDb[]; title?: string }) {
  const router = useRouter();
  const cards: IndicadorCard[] = kpis.map(mapKpiToCard);

  const handleDelete = async (id: string) => {
    const result = await deleteKpi(id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success('KPI eliminado');
    router.refresh();
  };

  return (
    <DashboardContent
      indicadores={cards}
      title={title}
      onDelete={handleDelete}
    />
  );
}
