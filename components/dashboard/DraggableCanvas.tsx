'use client';

import { useCallback, useEffect, useState } from 'react';
import { GridLayout, useContainerWidth } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import * as XLSX from 'xlsx';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ChartRenderer } from './ChartRenderer';
import { guardarLayoutCanvas } from '@/app/actions/adminActions';
import { ejecutarConsulta } from '@/app/actions/queryActions';
import type { Indicador } from '@/lib/configDrivenApi';
import { formatValue } from '@/lib/configDrivenApi';

function descargarExcel(data: Record<string, unknown>[], filename: string = 'Detalle_Datos.xlsx') {
  if (!data?.length) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, filename);
}

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
  /** @deprecated Use start/end for date range. */
  filtroGlobal?: string;
  /** Fecha inicio (YYYY-MM-DD) para {{FECHA_INICIO}} en consultas SQL. */
  start?: string;
  /** Fecha fin (YYYY-MM-DD) para {{FECHA_FIN}} en consultas SQL. */
  end?: string;
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

/** Convierte fila genérica a objeto plano para tabla (claves como string) */
function rowToRecord(d: { periodo: string; valorLogrado: number; valorMetaEspecifica: number | null }): Record<string, unknown> {
  return { periodo: d.periodo, logrado: d.valorLogrado, meta: d.valorMetaEspecifica ?? '—' };
}

