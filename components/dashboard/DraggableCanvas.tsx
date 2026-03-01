'use client';

import { useCallback, useEffect, useState } from 'react';
import { GridLayout, useContainerWidth } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ChartRenderer } from './ChartRenderer';
import { guardarLayoutCanvas } from '@/app/actions/adminActions';
import { ejecutarConsulta } from '@/app/actions/queryActions';
import type { Indicador } from '@/lib/configDrivenApi';
import { formatValue } from '@/lib/configDrivenApi';

export interface IndicadorConGrid extends Indicador {
  gridX?: number | null;
  gridY?: number | null;
  gridW?: number | null;
  gridH?: number | null;
  usaDatosDinamicos?: boolean | null;
  cadenaConexion?: string | null;
  consultaSql?: string | null;
}

interface DraggableCanvasProps {
  indicadores: IndicadorConGrid[];
  filtroGlobal?: string;
}

function buildLayout(indicadores: IndicadorConGrid[]): Layout {
  return indicadores.map((ind) => ({
    i: ind.id,
    x: ind.gridX ?? 0,
    y: ind.gridY ?? 0,
    w: ind.gridW ?? 4,
    h: ind.gridH ?? 3,
    minW: 2,
    minH: 2,
  })) as Layout;
}

/** Convierte filas del recordset SQL a formato datos del indicador (periodo, logrado, meta) */
function recordsetToDatos(rows: Record<string, unknown>[], metaGlobal: number): { periodo: string; valorLogrado: number; valorMetaEspecifica: number | null }[] {
  return rows.map((row) => {
    const periodo = String(row.periodo ?? row.Periodo ?? row.periodo ?? '');
    const logrado = Number(row.logrado ?? row.Logrado ?? row.valorLogrado ?? 0);
    const meta = row.meta != null || row.Meta != null
      ? Number(row.meta ?? row.Meta)
      : null;
    return {
      periodo,
      valorLogrado: Number.isNaN(logrado) ? 0 : logrado,
      valorMetaEspecifica: meta != null && !Number.isNaN(meta) ? meta : null,
    };
  });
}

function ChartCard({
  indicador,
  liveData,
  loading,
  error,
}: {
  indicador: IndicadorConGrid;
  liveData?: { periodo: string; valorLogrado: number; valorMetaEspecifica: number | null }[] | null;
  loading?: boolean;
  error?: string | null;
}) {
  const rawDatos = indicador.usaDatosDinamicos && liveData ? liveData : null;
  const datos = rawDatos
    ? rawDatos.map((d, idx) => ({
        id: `live-${indicador.id}-${idx}`,
        indicadorId: indicador.id,
        periodo: d.periodo,
        valorLogrado: d.valorLogrado,
        valorMetaEspecifica: d.valorMetaEspecifica,
        createdAt: new Date().toISOString(),
      }))
    : (indicador.datos ?? []);
  const indicadorConDatos: Indicador = { ...indicador, datos };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Encabezado con manita (drag handle) */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0 cursor-move bg-slate-50/50">
        <span className="text-slate-400 select-none" aria-hidden title="Arrastra para mover">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </span>
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: indicador.colorPrincipal ?? '#6366f1' }}
        />
        <h2 className="font-bold text-slate-800 truncate">{indicador.titulo}</h2>
        {indicador.descripcion && (
          <span className="text-xs text-slate-400 truncate hidden sm:inline">— {indicador.descripcion}</span>
        )}
      </div>
      {/* Área del gráfico: overflow-hidden para que Recharts se adapte al tamaño de la caja */}
      <div className="flex-1 min-h-0 overflow-hidden p-4">
        {loading && (
          <div className="w-full h-full min-h-[160px] bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm transition-opacity duration-200">
            Cargando datos…
          </div>
        )}
        {!loading && error && (
          <div className="w-full h-full min-h-[160px] bg-red-50 border border-red-100 text-red-600 p-4 text-sm text-center rounded-xl flex items-center justify-center">
            Error SQL: {error}
          </div>
        )}
        {!loading && !error && (!indicadorConDatos.datos || indicadorConDatos.datos.length === 0) && (
          <div className="flex items-center justify-center h-full min-h-[160px] text-slate-400 text-sm rounded-xl bg-slate-50 border border-dashed border-slate-200">
            Sin datos para este indicador
          </div>
        )}
        {!loading && !error && indicadorConDatos.datos?.length > 0 && indicador.tipoGrafico === 'scorecard' && (
          <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-slate-800 tabular-nums">
              {formatValue(indicadorConDatos.datos[0].valorLogrado, indicador.unidad)}
            </span>
            <span className="text-sm text-slate-500 mt-2">{indicador.titulo}</span>
          </div>
        )}
        {!loading && !error && indicadorConDatos.datos?.length > 0 && indicador.tipoGrafico !== 'scorecard' && (
          <ChartRenderer indicador={indicadorConDatos} height={240} />
        )}
      </div>
    </div>
  );
}

