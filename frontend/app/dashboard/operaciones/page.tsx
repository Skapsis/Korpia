'use client';

import KPIDrillDown from '@/components/dashboard/KPIDrillDown';
import { useApp } from '@/lib/appContext';
import { useKPIDefinitions } from '@/lib/useKPIDefinitions';
import { SkeletonKPI } from '@/components/SkeletonLoader';
import type { KPIItem } from '@/lib/kpiData';

export default function OperacionesDashboard() {
  const { auth } = useApp();
  const { byArea, isLoading, isError } = useKPIDefinitions(auth.empresa);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400 text-sm animate-pulse">
          Cargando tablero para {auth.empresa ?? 'empresa'}...
        </p>
        <SkeletonKPI />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-500">
        <p className="text-base font-medium">Error al cargar los datos de operaciones.</p>
      </div>
    );
  }

  const kpis = byArea('operaciones') as unknown as KPIItem[];

  if (kpis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p className="text-4xl mb-3">⚙️</p>
        <p className="font-semibold text-slate-600">Sin indicadores de operaciones configurados</p>
        <p className="text-sm mt-1">Un administrador puede agregar KPIs desde ⚙️ Configuración / Admin.</p>
      </div>
    );
  }

  return (
    <KPIDrillDown
      kpis={kpis}
      title="⚙️ Operaciones"
      subtitle="Tiempo efectivo, órdenes y cancelaciones — Periodo"
    />
  );
}
