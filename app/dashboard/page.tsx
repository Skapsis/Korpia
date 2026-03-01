'use client';

import { useApp } from '@/lib/appContext';
import { DynamicDashboard } from '@/components/dashboard/DynamicDashboard';
import Link from 'next/link';

/**
 * Motor de renderizado dinámico: lee el tablero seleccionado desde systemConfig
 * (GET /api/config/dynamic) y hace .map() de sus Indicadores → ChartRenderer.
 * Sin componentes estáticos (Comercial, Operaciones, etc.).
 */
export default function DashboardPage() {
    const { systemConfig } = useApp();
    const tableros = systemConfig?.tableros ?? [];
    const firstTablero = tableros[0];

    if (!systemConfig) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Cargando configuración…</p>
            </div>
        );
    }

    if (tableros.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[320px] text-center px-4">
                <span className="text-5xl">📊</span>
                <h2 className="text-xl font-bold text-slate-800 mt-4">Sin tableros configurados</h2>
                <p className="text-slate-500 text-sm mt-2 max-w-sm">
                    Configura tableros e indicadores en Administración para ver el dashboard dinámico.
                </p>
                <Link
                    href="/dashboard/config"
                    className="mt-6 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700"
                >
                    Ir a Administración
                </Link>
            </div>
        );
    }

    // Renderizado dinámico: primer tablero con sus indicadores → ChartRenderer (vía DynamicDashboard)
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-1 px-0 pt-0 pb-2">
                <p className="text-xs text-slate-400">
                    Vista del tablero <strong className="text-slate-600">{firstTablero.nombre}</strong>.
                    Más tableros en el menú lateral.
                </p>
            </div>
            <DynamicDashboard tableroId={firstTablero.id} mode="charts" />
        </div>
    );
}