export function DraggableCanvas({ indicadores, filtroGlobal }: DraggableCanvasProps) {
  const [layout, setLayout] = useState<Layout>(() => buildLayout(indicadores));
  const [saving, setSaving] = useState(false);
  const [liveDataByInd, setLiveDataByInd] = useState<Record<string, { periodo: string; valorLogrado: number; valorMetaEspecifica: number | null }[]>>({});
  const [liveLoading, setLiveLoading] = useState<Record<string, boolean>>({});
  const [liveError, setLiveError] = useState<Record<string, string>>({});

  useEffect(() => {
    setLayout(buildLayout(indicadores));
  }, [indicadores.length, indicadores.map((i) => i.id).join(',')]);

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    setLayout(newLayout);
    setSaving(true);
    guardarLayoutCanvas([...newLayout]).finally(() => setSaving(false));
  }, []);

  // Cargar datos en vivo para indicadores con usaDatosDinamicos (reactivo al filtro global)
  useEffect(() => {
    for (const ind of indicadores) {
      if (!ind.usaDatosDinamicos || !ind.cadenaConexion?.trim() || !ind.consultaSql?.trim()) continue;
      setLiveLoading((prev) => ({ ...prev, [ind.id]: true }));
      setLiveError((prev) => ({ ...prev, [ind.id]: '' }));
      ejecutarConsulta(ind.cadenaConexion.trim(), ind.consultaSql.trim(), filtroGlobal).then((result) => {
        if ('error' in result) {
          setLiveError((prev) => ({ ...prev, [ind.id]: result.error }));
          setLiveDataByInd((prev) => ({ ...prev, [ind.id]: [] }));
        } else {
          const datos = recordsetToDatos(result.data, ind.metaGlobal);
          setLiveDataByInd((prev) => ({ ...prev, [ind.id]: datos }));
          setLiveError((prev) => ({ ...prev, [ind.id]: '' }));
        }
        setLiveLoading((prev) => ({ ...prev, [ind.id]: false }));
      });
    }
  }, [indicadores, filtroGlobal]);

  if (indicadores.length === 0) return null;

  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: false,
    initialWidth: 1200,
  });

  return (
    <div className="relative" ref={containerRef}>
      {saving && (
        <div className="absolute top-2 right-2 z-10 bg-slate-800/90 text-white text-xs px-3 py-1.5 rounded-lg shadow">
          Guardando posición…
        </div>
      )}
      {mounted && width > 0 && (
        <GridLayout
          width={width}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          gridConfig={{
            cols: 12,
            rowHeight: 120,
            margin: [16, 16],
            containerPadding: [0, 0],
            maxRows: Infinity,
          }}
          dragConfig={{ handle: '.cursor-move', enabled: true, bounded: false, threshold: 3 }}
          resizeConfig={{ enabled: true, handles: ['se'] }}
          className="layout"
        >
          {indicadores.map((ind) => (
            <div key={ind.id}>
              <ChartCard
                indicador={ind}
                liveData={ind.usaDatosDinamicos ? liveDataByInd[ind.id] : undefined}
                loading={liveLoading[ind.id]}
                error={liveError[ind.id] || null}
              />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
