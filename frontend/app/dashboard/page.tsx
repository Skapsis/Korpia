'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getKPIs } from '@/lib/queries';
import { KPICard } from '@/components/KPICard';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid
} from 'recharts';

export default function DashboardPage() {
    const router = useRouter();
    const companySlug = 'solvex'; // Later: pull from user context

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['kpis', companySlug],
        queryFn: () => getKPIs(companySlug),
        retry: 1,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Cargando datos...</p>
                </div>
            </div>
        );
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

    const { summary, company, series } = data || {};
    const commercialSeries = series?.commercial || [];
    const operationSeries = series?.operations || [];

    const chartData = commercialSeries.slice().reverse().map((item: any) => ({
        periodo: item.period,
        Potenciales: item.potenciales,
        Presupuestos: item.presupuestos,
        Monto: Math.round(item.monto / 1000),
    }));

    const opChartData = operationSeries.slice().reverse().map((item: any) => ({
        periodo: item.period,
        'T. Efectivo': Math.round(item.tiempoEfectivo),
        Órdenes: item.ordenesProgramadas,
    }));

    const handleDevFeature = () => {
        toast('Funcionalidad en desarrollo 🚧', { icon: '⚙️' });
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Dashboard General</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {company?.name || 'SOLVEX'} · Vista actualizada en tiempo real
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDevFeature} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 flex gap-2 items-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                        </svg>
                        Filtrar
                    </button>
                    <button onClick={handleDevFeature} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 flex gap-2 items-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        Exportar
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <KPICard
                    title="Potenciales"
                    value={summary?.potenciales ?? '—'}
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>}
                    color="blue"
                    trend={5}
                />
                <KPICard
                    title="Presupuestos"
                    value={summary?.presupuestos ?? '—'}
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                    color="violet"
                    trend={-2}
                />
                <KPICard
                    title="Monto Total"
                    value={summary?.monto ? `$${(summary.monto / 1000).toFixed(0)}K` : '—'}
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    color="emerald"
                    trend={12}
                />
                <KPICard
                    title="Cumplimiento"
                    value={summary?.cumplimiento ? `${summary.cumplimiento.toFixed(1)}` : '—'}
                    unit="%"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                    color="amber"
                    trend={3}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {/* Commercial Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-1">Rendimiento Comercial</h3>
                    <p className="text-slate-400 text-xs mb-4">Potenciales vs Presupuestos por período</p>
                    {chartData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-300">
                            <p>Sin datos disponibles</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                                <Legend />
                                <Bar dataKey="Potenciales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="Presupuestos" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Operations Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-1">Tiempo Efectivo</h3>
                    <p className="text-slate-400 text-xs mb-4">% de eficiencia operativa por período</p>
                    {opChartData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-300">
                            <p>Sin datos disponibles</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={opChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                                <Legend />
                                <Line type="monotone" dataKey="T. Efectivo" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Órdenes" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Acciones Rápidas</h3>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => router.push('/dashboard/upload')} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm rounded-xl transition-all">
                        📊 Cargar CSV
                    </button>
                    <button onClick={handleDevFeature} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-sm rounded-xl transition-all">
                        📄 Generar Reporte
                    </button>
                    <button onClick={handleDevFeature} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-sm rounded-xl transition-all">
                        🔔 Configurar Alertas
                    </button>
                    <button onClick={handleDevFeature} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-sm rounded-xl transition-all">
                        👥 Invitar Usuarios
                    </button>
                </div>
            </div>
        </div>
    );
}
