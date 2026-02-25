'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback, lazy, Suspense } from 'react';
import { getKPIs } from '@/lib/queries';
import { useAuth } from '@/lib/useAuth';
import { KPICard } from '@/components/KPICard';
import { SkeletonKPI, SkeletonChart } from '@/components/SkeletonLoader';
import toast from 'react-hot-toast';

// Lazy load Recharts to reduce bundle size
const LineChart = lazy(() => import('recharts').then(mod => ({ default: mod.LineChart })));
const Line = lazy(() => import('recharts').then(mod => ({ default: mod.Line })));
const XAxis = lazy(() => import('recharts').then(mod => ({ default: mod.XAxis })));
const YAxis = lazy(() => import('recharts').then(mod => ({ default: mod.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(mod => ({ default: mod.Tooltip })));
const Legend = lazy(() => import('recharts').then(mod => ({ default: mod.Legend })));
const ResponsiveContainer = lazy(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })));

export default function OperationsPage() {
    const { companySlug } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['kpis', companySlug],
        queryFn: () => getKPIs(companySlug),
    });

    // Memoize callback to prevent recreation
    const handleDevFeature = useCallback(() => toast('Funcionalidad en desarrollo 🚧', { icon: '⚙️' }), []);
    
    const operations = data?.series?.operations || [];
    const summary = data?.summary || {};

    // Memoize chart data transformation
    const chartData = useMemo(() => 
        operations.slice().reverse().map((item: any) => ({
            periodo: item.period,
            'T. Efectivo (%)': Math.round(item.tiempoEfectivo),
            'Órds. Programadas': item.ordenesProgramadas,
            'Cancelaciones': item.cancelaciones,
        })),
        [operations]
    );

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Operaciones</h1>
                    <p className="text-slate-400 text-sm mt-1">Métricas de eficiencia operativa</p>
                </div>
                <button onClick={handleDevFeature} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                    ⬇️ Exportar
                </button>
            </div>

            {isLoading ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                        <SkeletonKPI />
                        <SkeletonKPI />
                        <SkeletonKPI />
                    </div>
                    <SkeletonChart />
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        <KPICard
                            title="Tiempo Efectivo"
                            value={summary?.tiempoEfectivo ? `${summary.tiempoEfectivo.toFixed(1)}` : '—'}
                            unit="%"
                            color="emerald"
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                        <KPICard
                            title="Órdenes Prog."
                            value={summary?.ordenesProgramadas ?? '—'}
                            color="blue"
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                        />
                        <KPICard
                            title="Cancelaciones"
                            value={summary?.cancelaciones ?? '—'}
                            color="amber"
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                        />
                        <KPICard
                            title="NPS"
                            value={summary?.nps ? summary.nps.toFixed(0) : '—'}
                            color="violet"
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-1">Tendencia Operativa</h3>
                        <p className="text-slate-400 text-xs mb-4">Histórico de períodos disponibles</p>
                        {chartData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-slate-300">
                                <p className="text-center">Sin datos. <a href="/dashboard/upload" className="text-blue-500 underline">Carga un CSV</a> para comenzar.</p>
                            </div>
                        ) : (
                            <Suspense fallback={
                                <div className="h-[260px] flex items-center justify-center">
                                    <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            }>
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="T. Efectivo (%)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="Órds. Programadas" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="Cancelaciones" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Suspense>
                        )}
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button onClick={handleDevFeature} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-sm rounded-xl">
                            📋 Ver órdenes detalladas
                        </button>
                        <button onClick={handleDevFeature} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-sm rounded-xl">
                            📬 Enviar reporte por email
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
