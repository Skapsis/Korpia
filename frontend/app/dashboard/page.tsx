'use client';

import { Briefcase, Activity, Users } from 'lucide-react';
import { useDashboard } from '@/lib/dashboardContext';

function BigSummaryCard({ title, value, target, headerValue, headerTarget, icon, color, type = 'currency', isBetterHigher = true }: any) {
  let progressPercentage = 0;
  if (headerTarget > 0) progressPercentage = (headerValue / headerTarget) * 100;
  else if (headerTarget === 0 && headerValue === 0) progressPercentage = 100;

  const isSuccess =
    type === 'currency' || isBetterHigher
      ? headerValue >= headerTarget
      : headerValue <= headerTarget;

  const colorMap: any = {
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50', bar: 'bg-indigo-500' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50', bar: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', bar: 'bg-blue-500' },
  };
  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute -right-6 -top-6 p-8 rounded-full ${theme.light} opacity-50 group-hover:scale-110 transition-transform`} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${theme.bg} text-white shadow-lg shadow-slate-100`}>{icon}</div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {isSuccess ? 'Meta Cumplida' : 'Atenci\u00f3n'}
          </span>
        </div>
        <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-slate-900">{value}</span>
          <span className="text-sm text-slate-400 font-medium">/ {target}</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${isSuccess ? theme.bar : 'bg-rose-500'}`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-xs flex justify-between text-slate-400">
          <span>Progreso Actual</span>
          <span className={`font-bold ${isSuccess ? theme.text : 'text-rose-500'}`}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GeneralDashboard() {
  const { data, formatCurrency, handleOpenDetails } = useDashboard();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">📊 Resumen General</h2>
        <p className="text-slate-400 text-sm mt-1">Vista consolidada de todos los indicadores clave</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => handleOpenDetails('sales', 'Cumplimiento Ventas')} className="cursor-pointer transition-transform hover:scale-[1.02]">
          <BigSummaryCard
            title="Cumplimiento Ventas"
            value={formatCurrency(data.comercial.valor_presupuestos.valor)}
            target={formatCurrency(data.comercial.valor_presupuestos.meta)}
            headerValue={data.comercial.valor_presupuestos.valor}
            headerTarget={data.comercial.valor_presupuestos.meta}
            icon={<Briefcase className="w-6 h-6 text-white" />}
            color="indigo"
            type="currency"
          />
        </div>

        <div onClick={() => handleOpenDetails('operations', 'Tiempo Efectivo Global')} className="cursor-pointer transition-transform hover:scale-[1.02]">
          <BigSummaryCard
            title="Tiempo Efectivo Global"
            value={`${data.operaciones.tiempo_efectivo.valor}%`}
            target={`${data.operaciones.tiempo_efectivo.meta}%`}
            headerValue={data.operaciones.tiempo_efectivo.valor}
            headerTarget={data.operaciones.tiempo_efectivo.meta}
            icon={<Activity className="w-6 h-6 text-white" />}
            color="emerald"
            type="percentage"
            isBetterHigher={true}
          />
        </div>

        <div onClick={() => handleOpenDetails('quality', 'NPS (Satisfacci\u00f3n)')} className="cursor-pointer transition-transform hover:scale-[1.02]">
          <BigSummaryCard
            title="NPS (Satisfacci\u00f3n)"
            value={`${data.calidad.nps.valor}%`}
            target={`>${data.calidad.nps.meta}%`}
            headerValue={data.calidad.nps.valor}
            headerTarget={data.calidad.nps.meta}
            icon={<Users className="w-6 h-6 text-white" />}
            color="blue"
            type="percentage"
            isBetterHigher={true}
          />
        </div>
      </div>
    </div>
  );
}
