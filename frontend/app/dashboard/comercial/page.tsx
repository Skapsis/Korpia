'use client';

import KPIDrillDown from '@/components/dashboard/KPIDrillDown';
import { getKPIData } from '@/lib/kpiData';
import { useApp } from '@/lib/appContext';

export default function ComercialDashboard() {
  const { auth } = useApp();
  const kpiData  = getKPIData(auth.empresa);

  return (
    <KPIDrillDown
      kpis={Object.values(kpiData.comercial)}
      title="💰 Comercial"
      subtitle="Contactos efectivos, presupuestos y valor — Periodo"
    />
  );
}
