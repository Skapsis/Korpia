'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKPIs, createCommercialKPI } from '@/lib/queries';
import { useAuth } from '@/lib/useAuth';
import { KPICard } from '@/components/KPICard';
import { SkeletonKPI, SkeletonTable } from '@/components/SkeletonLoader';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/errorHandling';

const EMPTY_FORM = { period: '', potenciales: '', presupuestos: '', monto: '', cumplimiento: '' };

export default function BudgetsPage() {
    const { companySlug } = useAuth();
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const { data, isLoading } = useQuery({
        queryKey: ['kpis', companySlug],
        queryFn: () => getKPIs(companySlug),
    });

    const mutation = useMutation({
        mutationFn: () => createCommercialKPI(companySlug, {
            period: form.period,
            potenciales: Number(form.potenciales),
            presupuestos: Number(form.presupuestos),
            monto: Number(form.monto),
            cumplimiento: Number(form.cumplimiento),
        }),
        onSuccess: (result) => {
            toast.success(result.message || 'Presupuesto creado correctamente.');
            queryClient.invalidateQueries({ queryKey: ['kpis', companySlug] });
            setShowModal(false);
            setForm(EMPTY_FORM);
        },
        onError: (err: any) => {
            toast.error(getErrorMessage(err, 'Error al crear el presupuesto. Verifica los datos ingresados.'));
        },
    });

    // Memoize callbacks to prevent recreation on every render
    const handleDevFeature = useCallback(() => toast('Funcionalidad en desarrollo 🚧', { icon: '⚙️' }), []);
    
    const commercial = data?.series?.commercial || [];
    const summary = data?.summary || {};

    const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleSubmitModal = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!form.period.trim()) { toast.error('El período es requerido.'); return; }
        mutation.mutate();
    }, [form.period, mutation]);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Presupuestos</h1>
                    <p className="text-slate-400 text-sm mt-1">Gestión de presupuestos comerciales</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    + Nuevo Presupuesto
                </button>
            </div>

            {isLoading ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                        <SkeletonKPI />
                        <SkeletonKPI />
                        <SkeletonKPI />
                    </div>
                    <SkeletonTable />
                </>
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
                            value={summary?.cumplimiento ? `${Number(summary.cumplimiento).toFixed(1)}%` : '—'}
                            color="amber"
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                        />
                    </div>

                    {/* Table of recent KPI periods */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Historial de Períodos</h3>
                            <Link href="/dashboard/config" className="text-blue-600 text-sm font-medium hover:underline">
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
                                                Sin datos. <Link href="/dashboard/config" className="text-blue-500 underline">Configura los datos</Link> en Administración.
                                            </td>
                                        </tr>
                                    ) : (
                                        commercial.map((row: any) => (
                                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">{row.period}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">{row.potenciales}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">{row.presupuestos}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">${Number(row.monto)?.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${Number(row.cumplimiento) >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        {Number(row.cumplimiento)?.toFixed(1)}%
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

            {/* ====== MODAL: Nuevo Presupuesto ====== */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-black text-slate-900">Nuevo Presupuesto</h2>
                            <p className="text-slate-400 text-sm mt-1">Registra un nuevo período comercial</p>
                        </div>

                        <form onSubmit={handleSubmitModal} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Período <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="period"
                                    value={form.period}
                                    onChange={handleFormChange}
                                    placeholder="ej. 2025-Q3 o 2025-07"
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Potenciales</label>
                                    <input
                                        name="potenciales"
                                        type="number"
                                        min="0"
                                        value={form.potenciales}
                                        onChange={handleFormChange}
                                        placeholder="0"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Presupuestos</label>
                                    <input
                                        name="presupuestos"
                                        type="number"
                                        min="0"
                                        value={form.presupuestos}
                                        onChange={handleFormChange}
                                        placeholder="0"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monto ($)</label>
                                    <input
                                        name="monto"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.monto}
                                        onChange={handleFormChange}
                                        placeholder="0.00"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cumplimiento (%)</label>
                                    <input
                                        name="cumplimiento"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={form.cumplimiento}
                                        onChange={handleFormChange}
                                        placeholder="0.0"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        'Guardar Presupuesto'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
