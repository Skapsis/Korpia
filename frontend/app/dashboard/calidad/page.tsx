'use client';

import KPIDrillDown from '@/components/dashboard/KPIDrillDown';
import { getKPIData } from '@/lib/kpiData';
import { useApp } from '@/lib/appContext';

export default function CalidadDashboard() {
  const { auth } = useApp();
  const kpiData  = getKPIData(auth.empresa);

  return (
    <KPIDrillDown
      kpis={Object.values(kpiData.calidad)}
      title="🛠️ Calidad Técnica"
      subtitle="NPS, cancelación técnica, deficiencias y producto — Periodo"
    />
  );
}
