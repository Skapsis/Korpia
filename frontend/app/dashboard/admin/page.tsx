'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/appContext';
import { useKPIDefinitions } from '@/lib/useKPIDefinitions';
import KPIFormModal from '@/components/admin/KPIFormModal';
import { SkeletonKPI } from '@/components/SkeletonLoader';
import type { KPIDefinition } from '@/lib/api';
import toast from 'react-hot-toast';

const AREA_LABELS: Record<string, { label: string; color: string }> = {
    comercial:   { label: 'Comercial',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
    operaciones: { label: 'Operaciones', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    calidad:     { label: 'Calidad',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const UNIDAD_LABELS: Record<string, string> = {
    contactos:          'Contactos',
    presupuestos:       'Presupuestos',
    moneda:             '$',
    porcentaje:         '%',
    porcentaje_inverso: '% (inverso)',
    ordenes:            'Órdenes',
    cantidad:           'Cantidad',
};

export default function AdminPage() {
    const router = useRouter();
    const { auth } = useApp();
    const {
        definitions,
        isLoading,
        createKPI,
        updateKPI,
        deleteKPI,
        isCreating,
        isUpdating,
        isDeleting,
    } = useKPIDefinitions(auth.empresa);

    const [modalOpen, setModalOpen]     = useState(false);
    const [editTarget, setEditTarget]   = useState<KPIDefinition | null>(null);
    const [deletingId, setDeletingId]   = useState<string | null>(null);
    const [filterArea, setFilterArea]   = useState<string>('todas');

    const isSaving = isCreating || isUpdating;

    // Proteger ruta — solo para admins
    useEffect(() => {
        if (auth.isAuthenticated && auth.role !== 'admin') {
            toast.error('Acceso restringido a administradores.');
            router.replace('/dashboard');
        }
    }, [auth, router]);

    // ── handlers ──────────────────────────────────────────────────────────────
    function openCreate() {
        setEditTarget(null);
        setModalOpen(true);
    }

    function openEdit(def: KPIDefinition) {
        setEditTarget(def);
        setModalOpen(true);
    }

    async function handleSave(data: Omit<KPIDefinition, 'id'>) {
        try {
            if (editTarget) {
                await updateKPI(editTarget.id, data);
                toast.success('KPI actualizado correctamente.');
            } else {
                await createKPI(data);
                toast.success('KPI creado correctamente.');
            }
        } catch {
            toast.error('Error al guardar el KPI. Verifica la conexión con el servidor.');
        }
    }

    async function handleDelete(id: string, titulo: string) {
        if (!confirm(`¿Eliminar el KPI "${titulo}"? Esta acción no se puede deshacer.`)) return;
        setDeletingId(id);
        try {
            await deleteKPI(id);
            toast.success('KPI eliminado correctamente.');
        } catch {
            toast.error('Error al eliminar. Verifica la conexión con el servidor.');
        } finally {
            setDeletingId(null);
        }
    }

    // ── filtro por área ───────────────────────────────────────────────────────
    const filtered = filterArea === 'todas'
        ? definitions
        : definitions.filter((d) => d.area === filterArea);

    // ── loading ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="space-y-4">
                <p className="text-slate-400 text-sm animate-pulse">Cargando indicadores...</p>
                <SkeletonKPI />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Header de sección ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">⚙️ Configuración / Admin</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Gestiona los indicadores (KPIs) de forma dinámica. Los cambios se
                        reflejan en todas las pestañas del dashboard.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200 whitespace-nowrap"
                >
                    <span className="text-base">+</span>
                    Agregar Nuevo Indicador
                </button>
            </div>

            {/* ── Stats rápidas ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total KPIs',   value: definitions.length,                                        color: 'bg-slate-50  border-slate-200' },
                    { label: 'Comercial',    value: definitions.filter((d) => d.area === 'comercial').length,   color: 'bg-blue-50   border-blue-200' },
                    { label: 'Operaciones',  value: definitions.filter((d) => d.area === 'operaciones').length, color: 'bg-amber-50  border-amber-200' },
                    { label: 'Calidad',      value: definitions.filter((d) => d.area === 'calidad').length,     color: 'bg-emerald-50 border-emerald-200' },
                ].map((s) => (
                    <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                        <p className="text-2xl font-black text-slate-900">{s.value}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Filtros ── */}
            <div className="flex items-center gap-2 flex-wrap">
                {['todas', 'comercial', 'operaciones', 'calidad'].map((a) => (
                    <button
                        key={a}
                        onClick={() => setFilterArea(a)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border
                            ${filterArea === a
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                    >
                        {a.charAt(0).toUpperCase() + a.slice(1)}
                    </button>
                ))}
                <span className="text-xs text-slate-400 ml-2">{filtered.length} indicadores</span>
            </div>

            {/* ── Tabla de KPIs ── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <p className="text-4xl mb-3">📊</p>
                        <p className="font-semibold">No hay indicadores configurados</p>
                        <p className="text-sm mt-1">Agrega el primero con el botón de arriba.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Nombre del KPI
                                    </th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Área
                                    </th>
                                    <th className="text-right px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Meta
                                    </th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Unidad
                                    </th>
                                    <th className="text-center px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((def) => {
                                    const areaInfo = AREA_LABELS[def.area] ?? { label: def.area, color: 'bg-slate-100 text-slate-600 border-slate-200' };
                                    const isBeingDeleted = deletingId === def.id;

                                    return (
                                        <tr
                                            key={def.id}
                                            className={`hover:bg-slate-50/60 transition-colors ${isBeingDeleted ? 'opacity-40' : ''}`}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-slate-900">{def.titulo}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{def.semanas.length} semanas configuradas</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${areaInfo.color}`}>
                                                    {areaInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {def.meta_total.toLocaleString('es-CL')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-slate-500">
                                                    {UNIDAD_LABELS[def.unidad] ?? def.unidad}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEdit(def)}
                                                        disabled={isBeingDeleted || isDeleting}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-40"
                                                    >
                                                        ✏️ Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(def.id, def.titulo)}
                                                        disabled={isBeingDeleted || isDeleting}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-colors disabled:opacity-40"
                                                    >
                                                        {isBeingDeleted ? '...' : '🗑️ Eliminar'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            <KPIFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                editData={editTarget}
                empresa={auth.empresa ?? 'SOLVEX'}
                isSaving={isSaving}
            />
        </div>
    );
}
