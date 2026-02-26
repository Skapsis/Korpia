'use client';

import { useState, useEffect } from 'react';
import type { KPIDefinition } from '@/lib/api';

interface Props {
    isOpen:    boolean;
    onClose:   () => void;
    onSave:    (data: Omit<KPIDefinition, 'id'>) => Promise<void>;
    editData?: KPIDefinition | null;
    empresa:   string;
    isSaving?: boolean;
}

const AREAS    = ['comercial', 'operaciones', 'calidad'] as const;
const UNIDADES = ['contactos', 'presupuestos', 'moneda', 'porcentaje', 'porcentaje_inverso', 'ordenes', 'cantidad'];
const SEMANAS  = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

type SemanaRow = { name: string; logrado: number; meta: number };

const emptyForm = (empresa: string): Omit<KPIDefinition, 'id'> => ({
    empresa,
    area:          'comercial',
    titulo:        '',
    meta_total:    0,
    logrado_total: 0,
    unidad:        'contactos',
    semanas:       SEMANAS.map((name) => ({ name, logrado: 0, meta: 0 })),
});

export default function KPIFormModal({ isOpen, onClose, onSave, editData, empresa, isSaving }: Props) {
    const [form, setForm]         = useState<Omit<KPIDefinition, 'id'>>(emptyForm(empresa));
    const [semanas, setSemanas]   = useState<SemanaRow[]>(
        SEMANAS.map((name) => ({ name, logrado: 0, meta: 0 }))
    );

    // Cargar datos cuando se edita
    useEffect(() => {
        if (editData) {
            const { id: _id, semanas: s, ...rest } = editData;
            setForm({ ...rest, semanas: s.length ? s : SEMANAS.map((name) => ({ name, logrado: 0, meta: 0 })) });
            setSemanas(s.length ? s : SEMANAS.map((name) => ({ name, logrado: 0, meta: 0 })));
        } else {
            setForm(emptyForm(empresa));
            setSemanas(SEMANAS.map((name) => ({ name, logrado: 0, meta: 0 })));
        }
    }, [editData, isOpen, empresa]);

    if (!isOpen) return null;

    function handleField(field: keyof Omit<KPIDefinition, 'id' | 'semanas'>, value: string | number) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleSemanaChange(idx: number, field: 'logrado' | 'meta', value: number) {
        setSemanas((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.titulo.trim()) return;
        await onSave({ ...form, semanas });
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            {editData ? 'Editar Indicador' : '+ Agregar Nuevo Indicador'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-0.5">
                            {editData ? 'Modifica los campos y guarda los cambios.' : 'Completa la información del nuevo KPI.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Nombre del KPI */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Nombre del KPI <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.titulo}
                            onChange={(e) => handleField('titulo', e.target.value)}
                            placeholder="Ej. Contactos Efectivos"
                            required
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Área */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Área</label>
                            <select
                                value={form.area}
                                onChange={(e) => handleField('area', e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                            >
                                {AREAS.map((a) => (
                                    <option key={a} value={a}>
                                        {a.charAt(0).toUpperCase() + a.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Unidad */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de Unidad</label>
                            <select
                                value={form.unidad}
                                onChange={(e) => handleField('unidad', e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                            >
                                {UNIDADES.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Meta total */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meta Total</label>
                            <input
                                type="number"
                                value={form.meta_total}
                                onChange={(e) => handleField('meta_total', Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>

                        {/* Logrado total */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Logrado Total</label>
                            <input
                                type="number"
                                value={form.logrado_total}
                                onChange={(e) => handleField('logrado_total', Number(e.target.value))}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Datos por semana */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Datos por Semana
                        </label>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left px-4 py-2.5 text-slate-500 font-semibold w-28">Semana</th>
                                        <th className="text-right px-4 py-2.5 text-slate-500 font-semibold">Meta</th>
                                        <th className="text-right px-4 py-2.5 text-slate-500 font-semibold">Logrado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {semanas.map((s, i) => (
                                        <tr key={s.name}>
                                            <td className="px-4 py-2 font-medium text-slate-600">{s.name}</td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={s.meta}
                                                    onChange={(e) => handleSemanaChange(i, 'meta', Number(e.target.value))}
                                                    className="w-full text-right border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={s.logrado}
                                                    onChange={(e) => handleSemanaChange(i, 'logrado', Number(e.target.value))}
                                                    className="w-full text-right border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-sm"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Guardando...
                                </>
                            ) : (editData ? 'Guardar Cambios' : 'Agregar KPI')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
