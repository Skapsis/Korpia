'use client';

/**
 * DynamicDashboard
 * ─────────────────
 * Componente de renderizado dinámico basado en la configuración del backend.
 * Lee el estado global `systemConfig` (AppContext), ubica el tablero por su id,
 * y renderiza un <IndicadorCard /> + <ChartRenderer /> por cada indicador.
 *
 * Flujo:
 *  1. Si `systemConfig` está cargado en el contexto, usa esos datos directamente
 *     (sin fetch extra — 0 ms de latencia).
 *  2. Si `systemConfig` es null (login sin JWT), hace un fetch directo como fallback.
 */

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/appContext';
import { useAuth } from '@/lib/useAuth';
import { fetchConfig, type Tablero } from '@/lib/configDrivenApi';
import { IndicadorCard } from './IndicadorCard';
import { ChartRenderer } from './ChartRenderer';

interface Props {
    /** ID del tablero a renderizar */
    tableroId: string;
    /**
     * Modo de visualización.
     * - 'cards'  (default): muestra solo las IndicadorCard (vista de resumen)
     * - 'charts': muestra solo los ChartRenderer (vista de gráficos)
     * - 'full':  muestra cards + gráficos expandidos debajo de cada card
     */
    mode?: 'cards' | 'charts' | 'full';
}

export function DynamicDashboard({ tableroId, mode = 'cards' }: Props) {
    const { systemConfig } = useApp();
    const { company } = useAuth();

    const [tablero, setTablero] = useState<Tablero | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Paso 1: intentar obtener tablero desde systemConfig (sin latencia)
    useEffect(() => {
        if (systemConfig) {
            const found = systemConfig.tableros.find((t) => t.id === tableroId);
            if (found) {
                setTablero(found);
                setLoading(false);
                return;
            }
            // El id no está en systemConfig — puede ser un tablero nuevo no refrescado
        }

        // Paso 2: fetch directo como fallback
        loadFallback();
    }, [tableroId, systemConfig]);

    async function loadFallback() {
        setLoading(true);
        setError(null);
        try {
            const slug = company?.slug ?? 'solvex';
            const config = await fetchConfig(slug);
            const found = config.tableros.find((t) => t.id === tableroId);
            setTablero(found ?? null);
            if (!found) setError('Tablero no encontrado.');
        } catch {
            setError('No se pudo cargar el tablero. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    }

    // ── Estados de UI ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="bg-white rounded-2xl border border-slate-100 h-72 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !tablero) {
        return (
            <div className="p-8 text-center">
                <span className="text-5xl">🔍</span>
                <p className="mt-3 text-slate-600 font-semibold">{error ?? 'Tablero no encontrado'}</p>
                <p className="text-slate-400 text-sm mt-1">Verifica que el tablero exista o recarga la página.</p>
            </div>
        );
    }

    const indicadores = tablero.indicadores ?? [];

    // ── Renderizado ──────────────────────────────────────────────────────────
    return (
        <div className="p-8 space-y-8 animate-fadeIn">
            {/* Header del tablero */}
            <header className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-5xl">{tablero.icono}</span>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">{tablero.nombre}</h1>
                        {tablero.descripcion && (
                            <p className="text-slate-500 text-sm mt-1">{tablero.descripcion}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                            {indicadores.length} indicador{indicadores.length !== 1 ? 'es' : ''} configurado{indicadores.length !== 1 ? 's' : ''}
                            {systemConfig && (
                                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    config en vivo
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </header>

            {indicadores.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <span className="text-4xl">📊</span>
                    <p className="mt-3 text-slate-600 font-semibold">Sin indicadores</p>
                    <p className="text-slate-400 text-sm mt-1">Ve a Admin Configurator para agregar KPIs a este tablero.</p>
                </div>
            ) : (
                <>
                    {/* ── Modo CARDS (resumen) ─────────────────────────────── */}
                    {(mode === 'cards' || mode === 'full') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {indicadores.map((ind) => (
                                <IndicadorCard key={ind.id} indicador={ind} />
                            ))}
                        </div>
                    )}

                    {/* ── Modo CHARTS (gráficos individuales) ─────────────── */}
                    {(mode === 'charts' || mode === 'full') && (
                        <div className="space-y-6">
                            {mode === 'full' && (
                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-100">
                                    Gráficos detallados
                                </h2>
                            )}
                            {indicadores.map((ind) => (
                                <div key={ind.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: ind.colorPrincipal }}
                                        />
                                        <h3 className="font-bold text-slate-800">{ind.titulo}</h3>
                                        {ind.descripcion && (
                                            <span className="text-xs text-slate-400 ml-1">— {ind.descripcion}</span>
                                        )}
                                        <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                            {ind.tipoGrafico === 'bar' ? '📊 Barras'
                                                : ind.tipoGrafico === 'line' ? '📈 Línea'
                                                : ind.tipoGrafico === 'area' ? '📉 Área'
                                                : ind.tipoGrafico === 'pie' ? '🥧 Circular'
                                                : ind.tipoGrafico === 'gauge' ? '🎯 Gauge'
                                                : '🔀 Combinado'}
                                        </span>
                                    </div>
                                    <ChartRenderer indicador={ind} height={240} />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
