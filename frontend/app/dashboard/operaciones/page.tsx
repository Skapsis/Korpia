'use client';

import KPIDrillDown from '@/components/dashboard/KPIDrillDown';
import { getKPIData } from '@/lib/kpiData';
import { useApp } from '@/lib/appContext';

export default function OperacionesDashboard() {
  const { auth } = useApp();
  const kpiData  = getKPIData(auth.empresa);

  return (
    <KPIDrillDown
      kpis={Object.values(kpiData.operaciones)}
      title="⚙️ Operaciones"
      subtitle="Tiempo efectivo, órdenes y cancelaciones — Periodo"
    />
  );
}
