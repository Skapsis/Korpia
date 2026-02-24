'use client';

import { useQuery } from '@tanstack/react-query';
import { getKPIs } from '@/lib/queries';
import { KPICard } from '@/components/KPICard';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function BudgetsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['kpis', 'solvex'],
        queryFn: () => getKPIs('solvex'),
    });

    const handleDevFeature = () => toast('Funcionalidad en desarrollo 🚧', { icon: '⚙️' });
    const commercial = data?.series?.commercial || [];
    const summary = data?.summary || {};

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Presupuestos</h1>
                    <p className="text-slate-400 text-sm mt-1">Gestión de presupuestos comerciales</p>
                </div>
                <button
                    onClick={handleDevFeature}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    + Nuevo Presupuesto
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                        <KPICard
                            title="Presupuestos del período"
                            value={summary?.presupuestos ?? '—'}
                            color="violet"
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                        />
                        <KPICard
                            title="Monto Presupuestado"
                            value={summary?.monto ? `$${(summary.monto / 1000).toFixed(0)}K` : '—'}
                            color="emerald"
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                        <KPICard
                            title="Cumplimiento"
                            value={summary?.cumplimiento ? `${summary.cumplimiento.toFixed(1)}%` : '—'}
                            color="amber"
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                        />
                    </div>

                    {/* Table of recent KPI periods */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Historial de Períodos</h3>
                            <Link href="/dashboard/upload" className="text-blue-600 text-sm font-medium hover:underline">
                                + Cargar datos →
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Período</th>
                                        <th className="px-6 py-3 text-right">Potenciales</th>
                                        <th className="px-6 py-3 text-right">Presupuestos</th>
                                        <th className="px-6 py-3 text-right">Monto ($)</th>
                                        <th className="px-6 py-3 text-right">Cumplimiento</th>
                                        <th className="px-6 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {commercial.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                                                Sin datos. <Link href="/dashboard/upload" className="text-blue-500 underline">Carga un CSV</Link> para comenzar.
                                            </td>
                                        </tr>
                                    ) : (
                                        commercial.map((row: any) => (
                                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">{row.period}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">{row.potenciales}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">{row.presupuestos}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">${row.monto?.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${row.cumplimiento >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        {row.cumplimiento?.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={handleDevFeature} className="text-blue-500 hover:underline text-xs font-medium">Ver detalle</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
