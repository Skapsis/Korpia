'use client';

import { useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';

// Lazy load Recharts components
const BarChart = lazy(() => import('recharts').then(mod => ({ default: mod.BarChart })));
const Bar = lazy(() => import('recharts').then(mod => ({ default: mod.Bar })));
const LineChart = lazy(() => import('recharts').then(mod => ({ default: mod.LineChart })));
const Line = lazy(() => import('recharts').then(mod => ({ default: mod.Line })));
const XAxis = lazy(() => import('recharts').then(mod => ({ default: mod.XAxis })));
const YAxis = lazy(() => import('recharts').then(mod => ({ default: mod.YAxis })));
const Tooltip = lazy(() => import('recharts').then(mod => ({ default: mod.Tooltip })));
const Legend = lazy(() => import('recharts').then(mod => ({ default: mod.Legend })));
const ResponsiveContainer = lazy(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })));
const CartesianGrid = lazy(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })));

// Mock data from JSON
const commercialData = {
    empresa: "SOLVEX",
    mes: "Febrero",
    kpis_comerciales: {
        potenciales: {
            titulo: "Nuevos potenciales vs Meta",
            semanas: [
                { semana: "Week 1 (01-08)", meta: 10, logrados: 8 },
                { semana: "Week 2 (09-15)", meta: 10, logrados: 9 }
            ],
            total_logrado: 17,
            total_meta: 20,
            cumplimiento_porcentaje: 85
        },
        presupuestos_cantidad: {
            titulo: "# Presupuestos Creados",
            semanas: [
                { semana: "Week 1 (01-08)", meta: 20, creados: 18 },
                { semana: "Week 2 (09-15)", meta: 20, creados: 21 }
            ],
            total_creados: 39,
            total_meta: 80,
            cumplimiento_porcentaje: 48.75
        },
        presupuestos_valor: {
            titulo: "$ Valor de Presupuestos",
            semanas: [
                { semana: "Week 1 (01-08)", meta: 50000000, creados: 121700000 },
                { semana: "Week 2 (09-15)", meta: 50000000, creados: 0 }
            ],
            total_creados_dinero: 121700000,
            total_meta_dinero: 200000000,
            cumplimiento_porcentaje: 60.85
        }
    }
};

// Helper function to format currency
const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
};

