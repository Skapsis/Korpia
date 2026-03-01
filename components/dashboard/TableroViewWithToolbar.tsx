'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { DraggableCanvas, type IndicadorConGrid } from './DraggableCanvas';
import { DashboardToolbar } from './DashboardToolbar';

interface TableroViewWithToolbarProps {
  tablero: {
    id: string;
    nombre: string;
    icono: string;
    descripcion: string | null;
    empresa: { name: string };
  };
  indicadores: IndicadorConGrid[];
  /** Fecha inicio (YYYY-MM-DD) para filtro de rango. */
  start?: string;
  /** Fecha fin (YYYY-MM-DD) para filtro de rango. */
  end?: string;
}

export function TableroViewWithToolbar({ tablero, indicadores, start, end }: TableroViewWithToolbarProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <DashboardToolbar tableroNombre={tablero.nombre} canvasRef={canvasRef} />

      <div className="flex-1 p-8 md:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-5">
              <span className="text-4xl" aria-hidden>{tablero.icono}</span>
              <div>
                <h2 className="section-title">{tablero.nombre}</h2>
                {tablero.descripcion && (
                  <p className="text-slate-500 text-sm mt-2">{tablero.descripcion}</p>
                )}
                <p className="label-mini mt-2">
                  {tablero.empresa.name} · {indicadores.length} indicador{indicadores.length !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
            <Link
              href="/configurador"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 no-print py-1"
            >
              ← Configurador
            </Link>
          </header>

          {indicadores.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 border-dashed bg-white p-16 text-center">
              <p className="section-title">Sin indicadores</p>
              <p className="text-slate-500 text-sm mt-2">
                Agrega indicadores desde el <Link href="/configurador" className="text-indigo-600 hover:underline">configurador</Link>.
              </p>
            </div>
          ) : (
            <div ref={canvasRef} className="dashboard-print-area">
              <DraggableCanvas indicadores={indicadores} start={start} end={end} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
