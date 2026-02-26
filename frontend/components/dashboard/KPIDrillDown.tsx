'use client';

import { useState } from 'react';
import type { KPIItem } from '@/lib/kpiData';
import { useApp } from '@/lib/appContext';
import { getKPIFiltered } from '@/lib/kpiHelpers';
import KPISimpleCard from './KPISimpleCard';
import KPIDetailView from './KPIDetailView';

interface KPIDrillDownProps {
  kpis: KPIItem[];
  title: string;
  subtitle: string;
}

export default function KPIDrillDown({ kpis, title, subtitle }: KPIDrillDownProps) {
  const [selected, setSelected] = useState<KPIItem | null>(null);
  const { filtroSemana } = useApp();

  // Aplicar filtro de semana a cada KPI
  const filteredKpis = kpis.map((kpi) => getKPIFiltered(kpi, filtroSemana));

  // Al seleccionar, también aplicar el filtro al KPI de detalle
  const selectedFiltered = selected ? getKPIFiltered(selected, filtroSemana) : null;

  // Etiqueta de periodo para subtítulo
  const periodoLabel = filtroSemana === 'Todas' ? 'Todas las semanas' : filtroSemana;

  return (
    <div>
      {selectedFiltered === null ? (
        /* ── Vista Maestra ── */
        <div className="animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-slate-400 text-sm mt-1">
              {subtitle} &mdash; <span className="font-semibold text-indigo-500">{periodoLabel}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKpis.map((kpi) => (
              <KPISimpleCard
                key={kpi.titulo}
                kpi={kpi}
                onClick={(clicked) => setSelected(kpis.find((k) => k.titulo === clicked.titulo) ?? clicked)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ── Vista Detalle ── */
        <KPIDetailView kpi={selectedFiltered} onBack={() => setSelected(null)} />
      )}
    </div>
  );
}

