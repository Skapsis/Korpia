'use client';

import type { KPIItem } from '@/lib/kpiData';
import { formatValue, isSuccess, getProgress, SUCCESS_COLOR, FAIL_COLOR } from '@/lib/kpiHelpers';

interface KPISimpleCardProps {
  kpi: KPIItem;
  onClick: (kpi: KPIItem) => void;
}

export default function KPISimpleCard({ kpi, onClick }: KPISimpleCardProps) {
  const ok       = isSuccess(kpi.logrado_total, kpi.meta_total, kpi.unidad);
  const progress = getProgress(kpi.logrado_total, kpi.meta_total, kpi.unidad);

  return (
    <button
      type="button"
      onClick={() => onClick(kpi)}
      className={`text-left w-full bg-white rounded-2xl shadow-sm border-t-4 p-5 flex flex-col gap-3
        cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]
        transition-all duration-200 group
        ${ok ? 'border-t-emerald-500' : 'border-t-rose-500'}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-sm font-semibold text-slate-700 leading-snug">{kpi.titulo}</h3>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}
        >
          {ok ? 'Cumplido' : 'Atención'}
        </span>
      </div>

      {/* Main figures */}
      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-black ${ok ? 'text-slate-900' : 'text-rose-600'}`}>
          {formatValue(kpi.logrado_total, kpi.unidad)}
        </span>
        <span className="text-sm text-slate-400 font-medium">
          / {formatValue(kpi.meta_total, kpi.unidad)}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: ok ? SUCCESS_COLOR : FAIL_COLOR }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>Cumplimiento</span>
          <span className={`font-bold ${ok ? 'text-emerald-600' : 'text-rose-500'}`}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-auto pt-1 flex items-center gap-1 text-xs font-semibold text-indigo-500 group-hover:text-indigo-700 transition-colors">
        Ver detalles
        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
