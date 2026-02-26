'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, Cell, LabelList,
} from 'recharts';
import type { KPIItem } from '@/lib/kpiData';
import {
  formatValue, formatValueFull, isSuccess, getProgress,
  SUCCESS_COLOR, FAIL_COLOR, BAR_COLOR,
} from '@/lib/kpiHelpers';

const META_LINE_COLOR = '#f97316'; // naranja corporativo

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, unidad }: any) => {
  if (!active || !payload?.length) return null;

  const logradoEntry = payload.find((p: any) => p.dataKey === 'logrado');
  const metaEntry    = payload.find((p: any) => p.dataKey === 'meta');
  const logrado      = logradoEntry?.value ?? 0;
  const meta         = metaEntry?.value     ?? 0;

  const isInverso  = unidad === 'porcentaje_inverso';
  const superado   = isInverso ? logrado <= meta : logrado >= meta;
  const diff       = isInverso ? meta - logrado : logrado - meta;
  const diffLabel  = superado
    ? `✅ Superado por ${formatValueFull(Math.abs(diff), unidad)}`
    : `⚠ Faltan ${formatValueFull(Math.abs(diff), unidad)} para la meta`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm min-w-[200px]">
      <p className="font-bold text-slate-700 mb-2.5 border-b border-slate-100 pb-2">{label}</p>

      {/* Logrado */}
      {logradoEntry && (
        <p className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: logradoEntry.fill ?? BAR_COLOR }} />
            Logrado
          </span>
          <span className="font-bold text-slate-900">
            {formatValueFull(logrado, unidad)}
          </span>
        </p>
      )}

      {/* Meta */}
      {metaEntry && (
        <p className="flex items-center justify-between gap-4 mb-2.5">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: META_LINE_COLOR }} />
            Meta
          </span>
          <span className="font-bold" style={{ color: META_LINE_COLOR }}>
            {formatValueFull(meta, unidad)}
          </span>
        </p>
      )}

      {/* Diferencia */}
      {logradoEntry && metaEntry && (
        <p className={`text-xs font-semibold rounded-lg px-2 py-1.5 mt-1
          ${superado
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-rose-50 text-rose-600'
          }`}>
          {diffLabel}
        </p>
      )}
    </div>
  );
};


// ── Props ─────────────────────────────────────────────────────────────────────
interface KPIDetailViewProps {
  kpi: KPIItem;
  onBack: () => void;
}

export default function KPIDetailView({ kpi, onBack }: KPIDetailViewProps) {
  const ok       = isSuccess(kpi.logrado_total, kpi.meta_total, kpi.unidad);
  const progress = getProgress(kpi.logrado_total, kpi.meta_total, kpi.unidad);
  const isInverso = kpi.unidad === 'porcentaje_inverso';

  // Color de cada barra: verde si supera meta, azul si está en camino, rojo si no
  function barColor(logrado: number, meta: number) {
    if (isSuccess(logrado, meta, kpi.unidad)) return SUCCESS_COLOR;
    if (meta > 0 && logrado / meta >= 0.7) return BAR_COLOR;
    return FAIL_COLOR;
  }

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
          <div>
            <h3 className="text-base font-semibold text-slate-800">Evolución Semanal</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              La línea punteada indica el objetivo por semana
            </p>
          </div>
          {/* Leyenda manual */}
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: SUCCESS_COLOR }} />
              Meta superada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: BAR_COLOR }} />
              En progreso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: FAIL_COLOR }} />
              Por debajo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: META_LINE_COLOR }} />
              Objetivo
            </span>
          </div>
        </div>

        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={kpi.semanas}
              margin={{ top: 16, right: 64, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  kpi.unidad === 'moneda'
                    ? `$${(v / 1_000_000).toFixed(0)}M`
                    : String(v)
                }
              />
              <Tooltip
                content={<ChartTooltip unidad={kpi.unidad} />}
                cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 8 }}
              />

              {/* ── Barras de Logrado ── */}
              <Bar
                dataKey="logrado"
                name="Logrado"
                radius={[4, 4, 0, 0]}
                maxBarSize={52}
                isAnimationActive
              >
                {kpi.semanas.map((s, i) => (
                  <Cell key={i} fill={barColor(s.logrado, s.meta)} />
                ))}
              </Bar>

              {/* ── Línea de Meta ── */}
              <Line
                type="monotone"
                dataKey="meta"
                name="Meta"
                stroke={META_LINE_COLOR}
                strokeWidth={3}
                strokeDasharray="6 4"
                dot={{ r: 4, fill: META_LINE_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: META_LINE_COLOR, strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive
              >
                <LabelList
                  dataKey="meta"
                  position="right"
                  content={(props: any) => {
                    // Mostrar label solo en el último dato
                    const { index, x, y, value } = props;
                    if (index !== kpi.semanas.length - 1) return null;
                    return (
                      <text
                        x={Number(x) + 10}
                        y={Number(y)}
                        dy={4}
                        fill={META_LINE_COLOR}
                        fontSize={11}
                        fontWeight={700}
                      >
                        Meta
                      </text>
                    );
                  }}
                />
              </Line>
            </ComposedChart>
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
                const rowOk = isSuccess(s.logrado, s.meta, kpi.unidad);
                const diff  = isInverso ? s.meta - s.logrado : s.logrado - s.meta;
                const cumpl = s.meta === 0
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