function DataTable({ data, onExportExcel }: { data: Record<string, unknown>[]; onExportExcel?: () => void }) {
  if (!data?.length) return null;
  const keys = Object.keys(data[0]);
  return (
    <div className="relative flex flex-col h-full w-full rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {onExportExcel && (
        <div className="absolute top-2 right-2 z-10 flex justify-end">
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 transition-colors"
            title="Exportar a Excel"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Excel
          </button>
        </div>
      )}
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-[1]">
            <tr>
              {keys.map((k) => (
                <th key={k} className="text-left text-xs uppercase text-slate-500 tracking-wider py-3 px-4 border-b border-slate-200 whitespace-nowrap">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                {keys.map((k) => (
                  <td key={k} className="text-sm text-slate-700 py-3 px-4">
                    {row[k] != null ? String(row[k]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartCard({
  indicador,
  liveData,
  liveRawData,
  loading,
  error,
}: {
  indicador: IndicadorConGrid;
  liveData?: { periodo: string; valorLogrado: number; valorMetaEspecifica: number | null }[] | null;
  liveRawData?: Record<string, unknown>[] | null;
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

  const tableData: Record<string, unknown>[] | null =
    indicador.tipoGrafico === 'table'
      ? (indicador.usaDatosDinamicos && liveRawData?.length
          ? liveRawData
          : indicadorConDatos.datos?.length
            ? indicadorConDatos.datos.map(rowToRecord)
            : null)
      : null;

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Encabezado (drag handle) */}
      <div className="flex items-center gap-2.5 py-2 px-4 border-b border-slate-100 shrink-0 bg-slate-50/50 cursor-grab active:cursor-grabbing cursor-move">
        <span className="text-slate-400 hover:text-slate-600 select-none transition-colors duration-200" aria-hidden title="Arrastra para mover">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </span>
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: indicador.colorPrincipal ?? '#4f46e5' }}
        />
        <h2 className="font-semibold text-slate-900 tracking-tight truncate">{indicador.titulo}</h2>
        {indicador.descripcion && (
          <span className="text-xs text-slate-500 truncate hidden sm:inline">— {indicador.descripcion}</span>
        )}
      </div>
      {/* Área del gráfico */}
      <div className="flex-1 min-h-0 overflow-hidden p-4">
        {loading && (
          <div className="w-full h-full min-h-[160px] bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-500 text-sm transition-opacity duration-200 border border-slate-200/80">
            Cargando datos…
          </div>
        )}
        {!loading && error && (
          <div className="w-full h-full min-h-[160px] bg-red-50/80 border border-red-200/80 text-red-700 p-4 text-sm text-center rounded-xl flex items-center justify-center">
            Error SQL: {error}
          </div>
        )}
        {!loading && !error && (!indicadorConDatos.datos || indicadorConDatos.datos.length === 0) && indicador.tipoGrafico !== 'table' && (
          <div className="flex items-center justify-center h-full min-h-[160px] text-slate-500 text-sm rounded-xl bg-slate-50/80 border border-dashed border-slate-200/80">
            Sin datos para este indicador
          </div>
        )}
        {!loading && !error && indicador.tipoGrafico === 'table' && !tableData?.length && (
          <div className="flex items-center justify-center h-full min-h-[160px] text-slate-500 text-sm rounded-xl bg-slate-50/80 border border-dashed border-slate-200/80">
            Sin datos para esta tabla
          </div>
        )}
        {!loading && !error && indicador.tipoGrafico === 'table' && (tableData?.length ?? 0) > 0 && (
          <DataTable
            data={tableData ?? []}
            onExportExcel={() => descargarExcel(tableData ?? [], `Detalle_Datos_${indicador.titulo.replace(/\s+/g, '_')}.xlsx`)}
          />
        )}
        {!loading && !error && indicadorConDatos.datos?.length > 0 && indicador.tipoGrafico === 'scorecard' && (
          <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-slate-900 tabular-nums">
              {formatValue(indicadorConDatos.datos[0].valorLogrado, indicador.unidad)}
            </span>
            <span className="text-sm text-slate-500 mt-2">{indicador.titulo}</span>
          </div>
        )}
        {!loading && !error && indicadorConDatos.datos?.length > 0 && indicador.tipoGrafico !== 'scorecard' && indicador.tipoGrafico !== 'table' && (
          <ChartRenderer indicador={indicadorConDatos} height={240} />
        )}
      </div>
    </div>
  );
}

export function DraggableCanvas({ indicadores, filtroGlobal, start, end }: DraggableCanvasProps) {
  const [layout, setLayout] = useState<Layout>(() => buildLayout(indicadores));
  const [saving, setSaving] = useState(false);
  const [liveDataByInd, setLiveDataByInd] = useState<Record<string, { periodo: string; valorLogrado: number; valorMetaEspecifica: number | null }[]>>({});
  const [liveRawDataByInd, setLiveRawDataByInd] = useState<Record<string, Record<string, unknown>[]>>({});
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

  // Cargar datos en vivo para indicadores con usaDatosDinamicos (reactivo al rango de fechas)
  useEffect(() => {
    const filtros = { start: start ?? undefined, end: end ?? undefined };
    for (const ind of indicadores) {
      if (!ind.usaDatosDinamicos || !ind.cadenaConexion?.trim() || !ind.consultaSql?.trim()) continue;
      setLiveLoading((prev) => ({ ...prev, [ind.id]: true }));
      setLiveError((prev) => ({ ...prev, [ind.id]: '' }));
      ejecutarConsulta(ind.cadenaConexion.trim(), ind.consultaSql.trim(), filtros).then((result) => {
        if ('error' in result) {
          setLiveError((prev) => ({ ...prev, [ind.id]: result.error }));
          setLiveDataByInd((prev) => ({ ...prev, [ind.id]: [] }));
          setLiveRawDataByInd((prev) => ({ ...prev, [ind.id]: [] }));
        } else {
          const datos = recordsetToDatos(result.data, ind.metaGlobal);
          setLiveDataByInd((prev) => ({ ...prev, [ind.id]: datos }));
          setLiveRawDataByInd((prev) => ({ ...prev, [ind.id]: result.data }));
          setLiveError((prev) => ({ ...prev, [ind.id]: '' }));
        }
        setLiveLoading((prev) => ({ ...prev, [ind.id]: false }));
      });
    }
  }, [indicadores, start, end]);

  if (indicadores.length === 0) return null;

  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: false,
    initialWidth: 1200,
  });

  return (
    <div className="relative bg-slate-50 rounded-xl p-1" ref={containerRef}>
      {saving && (
        <div className="absolute top-2 right-2 z-10 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700">
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
                liveRawData={ind.usaDatosDinamicos ? liveRawDataByInd[ind.id] : undefined}
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
