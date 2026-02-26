'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { KPIItem, Unidad } from '@/lib/kpiData';

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(v);

function formatValue(value: number, unidad: Unidad): string {
  if (unidad === 'moneda') return fmtCurrency(value);
  if (unidad === 'porcentaje' || unidad === 'porcentaje_inverso') return `${value}%`;
  return String(value);
}

function isSuccess(logrado: number, meta: number, unidad: Unidad): boolean {
  if (unidad === 'porcentaje_inverso') return logrado <= meta;
  if (unidad === 'cancelacion_ordenes' as any) return logrado <= meta;
  return logrado >= meta;
}

function getProgress(logrado: number, meta: number, unidad: Unidad): number {
  if (meta === 0) return logrado === 0 ? 100 : 0;
  if (unidad === 'porcentaje_inverso') {
    // 0 logrado / 2 meta → 100 % cumplimiento
    return Math.min(100, meta === 0 ? 0 : ((meta - logrado) / meta) * 100 + 50);
  }
  return Math.min(100, (logrado / meta) * 100);
}

// ── custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unidad }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatValue(p.value, unidad)}
        </p>
      ))}
    </div>
  );
};

// ── component ─────────────────────────────────────────────────────────────────
interface KPIMetricCardProps {
  kpi: KPIItem;
}

export default function KPIMetricCard({ kpi }: KPIMetricCardProps) {
  const ok = isSuccess(kpi.logrado_total, kpi.meta_total, kpi.unidad);
  const progress = getProgress(kpi.logrado_total, kpi.meta_total, kpi.unidad);

  const successColor = '#10b981';  // emerald-500
  const failColor    = '#f43f5e';  // rose-500
  const metaColor    = '#94a3b8';  // slate-400
  const barColor     = ok ? '#6366f1' : failColor; // indigo or rose

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-t-4 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow ${
        ok ? 'border-t-emerald-500' : 'border-t-rose-500'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-sm font-semibold text-slate-700 leading-tight">{kpi.titulo}</h3>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}
        >
          {ok ? 'Cumplido' : 'Atención'}
        </span>
      </div>

      {/* Main figures */}
      <div className="flex items-baseline gap-2">
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
            style={{
              width: `${progress}%`,
              backgroundColor: ok ? successColor : failColor,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>Avance</span>
          <span className={`font-bold ${ok ? 'text-emerald-600' : 'text-rose-500'}`}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={150}>
        <BarChart
          data={kpi.semanas}
          barGap={4}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip unidad={kpi.unidad} />} />
          {kpi.meta_total !== 0 && (
            <ReferenceLine
              y={kpi.meta_total / kpi.semanas.length}
              stroke={metaColor}
              strokeDasharray="4 4"
              label={{ value: 'Meta', position: 'insideTopRight', fontSize: 9, fill: metaColor }}
            />
          )}
          <Bar dataKey="logrado" name="Logrado" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {kpi.semanas.map((s, i) => {
              const barOk = isSuccess(s.logrado, s.meta, kpi.unidad);
              return <Cell key={i} fill={barOk ? barColor : failColor} />;
            })}
          </Bar>
          <Bar dataKey="meta" name="Meta" fill={metaColor} radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
