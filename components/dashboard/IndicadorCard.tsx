'use client';

import { Indicador, formatValue, calcCumplimiento, isOnTarget } from '@/lib/configDrivenApi';
import { ChartRenderer } from './ChartRenderer';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IndicadorCardProps {
    indicador: Indicador;
    expanded?: boolean;
}

export function IndicadorCard({ indicador, expanded = true }: IndicadorCardProps) {
    const datos = indicador.datos;
    const lastDato = datos[datos.length - 1];

    const logrado = lastDato?.valorLogrado ?? 0;
    const meta = lastDato?.valorMetaEspecifica ?? indicador.metaGlobal;
    const cumpl = calcCumplimiento(logrado, meta, indicador.esMejorMayor);
    const onTarget = isOnTarget(logrado, meta, indicador.esMejorMayor);

    // Tendencia: comparar último con penúltimo
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (datos.length >= 2) {
        const prev = datos[datos.length - 2].valorLogrado;
        if (logrado > prev) trend = 'up';
        else if (logrado < prev) trend = 'down';
    }

    const statusColor = onTarget
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-rose-50 text-rose-700 border-rose-200';

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up'
        ? (indicador.esMejorMayor ? 'text-emerald-500' : 'text-rose-500')
        : trend === 'down'
        ? (indicador.esMejorMayor ? 'text-rose-500' : 'text-emerald-500')
        : 'text-slate-400';

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl" style={{ color: indicador.colorPrincipal }}>●</span>
                        <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">
                            {indicador.titulo}
                        </h3>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {onTarget ? 'En Meta' : 'Sin Meta'}
                    </span>
                </div>

                {/* Valor principal */}
                <div className="flex items-end justify-between mb-3">
                    <div>
                        <p className="text-3xl font-bold text-slate-900 leading-none">
                            {formatValue(logrado, indicador.unidad)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Meta: {formatValue(meta, indicador.unidad)}
                        </p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
                        <TrendIcon className="w-4 h-4" />
                        {trend !== 'flat' && datos.length >= 2
                            ? formatValue(Math.abs(logrado - datos[datos.length - 2].valorLogrado), indicador.unidad)
                            : '–'
                        }
                    </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${Math.min(cumpl, 100)}%`,
                            background: onTarget ? indicador.colorPrincipal : '#f43f5e',
                        }}
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{lastDato?.periodo ?? '–'}</span>
                    <span className="font-semibold" style={{ color: onTarget ? indicador.colorPrincipal : '#f43f5e' }}>
                        {Math.round(cumpl)}%
                    </span>
                </div>
            </div>

            {/* Gráfico */}
            {expanded && datos.length > 0 && (
                <div className="px-2 pb-4">
                    <ChartRenderer indicador={indicador} height={200} />
                </div>
            )}

            {!expanded && datos.length === 0 && (
                <div className="px-5 pb-5 text-center text-xs text-slate-400">Sin datos cargados</div>
            )}
        </div>
    );
}
