'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useCallback, lazy, Suspense } from 'react';
import toast from 'react-hot-toast';
import { getKPIs } from '@/lib/queries';
import { useAuth } from '@/lib/useAuth';
import { KPICard } from '@/components/KPICard';
import { SkeletonDashboard } from '@/components/SkeletonLoader';

// Lazy load Recharts components to reduce initial bundle size
const BarChart = lazy(() => import('recharts').then(mod => ({ default: mod.BarChart })));
const Bar = lazy(() => import('recharts').then(mod => ({ default: mod.Bar })));
const LineChart = lazy(() => import('recharts').then(mod => ({ default: mod.LineChart })));
const Line = lazy(() => import('recharts').then(mod => ({ default: mod.Line })));
const XAxis = lazy(() => import('recharts').then(mod => ({ default: mod.XAxis })));
const YAxis = lazy(() => import('recharts').then(mod => ({ default: mod.YAxis })));
const Tooltip = lazy(() => import('recharts').then(mod => ({ default: mod.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })));
const CartesianGrid = lazy(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })));

export default function DashboardPage() {
    const router = useRouter();
    const { companySlug, company, ready } = useAuth();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['kpis', companySlug],
        queryFn: () => getKPIs(companySlug),
        enabled: ready,
        retry: 1,
    });

    if (isLoading) {
        return <SkeletonDashboard />;
    }

    if (isError) {
        const errMsg = (error as any)?.response?.data?.message || 'No se pudo conectar con el servidor.';
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="text-4xl">⚠️</div>
                <h2 className="text-xl font-bold text-slate-700">Error al cargar</h2>
                <p className="text-slate-400 text-sm">{errMsg}</p>
                <button onClick={() => router.push('/login')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
                    Volver al Login
                </button>
            </div>
        );
    }

    const { summary, company: apiCompany, series } = data || {};
    const commercialSeries = series?.commercial || [];
    const operationSeries = series?.operations || [];

    // Memoize chart data transformations to prevent recalculation on every render
    const chartData = useMemo(() => 
        commercialSeries.slice().reverse().map((item: any) => ({
            periodo: item.period,
            Potenciales: item.potenciales,
            Presupuestos: item.presupuestos,
            Monto: Math.round(item.monto / 1000),
        })),
        [commercialSeries]
    );

    const opChartData = useMemo(() => 
        operationSeries.slice().reverse().map((item: any) => ({
            periodo: item.period,
            'T. Efectivo': Math.round(item.tiempoEfectivo),
            Órdenes: item.ordenesProgramadas,
        })),
        [operationSeries]
    );

    // useCallback to prevent function recreation on every render
    const handleDevFeature = useCallback(() => {
        toast('Funcionalidad en desarrollo 🚧', { icon: '⚙️' });
    }, []);

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard General</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-slate-500 text-sm font-medium">
                            {company?.name || apiCompany?.name || 'SOLVEX'} · Datos actualizados en tiempo real
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDevFeature} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all flex gap-2 items-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                        </svg>
                        Filtrar
                    </button>
                    <button onClick={handleDevFeature} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex gap-2 items-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        Exportar
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <KPICard
                    title="Potenciales"
                    value={summary?.potenciales ?? '—'}
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>}
                    color="blue"
                    trend={5}
                    href="/dashboard/details/commercial"
                />
                <KPICard
                    title="Presupuestos"
                    value={summary?.presupuestos ?? '—'}
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                    color="violet"
                    trend={-2}
                    href="/dashboard/details/commercial"
                />
                <KPICard
                    title="Monto Total"
                    value={summary?.monto ? `$${(summary.monto / 1000).toFixed(0)}K` : '—'}
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    color="emerald"
                    trend={12}
                    href="/dashboard/details/commercial"
                />
                <KPICard
                    title="Cumplimiento"
                    value={summary?.cumplimiento ? `${summary.cumplimiento.toFixed(1)}` : '—'}
                    unit="%"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                    color="amber"
                    trend={3}
                    href="/dashboard/details/commercial"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                {/* Commercial Chart */}
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Rendimiento Comercial</h3>
                            <p className="text-slate-400 text-xs mt-1">Comparativa de funnel comercial por Q</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Potenciales</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presupuestos</span>
                            </div>
                        </div>
                    </div>
                    {chartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-300">
                            <p>Sin datos disponibles</p>
                        </div>
                    ) : (
                        <Suspense fallback={
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        }>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="Potenciales" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                                    <Bar dataKey="Presupuestos" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Suspense>
                    )}
                </div>

                {/* Operations Chart */}
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Tiempo Efectivo</h3>
                            <p className="text-slate-400 text-xs mt-1">Eficiencia de servicios operativos</p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                            +12.5% mejora
                        </div>
                    </div>
                    {opChartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-300">
                            <p>Sin datos disponibles</p>
                        </div>
                    ) : (
                        <Suspense fallback={
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        }>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={opChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="T. Efectivo"
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                        animationDuration={2000}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Órdenes"
                                        stroke="#f59e0b"
                                        strokeWidth={4}
                                        dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                        animationDuration={2000}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Suspense>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Acciones Rápidas</h3>
                        <p className="text-slate-400 text-sm">Gestiona la plataforma y configura tus reportes personalizados.</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <button onClick={() => router.push('/dashboard/upload')} className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl transition-all border border-white/10">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Cargar Datos
                        </button>
                        <button onClick={handleDevFeature} className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Nuevo Reporte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
