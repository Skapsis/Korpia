'use client';

import KPIDrillDown from '@/components/dashboard/KPIDrillDown';
import { useApp } from '@/lib/appContext';
import { useKPIData } from '@/lib/useKPIData';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function ComercialDashboard() {
  const { auth } = useApp();
  const { kpiData, isLoading, isError, refetch } = useKPIData(auth.empresa);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400 text-sm animate-pulse">
          Cargando tablero para {auth.empresa ?? 'empresa'}...
        </p>
        <SkeletonLoader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-500">
        <p className="text-base font-medium">Error al cargar los datos comerciales.</p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <KPIDrillDown
      kpis={Object.values(kpiData.comercial)}
      title="💰 Comercial"
      subtitle="Contactos efectivos, presupuestos y valor — Periodo"
    />
  );
}
