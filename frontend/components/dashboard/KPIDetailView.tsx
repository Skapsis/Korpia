'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import type { KPIItem } from '@/lib/kpiData';
import {
  formatValue, formatValueFull, isSuccess, getProgress,
  SUCCESS_COLOR, FAIL_COLOR, META_COLOR, BAR_COLOR,
} from '@/lib/kpiHelpers';

// ── Custom Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, unidad }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-semibold" style={{ color: p.color }}>
            {formatValueFull(p.value, unidad)}
          </span>
        </p>
      ))}
    </div>
  );
};

// ── Props ────────────────────────────────────────────────────────────────────
interface KPIDetailViewProps {
  kpi: KPIItem;
  onBack: () => void;
}

export default function KPIDetailView({ kpi, onBack }: KPIDetailViewProps) {
  const [showMeta, setShowMeta] = useState(true);
  const ok = isSuccess(kpi.logrado_total, kpi.meta_total, kpi.unidad);
  const progress = getProgress(kpi.logrado_total, kpi.meta_total, kpi.unidad);

  return (
    <div className="animate-fadeIn space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{kpi.titulo}</h2>
          <p className="text-slate-400 text-sm mt-0.5">Detalle por semana &mdash; Periodo: Febrero</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {ok ? '✓ Meta Cumplida' : '⚠ Atención'}
        </span>
      </div>

      {/* ── KPI Summary row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Logrado Total', value: formatValueFull(kpi.logrado_total, kpi.unidad), color: ok ? 'text-emerald-600' : 'text-rose-600' },
          { label: 'Meta Total',    value: formatValueFull(kpi.meta_total, kpi.unidad),    color: 'text-slate-700' },
          { label: 'Cumplimiento',  value: `${Math.round(progress)}%`,                     color: ok ? 'text-emerald-600' : 'text-rose-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
            <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-semibold text-slate-800">Evolución Semanal</h3>
          <button
            onClick={() => setShowMeta(!showMeta)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              showMeta
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {showMeta ? 'Ocultar Metas' : 'Mostrar Metas'}
          </button>
        </div>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kpi.semanas} barGap={6} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={8} />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  kpi.unidad === 'moneda' ? `$${(v / 1_000_000).toFixed(0)}M` : String(v)
                }
              />
              <Tooltip content={<ChartTooltip unidad={kpi.unidad} />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              />
              <Bar dataKey="logrado" name="Logrado" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {kpi.semanas.map((s, i) => (
                  <Cell
                    key={i}
                    fill={isSuccess(s.logrado, s.meta, kpi.unidad) ? BAR_COLOR : FAIL_COLOR}
                  />
                ))}
              </Bar>
              {showMeta && (
                <Bar
                  dataKey="meta"
                  name="Meta"
                  fill={META_COLOR}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={56}
                  opacity={0.45}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Detalle por Semana</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                {['Semana', 'Logrado', 'Meta', 'Diferencia', 'Cumplimiento'].map((col) => (
                  <th key={col} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kpi.semanas.map((s, i) => {
                const rowOk   = isSuccess(s.logrado, s.meta, kpi.unidad);
                const diff    = s.logrado - s.meta;
                const cumpl   = s.meta === 0
                  ? s.logrado === 0 ? 100 : 0
                  : Math.round((s.logrado / s.meta) * 100);
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{s.name}</td>
                    <td className={`px-6 py-4 font-bold ${rowOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatValueFull(s.logrado, kpi.unidad)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatValueFull(s.meta, kpi.unidad)}</td>
                    <td className={`px-6 py-4 font-medium ${diff >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {diff > 0 ? '+' : ''}{formatValueFull(diff, kpi.unidad)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        rowOk ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {cumpl}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
