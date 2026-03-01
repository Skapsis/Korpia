'use client';

import {
    ResponsiveContainer,
    BarChart, Bar,
    LineChart, Line,
    AreaChart, Area,
    ComposedChart,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Indicador, formatValue } from '@/lib/configDrivenApi';
import { ComponentErrorBoundary } from '@/components/common/ErrorBoundary';

interface ChartRendererProps {
    indicador: Indicador;
    height?: number;
}

interface ChartDataPoint {
    periodo: string;
    logrado: number;
    meta: number;
}

function buildChartData(indicador: Indicador): ChartDataPoint[] {
    if (!Array.isArray(indicador.datos) || !indicador.datos.length) {
        return [];
    }
    return indicador.datos.map((d) => ({
        periodo: d.periodo,
        logrado: d.valorLogrado,
        meta: d.valorMetaEspecifica ?? indicador.metaGlobal,
    }));
}

/** Tooltip personalizado — Enterprise: bordes sutiles, texto slate-900/500 */
function CustomTooltip({ active, payload, label, unidad }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-sm">
            <p className="font-semibold text-slate-900 mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-500 capitalize">{p.name}:</span>
                    <span className="font-bold text-slate-900" style={{ color: p.color }}>
                        {formatValue(p.value, unidad)}
                    </span>
                </div>
            ))}
        </div>
    );
}

const GRID_STYLE = { stroke: '#f1f5f9', strokeDasharray: '3 3' };
const AXIS_STYLE = { tick: { fontSize: 11, fill: '#94a3b8' } };

function ChartRendererContent({ indicador, height = 260 }: ChartRendererProps) {
    const data = buildChartData(indicador);
    const color = indicador.colorPrincipal || '#6366f1';
    const metaColor = '#94a3b8';

    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm" style={{ minHeight: height }}>
                Sin datos
            </div>
        );
    }

    const commonProps = {
        data,
        margin: { top: 4, right: 16, left: 0, bottom: 0 },
    };

    const tooltipEl = (
        <Tooltip
            content={<CustomTooltip unidad={indicador.unidad} />}
            cursor={{ fill: 'rgba(99,102,241,0.06)' }}
        />
    );

    const axes = (
        <>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="periodo" {...AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis {...AXIS_STYLE} axisLine={false} tickLine={false} width={50}
                tickFormatter={(v) => formatValue(v, indicador.unidad)} />
        </>
    );

    const legend = (
        <Legend
            wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
            formatter={(v) => v === 'logrado' ? 'Logrado' : 'Meta'}
        />
    );

    // ── Bar Chart ──────────────────────────────────────────────────────────────
    if (indicador.tipoGrafico === 'bar') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <BarChart {...commonProps}>
                    {axes}
                    {tooltipEl}
                    {legend}
                    <Bar dataKey="logrado" name="logrado" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="meta"    name="meta"    fill={metaColor} radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.5} />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    // ── Line Chart ─────────────────────────────────────────────────────────────
    if (indicador.tipoGrafico === 'line') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <LineChart {...commonProps}>
                    {axes}
                    {tooltipEl}
                    {legend}
                    <Line dataKey="logrado" name="logrado" type="monotone" stroke={color}
                        strokeWidth={2.5} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
                    <Line dataKey="meta" name="meta" type="monotone" stroke={metaColor}
                        strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        );
    }

    // ── Pie Chart (torta/anillo) ─────────────────────────────────────────────────
    if (indicador.tipoGrafico === 'pie') {
        const pieData = data.map((d) => ({ periodo: d.periodo, logrado: d.logrado }));
        const colors = [color, metaColor, '#a5b4fc', '#86efac', '#fcd34d', '#f87171'];
        return (
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={pieData}
                        dataKey="logrado"
                        nameKey="periodo"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill={color}
                        label={(props: { name?: string; percent?: number }) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                    >
                        {pieData.map((_, i) => (
                            <Cell key={i} fill={colors[i % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip unidad={indicador.unidad} />} />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    // ── Area Chart ─────────────────────────────────────────────────────────────
    if (indicador.tipoGrafico === 'area') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart {...commonProps}>
                    {axes}
                    {tooltipEl}
                    {legend}
                    <Area dataKey="logrado" name="logrado" type="monotone" stroke={color} fill={color} fillOpacity={0.4} strokeWidth={2} />
                    <Area dataKey="meta" name="meta" type="monotone" stroke={metaColor} fill={metaColor} fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="5 4" />
                </AreaChart>
            </ResponsiveContainer>
        );
    }

    // ── Tabla de detalles (sin Recharts) ───────────────────────────────────────
    if (indicador.tipoGrafico === 'table' && data.length > 0) {
        const keys = Object.keys(data[0]);
        return (
            <div className="overflow-auto h-full w-full rounded-xl border border-slate-200 bg-white shadow-sm" style={{ minHeight: height }}>
                <table className="w-full border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-[1]">
                        <tr>
                            {keys.map((k) => (
                                <th key={k} className="text-left text-xs uppercase text-slate-500 tracking-wider py-3 px-4 border-b border-slate-200 whitespace-nowrap">
                                    {k}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                {keys.map((k) => (
                                    <td key={k} className="text-sm text-slate-700 py-3 px-4">
                                        {row[k as keyof typeof row] != null ? String(row[k as keyof typeof row]) : '—'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // ── Scorecard (tarjeta de número) — normalmente se renderiza en DraggableCanvas ──
    if (indicador.tipoGrafico === 'scorecard') {
        const first = data[0];
        const valor = first?.logrado ?? 0;
        return (
            <div className="flex flex-col items-center justify-center w-full h-full" style={{ minHeight: height }}>
                <span className="text-5xl font-bold text-slate-900 tabular-nums">
                    {formatValue(valor, indicador.unidad)}
                </span>
                <span className="text-sm text-slate-500 mt-2">{indicador.titulo}</span>
            </div>
        );
    }

    // ── Gauge (circular progress) ──────────────────────────────────────────────
    if (indicador.tipoGrafico === 'gauge') {
        const last = data[data.length - 1];
        const logrado = last?.logrado ?? 0;
        const meta = (last?.meta ?? indicador.metaGlobal) || 1;
        const pct = meta > 0 ? Math.min((logrado / meta) * 100, 100) : 0;
        const strokeColor = pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
        return (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: height }}>
                <div className="relative" style={{ width: 160, height: 160 }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                        <circle
                            cx="50" cy="50" r="42"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${pct * 2.64} 264`}
                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900">
                            {formatValue(logrado, indicador.unidad)}
                        </span>
                        <span className="text-xs text-slate-500">de {formatValue(meta, indicador.unidad)}</span>
                        <span className="text-sm font-semibold mt-0.5" style={{ color: strokeColor }}>{Math.round(pct)}%</span>
                    </div>
                </div>
                {last && <p className="text-xs text-slate-500 mt-2">{last.periodo}</p>}
            </div>
        );
    }

    // ── Combo Chart (Bar + Line) ───────────────────────────────────────────────
    return (
        <ResponsiveContainer width="100%" height={height}>
            <ComposedChart {...commonProps}>
                {axes}
                {tooltipEl}
                {legend}
                <Bar dataKey="logrado" name="logrado" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line dataKey="meta" name="meta" type="monotone" stroke={metaColor}
                    strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

export function ChartRenderer(props: ChartRendererProps) {
    return (
        <ComponentErrorBoundary>
            <ChartRendererContent {...props} />
        </ComponentErrorBoundary>
    );
}
