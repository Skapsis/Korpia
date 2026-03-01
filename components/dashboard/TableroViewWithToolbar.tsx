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
  filtroGlobal?: string;
}

export function TableroViewWithToolbar({ tablero, indicadores, filtroGlobal }: TableroViewWithToolbarProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardToolbar tableroNombre={tablero.nombre} canvasRef={canvasRef} />

      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl" aria-hidden>{tablero.icono}</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{tablero.nombre}</h2>
                {tablero.descripcion && (
                  <p className="text-slate-500 text-sm mt-1">{tablero.descripcion}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {tablero.empresa.name} · {indicadores.length} indicador{indicadores.length !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
            <Link
              href="/configurador"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 no-print"
            >
              ← Configurador
            </Link>
          </header>

          {indicadores.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-600 font-medium">Sin indicadores</p>
              <p className="text-slate-400 text-sm mt-1">
                Agrega indicadores desde el <Link href="/configurador" className="text-blue-600 hover:underline">configurador</Link>.
              </p>
            </div>
          ) : (
            <div ref={canvasRef} className="dashboard-print-area">
              <DraggableCanvas indicadores={indicadores} filtroGlobal={filtroGlobal} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