export default function CommercialBoardPage() {
    const { kpis_comerciales } = commercialData;

    // Prepare data for charts
    const presupuestosChartData = useMemo(() => 
        kpis_comerciales.presupuestos_cantidad.semanas.map(item => ({
            semana: item.semana,
            Meta: item.meta,
            Creados: item.creados
        })),
        []
    );

    const valorChartData = useMemo(() => 
        kpis_comerciales.presupuestos_valor.semanas.map(item => ({
            semana: item.semana,
            'Meta ($M)': item.meta / 1000000,
            'Valor Real ($M)': item.creados / 1000000
        })),
        []
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Link 
                        href="/dashboard"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900">Tablero Comercial</h1>
                </div>
                <div className="flex items-center gap-2 ml-14">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <p className="text-slate-500 text-sm font-medium">
                        {commercialData.empresa} · {commercialData.mes} 2026
                    </p>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Card 1: Nuevos Potenciales */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-100 p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">
                                Nuevos Potenciales
                            </p>
                            <h2 className="text-4xl font-black text-slate-900">
                                {kpis_comerciales.potenciales.cumplimiento_porcentaje}%
                            </h2>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm font-medium">
                        <span className="text-blue-600 font-bold">{kpis_comerciales.potenciales.total_logrado}</span> logrados / 
                        <span className="text-slate-400"> {kpis_comerciales.potenciales.total_meta} meta</span>
                    </p>
                </div>

                {/* Card 2: Presupuestos Creados */}
                <div className="bg-gradient-to-br from-violet-50 to-white rounded-2xl border-2 border-violet-100 p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-1">
                                # Presupuestos Creados
                            </p>
                            <h2 className="text-4xl font-black text-slate-900">
                                {kpis_comerciales.presupuestos_cantidad.total_creados}
                            </h2>
                        </div>
                        <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-medium">Meta: {kpis_comerciales.presupuestos_cantidad.total_meta}</span>
                            <span className="text-violet-600 font-bold">{kpis_comerciales.presupuestos_cantidad.cumplimiento_porcentaje.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-violet-500 to-violet-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${kpis_comerciales.presupuestos_cantidad.cumplimiento_porcentaje}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Valor de Presupuestos */}
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">
                                $ Valor de Presupuestos
                            </p>
                            <h2 className="text-4xl font-black text-slate-900">
                                {formatCurrency(kpis_comerciales.presupuestos_valor.total_creados_dinero)}
                            </h2>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-medium">Meta: {formatCurrency(kpis_comerciales.presupuestos_valor.total_meta_dinero)}</span>
                            <span className="text-emerald-600 font-bold">{kpis_comerciales.presupuestos_valor.cumplimiento_porcentaje.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${kpis_comerciales.presupuestos_valor.cumplimiento_porcentaje}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Bar Chart - Presupuestos por Semana */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Evolución de Presupuestos por Semana</h3>
                        <p className="text-sm text-slate-500 mt-1"># de presupuestos creados vs meta semanal</p>
                    </div>
                    <div className="h-[320px]">
                        <Suspense fallback={
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        }>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={presupuestosChartData} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="semana" 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                            padding: '12px'
                                        }}
                                        labelStyle={{ color: '#f1f5f9', fontWeight: 'bold', marginBottom: '8px' }}
                                        itemStyle={{ color: '#f1f5f9', fontSize: '14px' }}
                                    />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="circle"
                                    />
                                    <Bar 
                                        dataKey="Meta" 
                                        fill="#cbd5e1" 
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={60}
                                    />
                                    <Bar 
                                        dataKey="Creados" 
                                        fill="#8b5cf6" 
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={60}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Suspense>
                    </div>
                </div>

                {/* Chart 2: Line Chart - Valor Monetario */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Valor Monetario Generado vs Meta</h3>
                        <p className="text-sm text-slate-500 mt-1">Valor en millones de pesos por semana</p>
                    </div>
                    <div className="h-[320px]">
                        <Suspense fallback={
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        }>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={valorChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="semana" 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                        label={{ value: 'Millones ($M)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748b' } }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                            padding: '12px'
                                        }}
                                        labelStyle={{ color: '#f1f5f9', fontWeight: 'bold', marginBottom: '8px' }}
                                        itemStyle={{ color: '#f1f5f9', fontSize: '14px' }}
                                        formatter={(value: any) => value ? `$${Number(value).toFixed(1)}M` : '$0.0M'}
                                    />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="line"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="Meta ($M)" 
                                        stroke="#94a3b8" 
                                        strokeWidth={3}
                                        strokeDasharray="5 5"
                                        dot={{ fill: '#94a3b8', r: 5 }}
                                        activeDot={{ r: 7 }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="Valor Real ($M)" 
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 5 }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Suspense>
                    </div>
                </div>
            </div>

            {/* Weekly Details Table */}
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Detalle Semanal</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Semana</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Potenciales</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Presupuestos</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {kpis_comerciales.potenciales.semanas.map((semana, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{semana.semana}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-bold text-slate-900">
                                                {semana.logrados} / {semana.meta}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                ({((semana.logrados / semana.meta) * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-bold text-slate-900">
                                                {kpis_comerciales.presupuestos_cantidad.semanas[idx].creados} / {kpis_comerciales.presupuestos_cantidad.semanas[idx].meta}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                ({((kpis_comerciales.presupuestos_cantidad.semanas[idx].creados / kpis_comerciales.presupuestos_cantidad.semanas[idx].meta) * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-bold text-emerald-600">
                                                {formatCurrency(kpis_comerciales.presupuestos_valor.semanas[idx].creados)}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Meta: {formatCurrency(kpis_comerciales.presupuestos_valor.semanas[idx].meta)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
